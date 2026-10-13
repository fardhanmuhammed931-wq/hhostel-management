import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUserStatus,
  resetPassword,
} from '../controllers/userController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUserStatus);
router.post('/:id/reset-password', resetPassword);

export default router;
