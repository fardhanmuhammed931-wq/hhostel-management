import { Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Total students
    const [studentsResult]: any = await pool.query(
      `SELECT COUNT(*) as totalStudents FROM students WHERE status = 'active'`
    );

    // 2. Room stats
    const [roomsResult]: any = await pool.query(`
      SELECT 
        COUNT(*) as totalRooms,
        COALESCE(SUM(capacity), 0) as totalCapacity,
        COALESCE(SUM(current_occupancy), 0) as totalOccupancy,
        SUM(CASE WHEN status = 'full' THEN 1 ELSE 0 END) as fullRooms,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as availableRooms,
        SUM(CASE WHEN status = 'partially_occupied' THEN 1 ELSE 0 END) as partialRooms,
        SUM(CASE WHEN status = 'under_maintenance' THEN 1 ELSE 0 END) as maintenanceRooms
      FROM rooms
    `);

    // 3. Fee stats
    const [feeStats]: any = await pool.query(`
      SELECT 
        COALESCE(SUM(amount_due - amount_paid), 0) as totalPendingFees,
        COALESCE(SUM(amount_paid), 0) as totalCollectedFees
      FROM fee_records
    `);

    // 4. Pending Maintenance
    const [maintenanceStats]: any = await pool.query(`
      SELECT COUNT(*) as pendingMaintenance
      FROM maintenance_requests
      WHERE status IN ('submitted', 'in_progress')
    `);

    // 5. Today's Visitors
    const [visitorStats]: any = await pool.query(`
      SELECT COUNT(*) as todayVisitors
      FROM visitor_logs
      WHERE DATE(check_in_time) = CURDATE()
    `);

    const totalRooms = Number(roomsResult[0]?.totalRooms || 0);
    const totalCapacity = Number(roomsResult[0]?.totalCapacity || 0);
    const totalOccupancy = Number(roomsResult[0]?.totalOccupancy || 0);
    const fullRooms = Number(roomsResult[0]?.fullRooms || 0);
    const partialRooms = Number(roomsResult[0]?.partialRooms || 0);
    const occupiedRooms = fullRooms + partialRooms;
    const availableRooms = Number(roomsResult[0]?.availableRooms || 0);

    const occupancyPercentage = totalCapacity > 0
      ? Math.round((totalOccupancy / totalCapacity) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalStudents: Number(studentsResult[0]?.totalStudents || 0),
        totalRooms,
        occupiedRooms,
        availableRooms,
        totalCapacity,
        totalOccupancy,
        totalPendingFees: Number(feeStats[0]?.totalPendingFees || 0),
        totalCollectedFees: Number(feeStats[0]?.totalCollectedFees || 0),
        pendingMaintenance: Number(maintenanceStats[0]?.pendingMaintenance || 0),
        todayVisitors: Number(visitorStats[0]?.todayVisitors || 0),
        occupancyPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardCharts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Monthly fee collection (last 6 months)
    const [monthlyFees]: any = await pool.query(`
      SELECT 
        DATE_FORMAT(payment_date, '%b %Y') as month,
        DATE_FORMAT(payment_date, '%Y-%m') as sortKey,
        COALESCE(SUM(amount), 0) as collected
      FROM payments
      WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(payment_date, '%b %Y'), DATE_FORMAT(payment_date, '%Y-%m')
      ORDER BY sortKey ASC
    `);

    // 2. Room Occupancy by Hostel
    const [hostelOccupancy]: any = await pool.query(`
      SELECT 
        h.name as hostelName,
        h.code as hostelCode,
        COALESCE(SUM(r.capacity), 0) as capacity,
        COALESCE(SUM(r.current_occupancy), 0) as occupied
      FROM hostels h
      LEFT JOIN rooms r ON r.hostel_id = h.id
      GROUP BY h.id, h.name, h.code
    `);

    // 3. Maintenance Requests by Category
    const [maintenanceByCategory]: any = await pool.query(`
      SELECT 
        category,
        COUNT(*) as count
      FROM maintenance_requests
      GROUP BY category
    `);

    // 4. Maintenance Requests by Status
    const [maintenanceByStatus]: any = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM maintenance_requests
      GROUP BY status
    `);

    res.json({
      success: true,
      data: {
        monthlyFees,
        hostelOccupancy,
        maintenanceByCategory,
        maintenanceByStatus,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardRecentActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Recent registrations
    const [recentStudents]: any = await pool.query(`
      SELECT id, student_id, full_name, department, admission_date, status, created_at
      FROM students
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Recent fee payments
    const [recentPayments]: any = await pool.query(`
      SELECT p.id, p.receipt_number, p.amount, p.payment_method, p.payment_date,
             s.full_name as student_name, s.student_id as student_code
      FROM payments p
      JOIN students s ON s.id = p.student_id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    // Recent visitor logs
    const [recentVisitors]: any = await pool.query(`
      SELECT vl.id, v.name as visitor_name, vl.relationship, vl.purpose,
             vl.check_in_time, vl.check_out_time, vl.status,
             s.full_name as student_name
      FROM visitor_logs vl
      JOIN visitors v ON v.id = vl.visitor_id
      JOIN students s ON s.id = vl.student_id
      ORDER BY vl.check_in_time DESC
      LIMIT 5
    `);

    // Recent maintenance requests
    const [recentMaintenance]: any = await pool.query(`
      SELECT mr.id, mr.ticket_number, mr.title, mr.category, mr.priority, mr.status, mr.created_at,
             s.full_name as student_name, r.room_number
      FROM maintenance_requests mr
      JOIN students s ON s.id = mr.student_id
      JOIN rooms r ON r.id = mr.room_id
      ORDER BY mr.created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        recentStudents,
        recentPayments,
        recentVisitors,
        recentMaintenance,
      },
    });
  } catch (error) {
    next(error);
  }
}
