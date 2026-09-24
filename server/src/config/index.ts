// server/src/config/index.ts
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'file:./trinetra.db',
  jwtSecret: process.env.JWT_SECRET || 'trinetra-fallback-super-secret-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  devResetSecret: process.env.DEV_RESET_SECRET || 'trinetra-dev-reset-key',
  riskServiceUrl: process.env.RISK_SERVICE_URL || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
