import { Router } from 'express';
import { login, register, getCurrentUser, changePassword, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', rateLimiter(20, 60000), login);
router.post('/register', rateLimiter(15, 60000), register);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, changePassword);

export default router;
