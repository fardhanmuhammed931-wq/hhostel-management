import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { UserRole, AuthUser } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      full_name: decoded.fullName,
      student_id: decoded.studentId,
      hostel_id: decoded.hostelId,
      room_id: decoded.roomId,
    };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Authentication session expired. Please log in again.',
      });
      return;
    }
    res.status(401).json({
      success: false,
      message: 'Invalid or forged authentication token.',
    });
  }
}

/**
 * Enforce role-based permissions (Admin, Warden, Student)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your role: ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}
