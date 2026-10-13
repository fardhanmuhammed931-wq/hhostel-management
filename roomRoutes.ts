import { Router } from 'express';
import { getRooms, getRoomById, createRoom, updateRoom } from '../controllers/roomController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getRooms);
router.get('/:id', getRoomById);
router.post('/', requireRole('admin', 'warden'), createRoom);
router.put('/:id', requireRole('admin', 'warden'), updateRoom);

export default router;
