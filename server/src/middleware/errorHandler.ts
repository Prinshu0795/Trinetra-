// server/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/responseEnvelope.js';

export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode = 400, code = 'API_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[TRINETRA ERROR]:', err);

  if (err instanceof ApiError) {
    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', formattedErrors);
  }

  // Multer upload errors
  if (err.name === 'MulterError') {
    return sendError(res, `Upload error: ${err.message}`, 400, 'FILE_UPLOAD_ERROR');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, 'Invalid or expired authentication token', 401, 'INVALID_TOKEN');
  }

  // Generic fallback
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err.message || 'Internal Server Error';

  return sendError(res, message, 500, 'INTERNAL_SERVER_ERROR');
}
