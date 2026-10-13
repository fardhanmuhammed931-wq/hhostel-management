import { Router } from 'express';
import {
  getOccupancyReport,
  getFeeReport,
  getMaintenanceReport,
  exportReportCsv,
} from '../controllers/reportController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin', 'warden'));

router.get('/occupancy', getOccupancyReport);
router.get('/fees', getFeeReport);
router.get('/maintenance', getMaintenanceReport);
router.get('/export/:type', exportReportCsv);

export default router;
