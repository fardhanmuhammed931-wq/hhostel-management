import { Router } from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  exportStudentsCsv,
} from '../controllers/studentController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/export/csv', requireRole('admin', 'warden'), exportStudentsCsv);
router.get('/', requireRole('admin', 'warden'), getStudents);
router.get('/:id', getStudentById);
router.post('/', requireRole('admin', 'warden'), createStudent);
router.put('/:id', requireRole('admin', 'warden'), updateStudent);
router.delete('/:id', requireRole('admin'), deleteStudent);

export default router;
