// server/src/controllers/dev.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../utils/responseEnvelope.js';
import { ApiError } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';
import { seedScenario } from '../services/seedService.js';

const prisma = new PrismaClient();

export async function resetScenario(req: Request, res: Response, next: NextFunction) {
  try {
    const devSecret = req.headers['x-dev-secret'] || req.query.secret;

    if (config.isProduction && devSecret !== config.devResetSecret) {
      throw new ApiError('Unauthorized dev action in production', 403);
    }

    await seedScenario(prisma);

    return sendSuccess(res, {
      message: 'TRINETRA scenario reset successfully to Pan-India multi-hazard operational baseline',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}
