import { Router } from 'express';
import {
  getPayments,
  recordPayment,
  getReceiptDetails,
  exportPaymentsCsv,
} from '../controllers/paymentController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/export/csv', requireRole('admin', 'warden'), exportPaymentsCsv);
router.get('/', getPayments);
router.get('/receipt/:id', getReceiptDetails);
router.post('/', requireRole('admin', 'warden'), recordPayment);

export default router;
