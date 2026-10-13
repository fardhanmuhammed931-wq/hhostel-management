import { Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { jsonToCsv } from '../utils/csvExport.js';

export async function getOccupancyReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [hostelStats]: any = await pool.query(`
      SELECT 
        h.id,
        h.name,
        h.code,
        h.type,
        COUNT(r.id) as total_rooms,
        COALESCE(SUM(r.capacity), 0) as total_capacity,
        COALESCE(SUM(r.current_occupancy), 0) as current_occupancy,
        COALESCE(SUM(r.capacity - r.current_occupancy), 0) as available_beds,
        ROUND((COALESCE(SUM(r.current_occupancy), 0) / NULLIF(SUM(r.capacity), 0)) * 100, 1) as occupancy_rate
      FROM hostels h
      LEFT JOIN rooms r ON r.hostel_id = h.id
      GROUP BY h.id
      ORDER BY h.name ASC
    `);

    const [roomsList]: any = await pool.query(`
      SELECT 
        r.id,
        r.room_number,
        h.name as hostel_name,
        r.floor,
        r.room_type,
        r.capacity,
        r.current_occupancy,
        (r.capacity - r.current_occupancy) as available_beds,
        r.status,
        r.fee_per_month
      FROM rooms r
      JOIN hostels h ON h.id = r.hostel_id
      ORDER BY h.name ASC, r.room_number ASC
    `);

    res.json({
      success: true,
      data: {
        hostelStats,
        roomsList,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getFeeReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const period = req.query.period as string;
    let where = '1=1';
    let params: any[] = [];

    if (period) {
      where += ' AND fr.academic_period = ?';
      params.push(period);
    }

    const [categoryBreakdown]: any = await pool.query(
      `SELECT 
        fr.fee_category,
        COUNT(fr.id) as total_invoices,
        COALESCE(SUM(fr.amount_due), 0) as total_due,
        COALESCE(SUM(fr.amount_paid), 0) as total_paid,
        COALESCE(SUM(fr.amount_due - fr.amount_paid), 0) as total_balance
       FROM fee_records fr
       WHERE ${where}
       GROUP BY fr.fee_category`,
      params
    );

    const [statusBreakdown]: any = await pool.query(
      `SELECT 
        fr.status,
        COUNT(fr.id) as count,
        COALESCE(SUM(fr.amount_due - fr.amount_paid), 0) as balance_amount
       FROM fee_records fr
       WHERE ${where}
       GROUP BY fr.status`,
      params
    );

    const [paymentMethods]: any = await pool.query(
      `SELECT 
        payment_method,
        COUNT(id) as count,
        COALESCE(SUM(amount), 0) as total_amount
       FROM payments
       GROUP BY payment_method`
    );

    res.json({
      success: true,
      data: {
        categoryBreakdown,
        statusBreakdown,
        paymentMethods,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMaintenanceReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [byCategory]: any = await pool.query(`
      SELECT 
        category,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'resolved' OR status = 'closed' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN status = 'submitted' OR status = 'in_progress' THEN 1 ELSE 0 END) as pending_count
      FROM maintenance_requests
      GROUP BY category
    `);

    const [byPriority]: any = await pool.query(`
      SELECT 
        priority,
        COUNT(*) as total
      FROM maintenance_requests
      GROUP BY priority
    `);

    res.json({
      success: true,
      data: {
        byCategory,
        byPriority,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function exportReportCsv(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const reportType = req.params.type; // 'occupancy' | 'fees' | 'maintenance'

    if (reportType === 'occupancy') {
      const [rows]: any = await pool.query(`
        SELECT 
          h.name as hostel_name,
          r.room_number,
          r.floor,
          r.room_type,
          r.capacity,
          r.current_occupancy,
          (r.capacity - r.current_occupancy) as available_beds,
          r.fee_per_month,
          r.status
        FROM rooms r
        JOIN hostels h ON h.id = r.hostel_id
        ORDER BY h.name ASC, r.room_number ASC
      `);

      const columns = [
        { key: 'hostel_name', label: 'Hostel' },
        { key: 'room_number', label: 'Room' },
        { key: 'floor', label: 'Floor' },
        { key: 'room_type', label: 'Type' },
        { key: 'capacity', label: 'Capacity' },
        { key: 'current_occupancy', label: 'Occupied' },
        { key: 'available_beds', label: 'Available Beds' },
        { key: 'fee_per_month', label: 'Monthly Fee ($)' },
        { key: 'status', label: 'Status' },
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="occupancy_report.csv"');
      res.send(jsonToCsv(rows, columns));
    } else if (reportType === 'fees') {
      const [rows]: any = await pool.query(`
        SELECT 
          s.student_id,
          s.full_name as student_name,
          fr.fee_category,
          fr.academic_period,
          fr.amount_due,
          fr.amount_paid,
          (fr.amount_due - fr.amount_paid) as balance,
          fr.due_date,
          fr.status
        FROM fee_records fr
        JOIN students s ON s.id = fr.student_id
        ORDER BY fr.due_date DESC
      `);

      const columns = [
        { key: 'student_id', label: 'Student ID' },
        { key: 'student_name', label: 'Student Name' },
        { key: 'fee_category', label: 'Category' },
        { key: 'academic_period', label: 'Period' },
        { key: 'amount_due', label: 'Amount Due ($)' },
        { key: 'amount_paid', label: 'Amount Paid ($)' },
        { key: 'balance', label: 'Balance ($)' },
        { key: 'due_date', label: 'Due Date' },
        { key: 'status', label: 'Status' },
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="fees_report.csv"');
      res.send(jsonToCsv(rows, columns));
    } else {
      res.status(400).json({ success: false, message: 'Invalid report type requested.' });
    }
  } catch (error) {
    next(error);
  }
}
