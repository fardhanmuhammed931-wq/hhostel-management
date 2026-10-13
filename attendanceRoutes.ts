import { Router } from 'express';
import {
  getAttendance,
  markAttendance,
  markBulkAttendance,
} from '../controllers/attendanceController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getAttendance);
router.post('/', requireRole('admin', 'warden'), markAttendance);
router.post('/bulk', requireRole('admin', 'warden'), markBulkAttendance);

export default router;
