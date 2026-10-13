import { Router } from 'express';
import { getFees, createFee } from '../controllers/feeController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getFees);
router.post('/', requireRole('admin', 'warden'), createFee);

export default router;
