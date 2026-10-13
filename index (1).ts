import { Router } from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import studentRoutes from './studentRoutes.js';
import hostelRoutes from './hostelRoutes.js';
import roomRoutes from './roomRoutes.js';
import allocationRoutes from './allocationRoutes.js';
import feeRoutes from './feeRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import visitorRoutes from './visitorRoutes.js';
import maintenanceRoutes from './maintenanceRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import reportRoutes from './reportRoutes.js';
import userRoutes from './userRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/students', studentRoutes);
apiRouter.use('/hostels', hostelRoutes);
apiRouter.use('/rooms', roomRoutes);
apiRouter.use('/allocations', allocationRoutes);
apiRouter.use('/fees', feeRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/visitors', visitorRoutes);
apiRouter.use('/maintenance', maintenanceRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/users', userRoutes);

export default apiRouter;
