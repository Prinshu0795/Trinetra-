// server/src/utils/responseEnvelope.ts
import { Response } from 'express';

export interface ApiResponseOptions<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  provenance?: string;
  isFallback?: boolean;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  options?: Omit<ApiResponseOptions<T>, 'data' | 'error'>
) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(options?.pagination ? { pagination: options.pagination } : {}),
      ...(options?.provenance ? { provenance: options.provenance } : {}),
      ...(options?.isFallback !== undefined ? { isFallback: options.isFallback } : {}),
    },
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  code = 'BAD_REQUEST',
  details?: any
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}
