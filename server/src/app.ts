// server/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Security Middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows client to fetch uploaded photos
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static directory for uploaded incident images
  const uploadDir = path.resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadDir));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'UP',
      service: 'TRINETRA Disaster Management API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Mount API v1 router
  app.use('/api/v1', apiRoutes);

  // Catch-all 404 handler for undefined API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
