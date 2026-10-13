import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check for custom ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details || null,
    });
    return;
  }

  // Handle MySQL Errors gracefully
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        let dupMsg = 'A duplicate record already exists.';
        if (err.message.includes('student_id')) dupMsg = 'Student ID already registered.';
        else if (err.message.includes('email')) dupMsg = 'Email address already in use.';
        else if (err.message.includes('uk_hostel_room')) dupMsg = 'Room number already exists in this hostel.';
        else if (err.message.includes('uk_student_attendance_date')) dupMsg = 'Attendance for this student has already been recorded for this date.';
        else if (err.message.includes('receipt_number')) dupMsg = 'Payment receipt number already exists.';
        else if (err.message.includes('ticket_number')) dupMsg = 'Maintenance ticket number already exists.';

        res.status(409).json({
          success: false,
          message: dupMsg,
          code: 'DUPLICATE_ENTRY',
        });
        return;

      case 'ER_NO_REFERENCED_ROW_2':
        res.status(400).json({
          success: false,
          message: 'Referenced entity does not exist (invalid foreign key).',
          code: 'INVALID_REFERENCE',
        });
        return;

      case 'ER_ROW_IS_REFERENCED_2':
        res.status(400).json({
          success: false,
          message: 'Cannot delete or update this record because related data exists (e.g. active room allocations or payments).',
          code: 'REFERENCED_CONSTRAINT',
        });
        return;

      case 'ECONNREFUSED':
        res.status(503).json({
          success: false,
          message: 'Database service is currently unavailable. Please verify MySQL is running.',
          code: 'DB_UNAVAILABLE',
        });
        return;
    }
  }

  console.error('Unhandled server error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal Server Error'
    : err.message || 'An unexpected server error occurred';

  res.status(statusCode).json({
    success: false,
    message,
  });
}
