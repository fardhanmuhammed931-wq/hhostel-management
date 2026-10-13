import { Router } from 'express';
import { getDashboardStats, getDashboardCharts, getDashboardRecentActivity } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/charts', getDashboardCharts);
router.get('/recent-activity', getDashboardRecentActivity);

export default router;
