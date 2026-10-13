import { Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { recordAuditLog } from '../utils/audit.js';

export async function getFees(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.query.student_id as string;
    const status = req.query.status as string;
    const category = req.query.category as string;
    const period = req.query.academic_period as string;
    const search = (req.query.search as string || '').trim();

    let where: string[] = ['1=1'];
    let params: any[] = [];

    // If logged in as student, enforce viewing only their own fees
    if (req.user?.role === 'student') {
      const [studentRec]: any = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (studentRec.length > 0) {
        where.push('fr.student_id = ?');
        params.push(studentRec[0].id);
      }
    } else if (studentId) {
      where.push('fr.student_id = ?');
      params.push(studentId);
    }

    if (status) {
      where.push('fr.status = ?');
      params.push(status);
    }

    if (category) {
      where.push('fr.fee_category = ?');
      params.push(category);
    }

    if (period) {
      where.push('fr.academic_period = ?');
      params.push(period);
    }

    if (search) {
      where.push('(s.full_name LIKE ? OR s.student_id LIKE ? OR fr.academic_period LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Update overdue statuses automatically
    await pool.query(
      "UPDATE fee_records SET status = 'overdue' WHERE due_date < CURDATE() AND status IN ('pending', 'partially_paid')"
    );

    const [fees]: any = await pool.query(
      `SELECT fr.*, 
              s.full_name as student_name, s.student_id as student_code, s.email as student_email,
              r.room_number, h.name as hostel_name
       FROM fee_records fr
       JOIN students s ON s.id = fr.student_id
       LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
       LEFT JOIN rooms r ON r.id = ra.room_id
       LEFT JOIN hostels h ON h.id = r.hostel_id
       WHERE ${where.join(' AND ')}
       ORDER BY fr.due_date DESC`,
      params
    );

    // Summary calculations
    const [summary]: any = await pool.query(
      `SELECT 
        COALESCE(SUM(amount_due), 0) as totalDue,
        COALESCE(SUM(amount_paid), 0) as totalPaid,
        COALESCE(SUM(amount_due - amount_paid), 0) as totalOutstanding,
        COALESCE(SUM(CASE WHEN due_date < CURDATE() AND status != 'paid' THEN (amount_due - amount_paid) ELSE 0 END), 0) as totalOverdue
       FROM fee_records fr
       WHERE ${where.join(' AND ')}`,
      params
    );

    res.json({
      success: true,
      data: fees,
      summary: summary[0] || { totalDue: 0, totalPaid: 0, totalOutstanding: 0, totalOverdue: 0 },
    });
  } catch (error) {
    next(error);
  }
}

export async function createFee(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { student_id, fee_category, academic_period, amount_due, due_date, description } = req.body;

    if (!student_id || !fee_category || !academic_period || !amount_due || !due_date) {
      throw new ApiError(400, 'All fee obligation fields are required.');
    }

    const numericAmount = parseFloat(amount_due);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new ApiError(400, 'Amount due must be a valid positive number.');
    }

    const [result]: any = await pool.query(
      `INSERT INTO fee_records (student_id, fee_category, academic_period, amount_due, amount_paid, due_date, status, description)
       VALUES (?, ?, ?, ?, 0.00, ?, 'pending', ?)`,
      [student_id, fee_category, academic_period.trim(), numericAmount, due_date, description || null]
    );

    await recordAuditLog(
      req.user?.id || null,
      'CREATE_FEE',
      'fee_records',
      result.insertId,
      `Created fee record $${numericAmount} for student ID ${student_id}`
    );

    res.status(201).json({
      success: true,
      message: 'Fee obligation created successfully.',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
}
