import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import { testDbConnection } from './config/db.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security & utility middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  ENV.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow during development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Hostel Management System API',
    version: '1.0.0',
  });
});

// Mount modular API routes
app.use('/api', apiRouter);

// Central error handler
app.use(errorHandler);

// Start server
const PORT = ENV.PORT;
app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Hostel Management Backend running on port ${PORT}`);
  console.log(`📡 REST API endpoint: http://localhost:${PORT}/api`);
  console.log(`💓 Health check:      http://localhost:${PORT}/api/health`);
  console.log(`======================================================`);

  // Verify database connection
  await testDbConnection();
});

export default app;
