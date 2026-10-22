import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';

  // In production, do not leak unexpected internal errors to clients
  const message =
    isAppError || env.NODE_ENV !== 'production'
      ? err.message
      : 'An unexpected internal server error occurred';

  if (!isAppError) {
    console.error('Unhandled server error:', {
      requestId: req.id,
      path: req.originalUrl,
      error: err,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      requestId: req.id,
      ...(isAppError && err.details ? { details: err.details } : {}),
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
  });
}
