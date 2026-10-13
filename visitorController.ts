import { Response, NextFunction } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { jsonToCsv } from '../utils/csvExport.js';
import { recordAuditLog } from '../utils/audit.js';

export async function getVisitorLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.query.status as string; // 'checked_in' or 'checked_out'
    const studentId = req.query.student_id as string;
    const date = req.query.date as string;
    const search = (req.query.search as string || '').trim();

    let where: string[] = ['1=1'];
    let params: any[] = [];

    if (req.user?.role === 'student') {
      const [studentRec]: any = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (studentRec.length > 0) {
        where.push('vl.student_id = ?');
        params.push(studentRec[0].id);
      }
    } else if (studentId) {
      where.push('vl.student_id = ?');
      params.push(studentId);
    }

    if (status) {
      where.push('vl.status = ?');
      params.push(status);
    }

    if (date) {
      where.push('DATE(vl.check_in_time) = ?');
      params.push(date);
    }

    if (search) {
      where.push('(v.name LIKE ? OR v.phone LIKE ? OR s.full_name LIKE ? OR s.student_id LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [logs]: any = await pool.query(
      `SELECT vl.*,
              v.name as visitor_name, v.phone as visitor_phone, v.id_proof_type, v.id_proof_number,
              s.full_name as student_name, s.student_id as student_code,
              r.room_number, h.name as hostel_name,
              u.full_name as recorded_by_name
       FROM visitor_logs vl
       JOIN visitors v ON v.id = vl.visitor_id
       JOIN students s ON s.id = vl.student_id
       LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
       LEFT JOIN rooms r ON r.id = ra.room_id
       LEFT JOIN hostels h ON h.id = r.hostel_id
       LEFT JOIN users u ON u.id = vl.recorded_by
       WHERE ${where.join(' AND ')}
       ORDER BY vl.check_in_time DESC`,
      params
    );

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
}

export async function checkInVisitor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      name,
      phone,
      id_proof_type,
      id_proof_number,
      address,
      student_id,
      relationship,
      purpose,
      remarks,
    } = req.body;

    if (!name || !phone || !student_id || !relationship || !purpose) {
      throw new ApiError(400, 'Visitor name, phone, student, relationship, and purpose are required.');
    }

    const logId = await withTransaction(async (conn) => {
      // 1. Find or create visitor
      const [existingVisitors]: any = await conn.query('SELECT id FROM visitors WHERE phone = ?', [phone.trim()]);
      let visitorId: number;

      if (existingVisitors.length > 0) {
        visitorId = existingVisitors[0].id;
        // Update contact details if provided
        await conn.query(
          `UPDATE visitors SET name = ?, id_proof_type = COALESCE(?, id_proof_type), id_proof_number = COALESCE(?, id_proof_number) WHERE id = ?`,
          [name.trim(), id_proof_type, id_proof_number, visitorId]
        );
      } else {
        const [insertVis]: any = await conn.query(
          `INSERT INTO visitors (name, phone, id_proof_type, id_proof_number, address) VALUES (?, ?, ?, ?, ?)`,
          [name.trim(), phone.trim(), id_proof_type || null, id_proof_number || null, address || null]
        );
        visitorId = insertVis.insertId;
      }

      // 2. Insert visitor log
      const [insertLog]: any = await conn.query(
        `INSERT INTO visitor_logs (visitor_id, student_id, relationship, purpose, check_in_time, status, recorded_by, remarks)
         VALUES (?, ?, ?, ?, NOW(), 'checked_in', ?, ?)`,
        [visitorId, student_id, relationship.trim(), purpose.trim(), req.user?.id || null, remarks || null]
      );

      return insertLog.insertId;
    });

    await recordAuditLog(req.user?.id || null, 'VISITOR_CHECK_IN', 'visitor_logs', logId, `Checked in visitor ${name}`);

    res.status(201).json({
      success: true,
      message: 'Visitor checked in successfully.',
      data: { logId },
    });
  } catch (error) {
    next(error);
  }
}

export async function checkOutVisitor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const { remarks } = req.body;

    const [logs]: any = await pool.query("SELECT * FROM visitor_logs WHERE id = ? AND status = 'checked_in'", [id]);
    if (logs.length === 0) {
      throw new ApiError(404, 'Active visitor check-in record not found.');
    }

    await pool.query(
      `UPDATE visitor_logs SET 
        check_out_time = NOW(),
        status = 'checked_out',
        remarks = CONCAT(COALESCE(remarks, ''), ' ', COALESCE(?, ''))
       WHERE id = ?`,
      [remarks ? `[Exit note: ${remarks}]` : '', id]
    );

    await recordAuditLog(req.user?.id || null, 'VISITOR_CHECK_OUT', 'visitor_logs', id, 'Visitor checked out');

    res.json({
      success: true,
      message: 'Visitor checked out successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function exportVisitorsCsv(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [logs]: any = await pool.query(`
      SELECT 
        v.name as visitor_name,
        v.phone as visitor_phone,
        s.full_name as student_name,
        s.student_id as student_code,
        vl.relationship,
        vl.purpose,
        vl.check_in_time,
        COALESCE(vl.check_out_time, 'Still Checked In') as check_out_time,
        vl.status,
        COALESCE(u.full_name, 'Staff') as recorded_by
      FROM visitor_logs vl
      JOIN visitors v ON v.id = vl.visitor_id
      JOIN students s ON s.id = vl.student_id
      LEFT JOIN users u ON u.id = vl.recorded_by
      ORDER BY vl.check_in_time DESC
    `);

    const columns = [
      { key: 'visitor_name', label: 'Visitor Name' },
      { key: 'visitor_phone', label: 'Phone' },
      { key: 'student_name', label: 'Visiting Student' },
      { key: 'student_code', label: 'Student ID' },
      { key: 'relationship', label: 'Relationship' },
      { key: 'purpose', label: 'Purpose' },
      { key: 'check_in_time', label: 'Check-In' },
      { key: 'check_out_time', label: 'Check-Out' },
      { key: 'status', label: 'Status' },
      { key: 'recorded_by', label: 'Recorded By' },
    ];

    const csvContent = jsonToCsv(logs, columns);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="visitors_report.csv"');
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
}
