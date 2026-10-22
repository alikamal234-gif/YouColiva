import { Router, type Request, type Response } from 'express';
import { getDatabaseStatus } from '../../config/database.js';
import { env } from '../../config/env.js';

export const healthRouter: Router = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = await getDatabaseStatus();
  const isHealthy = dbStatus.status === 'connected';

  const payload = {
    status: isHealthy ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: dbStatus,
  };

  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(payload);
});
