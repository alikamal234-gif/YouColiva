import { getDatabaseStatus } from '../../config/database.js';
import { env } from '../../config/env.js';

export const healthResolvers = {
  Query: {
    health: async () => {
      const dbStatus = await getDatabaseStatus();
      const isHealthy = dbStatus.status === 'connected';

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        database: {
          status: dbStatus.status,
          readyState: dbStatus.readyState,
          latencyMs: dbStatus.latencyMs,
        },
      };
    },
  },
};
