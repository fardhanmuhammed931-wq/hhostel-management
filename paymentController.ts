import { Response, NextFunction } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { jsonToCsv } from '../utils/csvExport.js';
import { recordAuditLog } from '../utils/audit.js';

export async function getPayments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.query.student_id as string;
    const search = (req.query.search as string || '').trim();
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const paymentMethod = req.query.payment_method as string;

    let where: string[] = ['1=1'];
    let params: any[] = [];

    // If logged in as student, view only their own payments
    if (req.user?.role === 'student') {
      const [studentRec]: any = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (studentRec.length > 0) {
        where.push('p.student_id = ?');
        params.push(studentRec[0].id);
      }
    } else if (studentId) {
      where.push('p.student_id = ?');
      params.push(studentId);
    }

    if (paymentMethod) {
      where.push('p.payment_method = ?');
      params.push(paymentMethod);
    }

    if (startDate) {
      where.push('p.payment_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      where.push('p.payment_date <= ?');
      params.push(endDate);
    }

    if (search) {
      where.push('(p.receipt_number LIKE ? OR s.full_name LIKE ? OR s.student_id LIKE ? OR p.transaction_reference LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [payments]: any = await pool.query(
      `SELECT p.*, 
              s.full_name as student_name, s.student_id as student_code, s.email as student_email,
              fr.fee_category, fr.academic_period, fr.amount_due,
              u.full_name as recorded_by_name
       FROM payments p
       JOIN fee_records fr ON fr.id = p.fee_record_id
       JOIN students s ON s.id = p.student_id
       LEFT JOIN users u ON u.id = p.recorded_by
       WHERE ${where.join(' AND ')}
       ORDER BY p.payment_date DESC, p.created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
}

export async function recordPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      fee_record_id,
      amount,
      payment_method,
      transaction_reference,
      payment_date = new Date().toISOString().split('T')[0],
      remarks,
    } = req.body;

    if (!fee_record_id || !amount || !payment_method) {
      throw new ApiError(400, 'Fee record ID, payment amount, and payment method are required.');
    }

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      throw new ApiError(400, 'Payment amount must be a positive number.');
    }

    const receipt = await withTransaction(async (conn) => {
      // 1. Lock and check fee record
      const [feeRows]: any = await conn.query(
        'SELECT * FROM fee_records WHERE id = ? FOR UPDATE',
        [fee_record_id]
      );

      if (feeRows.length === 0) {
        throw new ApiError(404, 'Fee record not found.');
      }

      const fee = feeRows[0];
      const remainingBalance = Number(fee.amount_due) - Number(fee.amount_paid);

      if (remainingBalance <= 0) {
        throw new ApiError(400, 'This fee record is already fully paid.');
      }

      if (payAmount > remainingBalance) {
        throw new ApiError(
          400,
          `Payment amount ($${payAmount.toFixed(2)}) cannot exceed the remaining balance of $${remainingBalance.toFixed(2)}.`
        );
      }

      // 2. Generate unique receipt number: REC-YYYY-RANDOM
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const receiptNumber = `REC-${year}-${Date.now().toString().slice(-4)}${randomSuffix}`;

      // 3. Insert payment record
      const [payResult]: any = await conn.query(
        `INSERT INTO payments (
          fee_record_id, student_id, receipt_number, amount,
          payment_method, transaction_reference, payment_date, recorded_by, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fee_record_id,
          fee.student_id,
          receiptNumber,
          payAmount,
          payment_method,
          transaction_reference || null,
          payment_date,
          req.user?.id || null,
          remarks || null,
        ]
      );

      // 4. Update fee record
      const newPaid = Number(fee.amount_paid) + payAmount;
      const newStatus = newPaid >= Number(fee.amount_due) ? 'paid' : 'partially_paid';

      await conn.query(
        'UPDATE fee_records SET amount_paid = ?, status = ? WHERE id = ?',
        [newPaid, newStatus, fee_record_id]
      );

      return {
        paymentId: payResult.insertId,
        receiptNumber,
        newPaid,
        remainingBalance: Number(fee.amount_due) - newPaid,
        status: newStatus,
      };
    });

    await recordAuditLog(
      req.user?.id || null,
      'RECORD_PAYMENT',
      'payments',
      receipt.paymentId,
      `Recorded payment ${receipt.receiptNumber} of $${payAmount} for fee record ${fee_record_id}`
    );

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReceiptDetails(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;

    const [rows]: any = await pool.query(
      `SELECT p.*,
              s.full_name as student_name, s.student_id as student_code, s.email as student_email, s.phone as student_phone,
              s.department, s.course,
              fr.fee_category, fr.academic_period, fr.amount_due, fr.amount_paid as total_fee_paid,
              r.room_number, h.name as hostel_name,
              u.full_name as recorded_by_name
       FROM payments p
       JOIN fee_records fr ON fr.id = p.fee_record_id
       JOIN students s ON s.id = p.student_id
       LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
       LEFT JOIN rooms r ON r.id = ra.room_id
       LEFT JOIN hostels h ON h.id = r.hostel_id
       LEFT JOIN users u ON u.id = p.recorded_by
       WHERE p.id = ? OR p.receipt_number = ?`,
      [id, id]
    );

    if (rows.length === 0) {
      throw new ApiError(404, 'Receipt not found.');
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function exportPaymentsCsv(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [payments]: any = await pool.query(`
      SELECT 
        p.receipt_number,
        p.payment_date,
        s.student_id,
        s.full_name as student_name,
        fr.fee_category,
        fr.academic_period,
        p.amount,
        p.payment_method,
        p.transaction_reference,
        COALESCE(u.full_name, 'System') as recorded_by
      FROM payments p
      JOIN fee_records fr ON fr.id = p.fee_record_id
      JOIN students s ON s.id = p.student_id
      LEFT JOIN users u ON u.id = p.recorded_by
      ORDER BY p.payment_date DESC
    `);

    const columns = [
      { key: 'receipt_number', label: 'Receipt No' },
      { key: 'payment_date', label: 'Date' },
      { key: 'student_id', label: 'Student ID' },
      { key: 'student_name', label: 'Student Name' },
      { key: 'fee_category', label: 'Category' },
      { key: 'academic_period', label: 'Period' },
      { key: 'amount', label: 'Amount ($)' },
      { key: 'payment_method', label: 'Method' },
      { key: 'transaction_reference', label: 'Reference' },
      { key: 'recorded_by', label: 'Recorded By' },
    ];

    const csvContent = jsonToCsv(payments, columns);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fee_payments_report.csv"');
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
}
