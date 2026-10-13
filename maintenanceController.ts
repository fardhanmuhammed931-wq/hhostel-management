import { Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { recordAuditLog } from '../utils/audit.js';

export async function getMaintenanceRequests(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const category = req.query.category as string;
    const studentId = req.query.student_id as string;
    const search = (req.query.search as string || '').trim();

    let where: string[] = ['1=1'];
    let params: any[] = [];

    // If logged in as student, only show complaints submitted by this student
    if (req.user?.role === 'student') {
      const [studentRec]: any = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (studentRec.length > 0) {
        where.push('mr.student_id = ?');
        params.push(studentRec[0].id);
      }
    } else if (studentId) {
      where.push('mr.student_id = ?');
      params.push(studentId);
    }

    if (status) {
      where.push('mr.status = ?');
      params.push(status);
    }

    if (priority) {
      where.push('mr.priority = ?');
      params.push(priority);
    }

    if (category) {
      where.push('mr.category = ?');
      params.push(category);
    }

    if (search) {
      where.push('(mr.ticket_number LIKE ? OR mr.title LIKE ? OR mr.description LIKE ? OR s.full_name LIKE ? OR r.room_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [requests]: any = await pool.query(
      `SELECT mr.*, 
              s.full_name as student_name, s.student_id as student_code, s.phone as student_phone,
              r.room_number, r.floor,
              h.id as hostel_id, h.name as hostel_name,
              u.full_name as assigned_to_name
       FROM maintenance_requests mr
       JOIN students s ON s.id = mr.student_id
       JOIN rooms r ON r.id = mr.room_id
       JOIN hostels h ON h.id = r.hostel_id
       LEFT JOIN users u ON u.id = mr.assigned_to
       WHERE ${where.join(' AND ')}
       ORDER BY 
         CASE mr.priority
           WHEN 'emergency' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
           ELSE 5
         END,
         mr.created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
}

export async function createMaintenanceRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let { student_id, room_id, category, title, description, priority = 'medium' } = req.body;

    // If logged in as student, resolve their student_id and active room
    if (req.user?.role === 'student') {
      const [studentRec]: any = await pool.query(
        `SELECT s.id, ra.room_id 
         FROM students s
         LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
         WHERE s.user_id = ?`,
        [req.user.id]
      );

      if (studentRec.length === 0) {
        throw new ApiError(403, 'Student profile not linked.');
      }

      student_id = studentRec[0].id;
      if (!room_id) {
        room_id = studentRec[0].room_id;
      }
    }

    if (!student_id || !room_id || !category || !title || !description) {
      throw new ApiError(400, 'Student, room, category, title, and description are required.');
    }

    // Auto-generate ticket number: TKT-YYYY-RANDOM
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TKT-${year}-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const [result]: any = await pool.query(
      `INSERT INTO maintenance_requests (ticket_number, student_id, room_id, category, title, description, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [ticketNumber, student_id, room_id, category, title.trim(), description.trim(), priority]
    );

    await recordAuditLog(
      req.user?.id || null,
      'CREATE_MAINTENANCE_TICKET',
      'maintenance_requests',
      result.insertId,
      `Created ticket ${ticketNumber}: ${title}`
    );

    res.status(201).json({
      success: true,
      message: 'Maintenance complaint submitted successfully.',
      data: { id: result.insertId, ticketNumber },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMaintenanceRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, priority, assigned_to, resolution_notes } = req.body;

    const [existing]: any = await pool.query('SELECT * FROM maintenance_requests WHERE id = ?', [id]);
    if (existing.length === 0) {
      throw new ApiError(404, 'Maintenance request not found.');
    }

    const currentReq = existing[0];
    const resolvedAt = status === 'resolved' || status === 'closed'
      ? (currentReq.resolved_at || new Date().toISOString().slice(0, 19).replace('T', ' '))
      : (status ? null : currentReq.resolved_at);

    await pool.query(
      `UPDATE maintenance_requests SET 
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        assigned_to = COALESCE(?, assigned_to),
        resolution_notes = COALESCE(?, resolution_notes),
        resolved_at = ?
       WHERE id = ?`,
      [
        status,
        priority,
        assigned_to !== undefined ? assigned_to : null,
        resolution_notes,
        resolvedAt,
        id,
      ]
    );

    await recordAuditLog(
      req.user?.id || null,
      'UPDATE_MAINTENANCE_TICKET',
      'maintenance_requests',
      id,
      `Updated ticket ID ${id} (status: ${status || currentReq.status})`
    );

    res.json({
      success: true,
      message: 'Maintenance ticket updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}
