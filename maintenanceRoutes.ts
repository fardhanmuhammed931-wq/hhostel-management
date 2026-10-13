import { Router } from 'express';
import {
  getMaintenanceRequests,
  createMaintenanceRequest,
  updateMaintenanceRequest,
} from '../controllers/maintenanceController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getMaintenanceRequests);
router.post('/', createMaintenanceRequest); // Any authenticated user (including student) can create
router.put('/:id', requireRole('admin', 'warden'), updateMaintenanceRequest);

export default router;
