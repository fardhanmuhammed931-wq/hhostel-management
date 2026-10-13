import { Response, NextFunction } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { recordAuditLog } from '../utils/audit.js';

export async function getAllocations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.query.status as string;
    const hostelId = req.query.hostel_id as string;
    const search = (req.query.search as string || '').trim();

    let where: string[] = ['1=1'];
    let params: any[] = [];

    if (status) {
      where.push('ra.status = ?');
      params.push(status);
    }

    if (hostelId) {
      where.push('h.id = ?');
      params.push(hostelId);
    }

    if (search) {
      where.push('(s.full_name LIKE ? OR s.student_id LIKE ? OR r.room_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [allocations]: any = await pool.query(
      `SELECT ra.*, 
              s.full_name as student_name, s.student_id as student_code, s.email as student_email, s.phone as student_phone,
              r.room_number, r.floor, r.room_type,
              h.id as hostel_id, h.name as hostel_name,
              u.full_name as allocated_by_name
       FROM room_allocations ra
       JOIN students s ON s.id = ra.student_id
       JOIN rooms r ON r.id = ra.room_id
       JOIN hostels h ON h.id = r.hostel_id
       LEFT JOIN users u ON u.id = ra.allocated_by
       WHERE ${where.join(' AND ')}
       ORDER BY ra.created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: allocations,
    });
  } catch (error) {
    next(error);
  }
}

export async function allocateRoom(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { student_id, room_id, bed_number, start_date, end_date, notes } = req.body;

    if (!student_id || !room_id || !start_date) {
      throw new ApiError(400, 'Student, Room, and Start Date are required.');
    }

    const allocationId = await withTransaction(async (conn) => {
      // 1. Check if student already has an active allocation
      const [activeAllocations]: any = await conn.query(
        "SELECT id, room_id FROM room_allocations WHERE student_id = ? AND status = 'active' FOR UPDATE",
        [student_id]
      );

      if (activeAllocations.length > 0) {
        throw new ApiError(400, 'Student already has an active room allocation. Please check out or transfer first.');
      }

      // 2. Lock and check room capacity
      const [rooms]: any = await conn.query(
        'SELECT id, capacity, current_occupancy, status, room_number FROM rooms WHERE id = ? FOR UPDATE',
        [room_id]
      );

      if (rooms.length === 0) {
        throw new ApiError(404, 'Selected room does not exist.');
      }

      const room = rooms[0];

      if (room.status === 'under_maintenance') {
        throw new ApiError(400, `Room ${room.room_number} is under maintenance and cannot be allocated.`);
      }

      if (room.current_occupancy >= room.capacity) {
        throw new ApiError(400, `Room ${room.room_number} is full (Capacity: ${room.capacity}/${room.capacity}).`);
      }

      // 3. Create allocation
      const [insertResult]: any = await conn.query(
        `INSERT INTO room_allocations (student_id, room_id, bed_number, start_date, end_date, status, notes, allocated_by)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
        [student_id, room_id, bed_number || null, start_date, end_date || null, notes || null, req.user?.id || null]
      );

      // 4. Update room occupancy and status
      const newOccupancy = room.current_occupancy + 1;
      const newStatus = newOccupancy >= room.capacity ? 'full' : 'partially_occupied';

      await conn.query(
        'UPDATE rooms SET current_occupancy = ?, status = ? WHERE id = ?',
        [newOccupancy, newStatus, room_id]
      );

      return insertResult.insertId;
    });

    await recordAuditLog(
      req.user?.id || null,
      'ALLOCATE_ROOM',
      'room_allocations',
      allocationId,
      `Allocated student ${student_id} to room ${room_id}`
    );

    res.status(201).json({
      success: true,
      message: 'Room allocated successfully.',
      data: { allocationId },
    });
  } catch (error) {
    next(error);
  }
}

