import { Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { recordAuditLog } from '../utils/audit.js';

export async function getRooms(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const hostelId = req.query.hostel_id as string;
    const floor = req.query.floor as string;
    const status = req.query.status as string;
    const roomType = req.query.room_type as string;
    const search = (req.query.search as string || '').trim();

    let where: string[] = ['1=1'];
    let params: any[] = [];

    if (hostelId) {
      where.push('r.hostel_id = ?');
      params.push(hostelId);
    }

    if (floor) {
      where.push('r.floor = ?');
      params.push(floor);
    }

    if (status) {
      where.push('r.status = ?');
      params.push(status);
    }

    if (roomType) {
      where.push('r.room_type = ?');
      params.push(roomType);
    }

    if (search) {
      where.push('(r.room_number LIKE ? OR h.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rooms]: any = await pool.query(
      `SELECT r.*, h.name as hostel_name, h.code as hostel_code,
              (r.capacity - r.current_occupancy) as available_beds
       FROM rooms r
       JOIN hostels h ON h.id = r.hostel_id
       WHERE ${where.join(' AND ')}
       ORDER BY h.name ASC, r.floor ASC, r.room_number ASC`,
      params
    );

    res.json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoomById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);

    const [rooms]: any = await pool.query(
      `SELECT r.*, h.name as hostel_name, h.code as hostel_code
       FROM rooms r
       JOIN hostels h ON h.id = r.hostel_id
       WHERE r.id = ?`,
      [id]
    );

    if (rooms.length === 0) {
      throw new ApiError(404, 'Room not found.');
    }

    // Get current occupants
    const [occupants]: any = await pool.query(
      `SELECT s.id as student_id, s.student_id as student_code, s.full_name, s.email, s.phone,
              s.department, ra.bed_number, ra.start_date, ra.id as allocation_id
       FROM room_allocations ra
       JOIN students s ON s.id = ra.student_id
       WHERE ra.room_id = ? AND ra.status = 'active'`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...rooms[0],
        occupants,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createRoom(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      hostel_id,
      room_number,
      floor = 1,
      room_type = 'double',
      capacity = 2,
      fee_per_month = 0.0,
      status = 'available',
      amenities,
      description,
    } = req.body;

    if (!hostel_id || !room_number) {
      throw new ApiError(400, 'Hostel ID and Room Number are required.');
    }

    // Check duplicate room in same hostel
    const [existing]: any = await pool.query(
      'SELECT id FROM rooms WHERE hostel_id = ? AND room_number = ?',
      [hostel_id, room_number.trim()]
    );

    if (existing.length > 0) {
      throw new ApiError(409, `Room ${room_number} already exists in this hostel.`);
    }

    const [result]: any = await pool.query(
      `INSERT INTO rooms (hostel_id, room_number, floor, room_type, capacity, current_occupancy, fee_per_month, status, amenities, description)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [
        hostel_id,
        room_number.trim(),
        floor,
        room_type,
        capacity,
        fee_per_month,
        status,
        amenities || null,
        description || null,
      ]
    );

    await recordAuditLog(req.user?.id || null, 'CREATE_ROOM', 'rooms', result.insertId, `Created room ${room_number}`);

    res.status(201).json({
      success: true,
      message: 'Room created successfully.',
      data: { id: result.insertId, room_number, capacity },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRoom(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const { floor, room_type, capacity, fee_per_month, status, amenities, description } = req.body;

    const [room]: any = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
    if (room.length === 0) {
      throw new ApiError(404, 'Room not found.');
    }

    // If capacity is reduced below current occupancy, reject
    if (capacity !== undefined && capacity < room[0].current_occupancy) {
      throw new ApiError(400, `Cannot set capacity to ${capacity}. Current occupancy is ${room[0].current_occupancy}.`);
    }

    await pool.query(
      `UPDATE rooms SET 
        floor = COALESCE(?, floor),
        room_type = COALESCE(?, room_type),
        capacity = COALESCE(?, capacity),
        fee_per_month = COALESCE(?, fee_per_month),
        status = COALESCE(?, status),
        amenities = COALESCE(?, amenities),
        description = COALESCE(?, description)
       WHERE id = ?`,
      [floor, room_type, capacity, fee_per_month, status, amenities, description, id]
    );

    await recordAuditLog(req.user?.id || null, 'UPDATE_ROOM', 'rooms', id, `Updated room ID ${id}`);

    res.json({
      success: true,
      message: 'Room details updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}
