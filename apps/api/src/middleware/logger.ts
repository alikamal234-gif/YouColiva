import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Skip logging during test runs unless debugging
  if (env.NODE_ENV === 'test') {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const logData = {
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      timestamp: new Date().toISOString(),
      requestId: req.id,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
    };

    console.log(JSON.stringify(logData));
  });

  next();
}
