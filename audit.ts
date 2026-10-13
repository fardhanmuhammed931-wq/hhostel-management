import { pool } from '../config/db.js';

export async function recordAuditLog(
  userId: number | null,
  action: string,
  entityType: string,
  entityId: number | null = null,
  details: string | null = null,
  ipAddress: string | null = null
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, details, ipAddress]
    );
  } catch (error) {
    // Non-blocking error for audit logging
    console.error('Audit log failed:', error);
  }
}
