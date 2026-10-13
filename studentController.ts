import { Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { jsonToCsv } from '../utils/csvExport.js';
import { recordAuditLog } from '../utils/audit.js';

export async function getStudents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '10', 10)));
    const offset = (page - 1) * limit;

    const search = (req.query.search as string || '').trim();
    const department = (req.query.department as string || '').trim();
    const status = (req.query.status as string || '').trim();
    const hostelId = req.query.hostel_id as string;
    const gender = (req.query.gender as string || '').trim();

    let whereConditions: string[] = ['1=1'];
    let params: any[] = [];

    if (search) {
      whereConditions.push('(s.full_name LIKE ? OR s.student_id LIKE ? OR s.email LIKE ? OR s.department LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (department) {
      whereConditions.push('s.department = ?');
      params.push(department);
    }

    if (status) {
      whereConditions.push('s.status = ?');
      params.push(status);
    }

    if (gender) {
      whereConditions.push('s.gender = ?');
      params.push(gender);
    }

    if (hostelId) {
      whereConditions.push('h.id = ?');
      params.push(hostelId);
    }

    const whereClause = whereConditions.join(' AND ');

    // Count query
    const [countResult]: any = await pool.query(
      `SELECT COUNT(DISTINCT s.id) as total
       FROM students s
       LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
       LEFT JOIN rooms r ON r.id = ra.room_id
       LEFT JOIN hostels h ON h.id = r.hostel_id
       WHERE ${whereClause}`,
      params
    );

    const total = countResult[0]?.total || 0;

    // Data query
    const [students]: any = await pool.query(
      `SELECT s.*, 
              r.id as room_id, r.room_number,
              h.id as hostel_id, h.name as hostel_name,
              ra.id as allocation_id, ra.bed_number, ra.start_date as allocated_since
       FROM students s
       LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
       LEFT JOIN rooms r ON r.id = ra.room_id
       LEFT JOIN hostels h ON h.id = r.hostel_id
       WHERE ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudentById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = parseInt(req.params.id, 10);

    // If role is student, check if accessing their own record
    if (req.user?.role === 'student' && req.user.student_id) {
      const [ownStudent]: any = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (ownStudent.length === 0 || ownStudent[0].id !== studentId) {
        throw new ApiError(403, 'You are not authorized to view this student profile.');
      }
    }

    // 1. Student details
    const [students]: any = await pool.query(
      `SELECT s.*, 
              r.id as room_id, r.room_number, r.room_type, r.floor, r.fee_per_month,
              h.id as hostel_id, h.name as hostel_name, h.code as hostel_code,
              ra.id as allocation_id, ra.bed_number, ra.start_date as allocation_start_date
       FROM students s
       LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
       LEFT JOIN rooms r ON r.id = ra.room_id
       LEFT JOIN hostels h ON h.id = r.hostel_id
       WHERE s.id = ?`,
      [studentId]
    );

    if (students.length === 0) {
      throw new ApiError(404, 'Student not found.');
    }

    const student = students[0];

    // 2. Allocation history
    const [allocations]: any = await pool.query(
      `SELECT ra.*, r.room_number, h.name as hostel_name, u.full_name as allocated_by_name
       FROM room_allocations ra
       JOIN rooms r ON r.id = ra.room_id
       JOIN hostels h ON h.id = r.hostel_id
       LEFT JOIN users u ON u.id = ra.allocated_by
       WHERE ra.student_id = ?
       ORDER BY ra.created_at DESC`,
      [studentId]
    );

    // 3. Fee records & payments
    const [feeRecords]: any = await pool.query(
      `SELECT * FROM fee_records WHERE student_id = ? ORDER BY due_date DESC`,
      [studentId]
    );

    const [payments]: any = await pool.query(
      `SELECT p.*, fr.fee_category, fr.academic_period
       FROM payments p
       JOIN fee_records fr ON fr.id = p.fee_record_id
       WHERE p.student_id = ?
       ORDER BY p.payment_date DESC`,
      [studentId]
    );

    // 4. Complaints history
    const [complaints]: any = await pool.query(
      `SELECT mr.*, r.room_number
       FROM maintenance_requests mr
       JOIN rooms r ON r.id = mr.room_id
       WHERE mr.student_id = ?
       ORDER BY mr.created_at DESC`,
      [studentId]
    );

    res.json({
      success: true,
      data: {
        ...student,
        allocations,
        feeRecords,
        payments,
        complaints,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      student_id,
      full_name,
      email,
      phone,
      gender,
      date_of_birth,
      department,
      course,
      academic_year,
      guardian_name,
      guardian_phone,
      address,
      admission_date,
      status = 'active',
    } = req.body;

    if (!student_id || !full_name || !email || !phone || !gender || !department || !course || !academic_year || !guardian_name || !guardian_phone || !address || !admission_date) {
      throw new ApiError(400, 'Please fill in all required fields.');
    }

    // Check unique student_id and email
    const [existing]: any = await pool.query(
      'SELECT id, student_id, email FROM students WHERE student_id = ? OR email = ?',
      [student_id.trim(), email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      if (existing[0].student_id === student_id.trim()) {
        throw new ApiError(409, `Student ID '${student_id}' is already registered.`);
      }
      throw new ApiError(409, `Email '${email}' is already registered.`);
    }

    const [result]: any = await pool.query(
      `INSERT INTO students (
        student_id, full_name, email, phone, gender, date_of_birth,
        department, course, academic_year, guardian_name, guardian_phone,
        address, admission_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id.trim(),
        full_name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        gender,
        date_of_birth || null,
        department.trim(),
        course.trim(),
        academic_year.trim(),
        guardian_name.trim(),
        guardian_phone.trim(),
        address.trim(),
        admission_date,
        status,
      ]
    );

    await recordAuditLog(req.user?.id || null, 'CREATE_STUDENT', 'students', result.insertId, `Created student ${full_name} (${student_id})`);

    res.status(201).json({
      success: true,
      message: 'Student registered successfully.',
      data: { id: result.insertId, student_id, full_name },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      full_name,
      email,
      phone,
      gender,
      date_of_birth,
      department,
      course,
      academic_year,
      guardian_name,
      guardian_phone,
      address,
      status,
    } = req.body;

    const [existing]: any = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    if (existing.length === 0) {
      throw new ApiError(404, 'Student not found.');
    }

    // Check duplicate email
    if (email && email.trim().toLowerCase() !== existing[0].email) {
      const [emailCheck]: any = await pool.query('SELECT id FROM students WHERE email = ? AND id != ?', [email.trim().toLowerCase(), id]);
      if (emailCheck.length > 0) {
        throw new ApiError(409, `Email '${email}' is already in use by another student.`);
      }
    }

    await pool.query(
      `UPDATE students SET 
        full_name = COALESCE(?, full_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        gender = COALESCE(?, gender),
        date_of_birth = COALESCE(?, date_of_birth),
        department = COALESCE(?, department),
        course = COALESCE(?, course),
        academic_year = COALESCE(?, academic_year),
        guardian_name = COALESCE(?, guardian_name),
        guardian_phone = COALESCE(?, guardian_phone),
        address = COALESCE(?, address),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        full_name?.trim(),
        email?.trim().toLowerCase(),
        phone?.trim(),
        gender,
        date_of_birth,
        department?.trim(),
        course?.trim(),
        academic_year?.trim(),
        guardian_name?.trim(),
        guardian_phone?.trim(),
        address?.trim(),
        status,
        id,
      ]
    );

    await recordAuditLog(req.user?.id || null, 'UPDATE_STUDENT', 'students', id, `Updated student info for ID ${id}`);

    res.json({
      success: true,
      message: 'Student record updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);

    // Check active allocation
    const [allocations]: any = await pool.query(
      "SELECT id FROM room_allocations WHERE student_id = ? AND status = 'active'",
      [id]
    );

    if (allocations.length > 0) {
      throw new ApiError(400, 'Cannot remove student with an active room allocation. Please check out the student first.');
    }

    // Check financial history
    const [fees]: any = await pool.query('SELECT id FROM fee_records WHERE student_id = ?', [id]);
    if (fees.length > 0) {
      // Rather than deleting, update status to inactive/archived to maintain financial integrity
      await pool.query("UPDATE students SET status = 'inactive' WHERE id = ?", [id]);
      res.json({
        success: true,
        message: 'Student has fee records and cannot be permanently deleted. Status updated to Inactive.',
      });
      return;
    }

    await pool.query('DELETE FROM students WHERE id = ?', [id]);
    await recordAuditLog(req.user?.id || null, 'DELETE_STUDENT', 'students', id, `Deleted student ID ${id}`);

    res.json({
      success: true,
      message: 'Student record deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function exportStudentsCsv(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [students]: any = await pool.query(`
      SELECT 
        s.student_id,
        s.full_name,
        s.email,
        s.phone,
        s.gender,
        s.department,
        s.course,
        s.academic_year,
        s.guardian_name,
        s.guardian_phone,
        s.status,
        COALESCE(h.name, 'Not Allocated') as hostel_name,
        COALESCE(r.room_number, '-') as room_number,
        s.admission_date
      FROM students s
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN rooms r ON r.id = ra.room_id
      LEFT JOIN hostels h ON h.id = r.hostel_id
      ORDER BY s.student_id ASC
    `);

    const columns = [
      { key: 'student_id', label: 'Student ID' },
      { key: 'full_name', label: 'Full Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'gender', label: 'Gender' },
      { key: 'department', label: 'Department' },
      { key: 'course', label: 'Course' },
      { key: 'academic_year', label: 'Academic Year' },
      { key: 'guardian_name', label: 'Guardian Name' },
      { key: 'guardian_phone', label: 'Guardian Phone' },
      { key: 'status', label: 'Status' },
      { key: 'hostel_name', label: 'Hostel' },
      { key: 'room_number', label: 'Room' },
      { key: 'admission_date', label: 'Admission Date' },
    ];

    const csvContent = jsonToCsv(students, columns);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students_export.csv"');
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
}
