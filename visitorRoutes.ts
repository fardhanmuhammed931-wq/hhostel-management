import { Router } from 'express';
import {
  getVisitorLogs,
  checkInVisitor,
  checkOutVisitor,
  exportVisitorsCsv,
} from '../controllers/visitorController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/export/csv', requireRole('admin', 'warden'), exportVisitorsCsv);
router.get('/', getVisitorLogs);
router.post('/check-in', requireRole('admin', 'warden'), checkInVisitor);
router.post('/:id/check-out', requireRole('admin', 'warden'), checkOutVisitor);

export default router;
