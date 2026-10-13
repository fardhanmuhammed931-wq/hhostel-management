import { Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { hashPassword } from '../utils/password.js';
import { recordAuditLog } from '../utils/audit.js';

export async function getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const role = req.query.role as string;
    const status = req.query.status as string;
    const search = (req.query.search as string || '').trim();

    let where: string[] = ['1=1'];
    let params: any[] = [];

    if (role) {
      where.push('u.role = ?');
      params.push(role);
    }

    if (status) {
      where.push('u.status = ?');
      params.push(status);
    }

    if (search) {
      where.push('(u.email LIKE ? OR u.full_name LIKE ? OR u.phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [users]: any = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.phone, u.status, u.last_login, u.created_at,
              s.student_id, s.department
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       WHERE ${where.join(' AND ')}
       ORDER BY u.created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, full_name, role, phone, status = 'active' } = req.body;

    if (!email || !password || !full_name || !role) {
      throw new ApiError(400, 'Email, password, full name, and role are required.');
    }

    const [existing]: any = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      throw new ApiError(409, `Email '${email}' is already in use.`);
    }

    const passwordHash = await hashPassword(password);

    const [result]: any = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, phone, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email.trim().toLowerCase(), passwordHash, full_name.trim(), role, phone || null, status]
    );

    await recordAuditLog(req.user?.id || null, 'CREATE_USER', 'users', result.insertId, `Created user ${email} with role ${role}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: { id: result.insertId, email, role },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, role } = req.body;

    if (id === req.user?.id && status && status !== 'active') {
      throw new ApiError(400, 'You cannot deactivate your own administrative account.');
    }

    await pool.query(
      `UPDATE users SET 
        status = COALESCE(?, status),
        role = COALESCE(?, role)
       WHERE id = ?`,
      [status, role, id]
    );

    await recordAuditLog(req.user?.id || null, 'UPDATE_USER_STATUS', 'users', id, `Updated status to ${status}`);

    res.json({
      success: true,
      message: 'User updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      throw new ApiError(400, 'New password must be at least 6 characters.');
    }

    const passwordHash = await hashPassword(newPassword);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);

    await recordAuditLog(req.user?.id || null, 'RESET_PASSWORD', 'users', id, `Password reset by administrator`);

    res.json({
      success: true,
      message: 'User password reset successfully.',
    });
  } catch (error) {
    next(error);
  }
}
