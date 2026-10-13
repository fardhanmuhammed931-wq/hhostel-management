import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { AuthUser } from '../types/index.js';

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      studentId: user.student_id,
      hostelId: user.hostel_id,
      roomId: user.room_id,
    },
    ENV.JWT.SECRET,
    {
      expiresIn: ENV.JWT.EXPIRES_IN as any,
    }
  );
}

export function verifyToken(token: string): any {
  return jwt.verify(token, ENV.JWT.SECRET);
}
