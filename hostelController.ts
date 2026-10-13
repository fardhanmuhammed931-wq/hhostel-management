import { Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { recordAuditLog } from '../utils/audit.js';

export async function getHostels(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [hostels]: any = await pool.query(`
      SELECT 
        h.*,
        u.full_name as warden_name,
        COUNT(DISTINCT r.id) as total_rooms,
        COALESCE(SUM(r.capacity), 0) as total_capacity,
        COALESCE(SUM(r.current_occupancy), 0) as total_occupants
      FROM hostels h
      LEFT JOIN users u ON u.id = h.warden_id
      LEFT JOIN rooms r ON r.hostel_id = h.id
      GROUP BY h.id
      ORDER BY h.name ASC
    `);

    res.json({
      success: true,
      data: hostels,
    });
  } catch (error) {
    next(error);
  }
}

export async function createHostel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, code, type, total_floors, warden_id, contact_number, address, description, status = 'active' } = req.body;

    if (!name || !code) {
      throw new ApiError(400, 'Hostel name and code are required.');
    }

    const [existing]: any = await pool.query('SELECT id FROM hostels WHERE code = ?', [code.trim().toUpperCase()]);
    if (existing.length > 0) {
      throw new ApiError(409, `Hostel code '${code}' is already registered.`);
    }

    const [result]: any = await pool.query(
      `INSERT INTO hostels (name, code, type, total_floors, warden_id, contact_number, address, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        code.trim().toUpperCase(),
        type || 'co-ed',
        total_floors || 1,
        warden_id || null,
        contact_number || null,
        address || null,
        description || null,
        status,
      ]
    );

    await recordAuditLog(req.user?.id || null, 'CREATE_HOSTEL', 'hostels', result.insertId, `Created hostel ${name}`);

    res.status(201).json({
      success: true,
      message: 'Hostel created successfully.',
      data: { id: result.insertId, name, code },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateHostel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, code, type, total_floors, warden_id, contact_number, address, description, status } = req.body;

    await pool.query(
      `UPDATE hostels SET 
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        type = COALESCE(?, type),
        total_floors = COALESCE(?, total_floors),
        warden_id = COALESCE(?, warden_id),
        contact_number = COALESCE(?, contact_number),
        address = COALESCE(?, address),
        description = COALESCE(?, description),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        name?.trim(),
        code ? code.trim().toUpperCase() : null,
        type,
        total_floors,
        warden_id,
        contact_number,
        address,
        description,
        status,
        id,
      ]
    );

    await recordAuditLog(req.user?.id || null, 'UPDATE_HOSTEL', 'hostels', id, `Updated hostel ID ${id}`);

    res.json({
      success: true,
      message: 'Hostel details updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}
