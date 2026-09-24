// server/src/controllers/risk.controller.ts
import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/responseEnvelope.js';
import { RiskService } from '../services/RiskService.js';

export async function getRisk(req: Request, res: Response, next: NextFunction) {
  try {
    const location = req.params.location as string;
    const { lat, lng } = req.query;

    const latitude = lat ? parseFloat(lat as string) : undefined;
    const longitude = lng ? parseFloat(lng as string) : undefined;

    const riskResult = await RiskService.evaluateRisk(location, latitude, longitude);

    return sendSuccess(res, riskResult, 200, {
      isFallback: riskResult.isFallback,
      provenance: riskResult.modelVersion,
    });
  } catch (error) {
    next(error);
  }
}
