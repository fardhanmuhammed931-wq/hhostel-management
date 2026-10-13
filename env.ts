import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT || '3306', 10),
    NAME: process.env.DB_NAME || 'hostel_management',
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  },

  JWT: {
    SECRET: process.env.JWT_SECRET || 'hostel_system_jwt_secret_dev_key_2024',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  },

  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
};