export async function checkOutAllocation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const { checkout_date = new Date().toISOString().split('T')[0], notes } = req.body;

    await withTransaction(async (conn) => {
      // 1. Fetch active allocation
      const [allocations]: any = await conn.query(
        "SELECT * FROM room_allocations WHERE id = ? AND status = 'active' FOR UPDATE",
        [id]
      );

      if (allocations.length === 0) {
        throw new ApiError(404, 'Active allocation not found.');
      }

      const allocation = allocations[0];

      // 2. Mark allocation checked_out
      await conn.query(
        "UPDATE room_allocations SET status = 'checked_out', checkout_date = ?, notes = CONCAT(COALESCE(notes, ''), ' [Checked out: ', ?, ']') WHERE id = ?",
        [checkout_date, notes || '', id]
      );

      // 3. Fetch room and decrement occupancy
      const [rooms]: any = await conn.query(
        'SELECT id, capacity, current_occupancy FROM rooms WHERE id = ? FOR UPDATE',
        [allocation.room_id]
      );

      if (rooms.length > 0) {
        const room = rooms[0];
        const newOccupancy = Math.max(0, room.current_occupancy - 1);
        const newStatus = newOccupancy === 0 ? 'available' : 'partially_occupied';

        await conn.query(
          'UPDATE rooms SET current_occupancy = ?, status = ? WHERE id = ?',
          [newOccupancy, newStatus, room.id]
        );
      }
    });

    await recordAuditLog(req.user?.id || null, 'CHECKOUT_ALLOCATION', 'room_allocations', id, 'Checked out student');

    res.json({
      success: true,
      message: 'Student checked out successfully. Room occupancy updated.',
    });
  } catch (error) {
    next(error);
  }
}

export async function transferRoom(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const { new_room_id, bed_number, transfer_date = new Date().toISOString().split('T')[0], reason } = req.body;

    if (!new_room_id) {
      throw new ApiError(400, 'Destination room is required for room transfer.');
    }

    const newAllocationId = await withTransaction(async (conn) => {
      // 1. Fetch current active allocation
      const [allocations]: any = await conn.query(
        "SELECT * FROM room_allocations WHERE id = ? AND status = 'active' FOR UPDATE",
        [id]
      );

      if (allocations.length === 0) {
        throw new ApiError(404, 'Active allocation not found.');
      }

      const oldAllocation = allocations[0];

      if (oldAllocation.room_id === parseInt(new_room_id, 10)) {
        throw new ApiError(400, 'Student is already allocated to this room.');
      }

      // 2. Check destination room capacity
      const [newRooms]: any = await conn.query(
        'SELECT id, capacity, current_occupancy, status, room_number FROM rooms WHERE id = ? FOR UPDATE',
        [new_room_id]
      );

      if (newRooms.length === 0) {
        throw new ApiError(404, 'Destination room not found.');
      }

      const newRoom = newRooms[0];
      if (newRoom.status === 'under_maintenance') {
        throw new ApiError(400, `Destination room ${newRoom.room_number} is under maintenance.`);
      }

      if (newRoom.current_occupancy >= newRoom.capacity) {
        throw new ApiError(400, `Destination room ${newRoom.room_number} is full.`);
      }

      // 3. Mark old allocation as 'transferred'
      await conn.query(
        "UPDATE room_allocations SET status = 'transferred', checkout_date = ?, notes = CONCAT(COALESCE(notes, ''), ' [Transferred to Room ID ', ?, ': ', ?, ']') WHERE id = ?",
        [transfer_date, new_room_id, reason || 'Room transfer', id]
      );

      // 4. Decrement old room occupancy
      const [oldRooms]: any = await conn.query(
        'SELECT id, current_occupancy FROM rooms WHERE id = ? FOR UPDATE',
        [oldAllocation.room_id]
      );
      if (oldRooms.length > 0) {
        const oldRoom = oldRooms[0];
        const oldOcc = Math.max(0, oldRoom.current_occupancy - 1);
        const oldStatus = oldOcc === 0 ? 'available' : 'partially_occupied';
        await conn.query('UPDATE rooms SET current_occupancy = ?, status = ? WHERE id = ?', [oldOcc, oldStatus, oldRoom.id]);
      }

      // 5. Create new allocation
      const [newInsert]: any = await conn.query(
        `INSERT INTO room_allocations (student_id, room_id, bed_number, start_date, status, notes, allocated_by)
         VALUES (?, ?, ?, ?, 'active', ?, ?)`,
        [oldAllocation.student_id, new_room_id, bed_number || null, transfer_date, `Transferred: ${reason || ''}`, req.user?.id || null]
      );

      // 6. Increment new room occupancy
      const newOcc = newRoom.current_occupancy + 1;
      const newStatus = newOcc >= newRoom.capacity ? 'full' : 'partially_occupied';
      await conn.query('UPDATE rooms SET current_occupancy = ?, status = ? WHERE id = ?', [newOcc, newStatus, new_room_id]);

      return newInsert.insertId;
    });

    await recordAuditLog(
      req.user?.id || null,
      'TRANSFER_ROOM',
      'room_allocations',
      newAllocationId,
      `Transferred allocation ID ${id} to room ID ${new_room_id}`
    );

    res.json({
      success: true,
      message: 'Room transferred successfully.',
      data: { newAllocationId },
    });
  } catch (error) {
    next(error);
  }
}
