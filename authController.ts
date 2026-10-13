import { Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { recordAuditLog } from '../utils/audit.js';

export async function login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Please provide both email and password.');
    }

    // Find user by email
    const [users]: any = await pool.query(
      `SELECT u.*, s.student_id, s.id as student_record_id, 
              r.id as room_id, r.room_number, h.id as hostel_id, h.name as hostel_name
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
       LEFT JOIN rooms r ON r.id = ra.room_id
       LEFT JOIN hostels h ON h.id = r.hostel_id
       WHERE u.email = ?`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const user = users[0];

    if (user.status !== 'active') {
      throw new ApiError(403, `Your account is ${user.status}. Please contact the hostel administrator.`);
    }

    // Verify password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    // Update last_login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const authUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      student_id: user.student_id || null,
      studentRecordId: user.student_record_id || null,
      hostel_id: user.hostel_id || null,
      hostel_name: user.hostel_name || null,
      room_id: user.room_id || null,
      room_number: user.room_number || null,
    };

    const token = signToken(authUser as any);

    await recordAuditLog(user.id, 'USER_LOGIN', 'users', user.id, `User logged in from ${req.ip}`);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: authUser,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, full_name, phone, role = 'student', department, course, academic_year, gender } = req.body;

    if (!email || !password || !full_name) {
      throw new ApiError(400, 'Full name, email, and password are required.');
    }

    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long.');
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const [existing]: any = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      throw new ApiError(409, 'An account with this email address already exists.');
    }

    const passwordHash = await hashPassword(password);
    const userRole = ['admin', 'warden', 'student'].includes(role) ? role : 'student';

    // Insert user
    const [userResult]: any = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, phone, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [cleanEmail, passwordHash, full_name.trim(), userRole, phone?.trim() || null]
    );

    const userId = userResult.insertId;
    let studentCode = null;
    let studentRecordId = null;

    // If registering as student, create student profile
    if (userRole === 'student') {
      studentCode = req.body.student_id?.trim() || `STU-${new Date().getFullYear()}-${String(userId).padStart(3, '0')}`;
      const [stuResult]: any = await pool.query(
        `INSERT INTO students (user_id, student_id, full_name, email, phone, gender, department, course, academic_year, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          userId,
          studentCode,
          full_name.trim(),
          cleanEmail,
          phone?.trim() || 'N/A',
          gender || 'other',
          department || 'General',
          course || 'Undergraduate',
          academic_year || `${new Date().getFullYear()} - 1st Year`,
        ]
      );
      studentRecordId = stuResult.insertId;
    }

    const authUser = {
      id: userId,
      email: cleanEmail,
      full_name: full_name.trim(),
      role: userRole,
      phone: phone?.trim() || null,
      student_id: studentCode,
      studentRecordId: studentRecordId,
      hostel_id: null,
      hostel_name: null,
      room_id: null,
      room_number: null,
    };

    const token = signToken(authUser as any);
    await recordAuditLog(userId, 'USER_REGISTER', 'users', userId, `New account registered as ${userRole}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        token,
        user: authUser,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated.');
    }

    const [users]: any = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.phone, u.avatar_url, u.status, u.created_at,
              s.student_id, s.id as student_record_id, s.department, s.course, s.academic_year,
              r.id as room_id, r.room_number, h.id as hostel_id, h.name as hostel_name
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
       LEFT JOIN rooms r ON r.id = ra.room_id
       LEFT JOIN hostels h ON h.id = r.hostel_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      throw new ApiError(404, 'User not found.');
    }

    res.json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated.');
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Current password and new password are required.');
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, 'New password must be at least 6 characters long.');
    }

    const [users]: any = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      throw new ApiError(404, 'User not found.');
    }

    const isMatch = await comparePassword(currentPassword, users[0].password_hash);
    if (!isMatch) {
      throw new ApiError(400, 'Current password is incorrect.');
    }

    const newHash = await hashPassword(newPassword);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    await recordAuditLog(req.user.id, 'CHANGE_PASSWORD', 'users', req.user.id, 'Password updated');

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export function logout(req: AuthenticatedRequest, res: Response): void {
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
}
