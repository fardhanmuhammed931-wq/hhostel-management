import { Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { recordAuditLog } from '../utils/audit.js';

export async function getAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const hostelId = req.query.hostel_id as string;
    const studentId = req.query.student_id as string;

    let where: string[] = ["s.status = 'active'"];
    let params: any[] = [date];

    // If logged in as student, view only their own attendance records
    if (req.user?.role === 'student') {
      const [studentRec]: any = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (studentRec.length > 0) {
        where.push('s.id = ?');
        params.push(studentRec[0].id);
      }
    } else if (studentId) {
      where.push('s.id = ?');
      params.push(studentId);
    }

    if (hostelId) {
      where.push('h.id = ?');
      params.push(hostelId);
    }

    // Left join attendance on student_id and date so all active students show with their attendance status for that date!
    const [records]: any = await pool.query(
      `SELECT 
        s.id as student_id,
        s.student_id as student_code,
        s.full_name as student_name,
        s.department,
        r.room_number,
        h.name as hostel_name,
        h.id as hostel_id,
        COALESCE(a.status, 'not_marked') as attendance_status,
        a.id as attendance_id,
        a.remarks,
        a.date as attendance_date,
        u.full_name as recorded_by_name
       FROM students s
       LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
       LEFT JOIN rooms r ON r.id = ra.room_id
       LEFT JOIN hostels h ON h.id = r.hostel_id
       LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
       LEFT JOIN users u ON u.id = a.recorded_by
       WHERE ${where.join(' AND ')}
       ORDER BY h.name ASC, r.room_number ASC, s.full_name ASC`,
      params
    );

    // Calculate summary statistics
    let presentCount = 0;
    let absentCount = 0;
    let onLeaveCount = 0;
    let notMarkedCount = 0;

    records.forEach((r: any) => {
      if (r.attendance_status === 'present') presentCount++;
      else if (r.attendance_status === 'absent') absentCount++;
      else if (r.attendance_status === 'on_leave') onLeaveCount++;
      else notMarkedCount++;
    });

    res.json({
      success: true,
      data: records,
      summary: {
        date,
        totalStudents: records.length,
        present: presentCount,
        absent: absentCount,
        onLeave: onLeaveCount,
        notMarked: notMarkedCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function markAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { student_id, date, status, remarks } = req.body;

    if (!student_id || !date || !status) {
      throw new ApiError(400, 'Student ID, date, and status (present/absent/on_leave) are required.');
    }

    // Upsert using ON DUPLICATE KEY UPDATE to prevent duplicates and allow corrections
    await pool.query(
      `INSERT INTO attendance (student_id, date, status, remarks, recorded_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), recorded_by = VALUES(recorded_by), updated_at = NOW()`,
      [student_id, date, status, remarks || null, req.user?.id || null]
    );

    res.json({
      success: true,
      message: 'Attendance recorded successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function markBulkAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date, entries } = req.body; // entries: [{ student_id, status, remarks }]

    if (!date || !Array.isArray(entries) || entries.length === 0) {
      throw new ApiError(400, 'Date and attendance entries array are required.');
    }

    for (const item of entries) {
      if (item.student_id && item.status) {
        await pool.query(
          `INSERT INTO attendance (student_id, date, status, remarks, recorded_by)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), recorded_by = VALUES(recorded_by)`,
          [item.student_id, date, item.status, item.remarks || null, req.user?.id || null]
        );
      }
    }

    await recordAuditLog(
      req.user?.id || null,
      'MARK_BULK_ATTENDANCE',
      'attendance',
      null,
      `Marked attendance for ${entries.length} students on ${date}`
    );

    res.json({
      success: true,
      message: `Successfully updated attendance for ${entries.length} students.`,
    });
  } catch (error) {
    next(error);
  }
}
