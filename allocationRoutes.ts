import { Router } from 'express';
import {
  getAllocations,
  allocateRoom,
  checkOutAllocation,
  transferRoom,
} from '../controllers/allocationController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin', 'warden'), getAllocations);
router.post('/', requireRole('admin', 'warden'), allocateRoom);
router.post('/:id/check-out', requireRole('admin', 'warden'), checkOutAllocation);
router.post('/:id/transfer', requireRole('admin', 'warden'), transferRoom);

export default router;
