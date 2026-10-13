import { Router } from 'express';
import { getHostels, createHostel, updateHostel } from '../controllers/hostelController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getHostels);
router.post('/', requireRole('admin'), createHostel);
router.put('/:id', requireRole('admin'), updateHostel);

export default router;
