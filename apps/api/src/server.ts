import http from 'http';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import type { Server as SocketIOServer } from 'socket.io';

import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { requestLogger } from './middleware/logger.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { apiRateLimiter } from './middleware/rate-limit.js';
import { errorHandler } from './middleware/error-handler.js';
import { AppError } from './errors/app-error.js';
import { healthRouter } from './modules/health/health.router.js';
import { setupChatSocket } from './modules/chat/chat.socket.js';
import { typeDefs, resolvers } from './graphql/schema.js';
import { buildContext, type GraphQLContext } from './graphql/context.js';

export interface AppInstance {
  app: Express;
  httpServer: http.Server;
  apolloServer: ApolloServer<GraphQLContext>;
  io: SocketIOServer;
}

export async function createApp(): Promise<AppInstance> {
  const app = express();
  const httpServer = http.createServer(app);

  // Setup real-time Socket.IO chat gateway
  const io = setupChatSocket(httpServer);

  // Apollo Server instantiation
  const apolloServer = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (formattedError) => {
      if (env.NODE_ENV === 'production') {
        return {
          message: formattedError.message,
          locations: formattedError.locations,
          path: formattedError.path,
          extensions: {
            code: formattedError.extensions?.code || 'INTERNAL_SERVER_ERROR',
          },
        };
      }
      return formattedError;
    },
  });

  await apolloServer.start();

  // Security headers
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (such as mobile apps, curl, or same-origin)
        if (!origin) {
          return callback(null, true);
        }

        // Allow wildcard or exact match from CORS_ORIGIN
        if (env.CORS_ORIGIN.includes('*') || env.CORS_ORIGIN.includes(origin)) {
          return callback(null, true);
        }

        // Allow all Vercel deployment URLs (production and preview branches)
        if (/^https:\/\/([a-zA-Z0-9_-]+\.)?vercel\.app$/.test(origin)) {
          return callback(null, true);
        }

        // Allow localhost and 127.0.0.1 on any port
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }

        return callback(new AppError(`Origin ${origin} not allowed by CORS`, 403, 'CORS_ERROR'));
      },
      credentials: true,
    })
  );

  // Cookie parser
  app.use(cookieParser());

  // Request ID & Structured Logging
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // Rate Limiting
  app.use(apiRateLimiter);

  // Authentication Middleware (populates req.user if Bearer token / cookie provided)
  app.use(authMiddleware);

  // Body parser with safe limit
  app.use(express.json({ limit: '10mb' }));

  // REST endpoints
  app.use(healthRouter);

  // GraphQL endpoint
  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: buildContext,
    })
  );

  // 404 handler for unknown routes
  app.use((req, _res, next) => {
    next(AppError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
  });

  // Centralized error handler
  app.use(errorHandler);

  return { app, httpServer, apolloServer, io };
}

let activeInstance: AppInstance | null = null;

export async function startServer(
  port = env.PORT,
  mongoUri = env.MONGODB_URI
): Promise<AppInstance> {
  await connectDatabase(mongoUri);

  const instance = await createApp();
  activeInstance = instance;

  await new Promise<void>((resolve) => {
    instance.httpServer.listen(port, () => {
      console.log(`🚀 YouColiva API server ready at http://localhost:${port}`);
      console.log(`📡 GraphQL endpoint ready at http://localhost:${port}/graphql`);
      console.log(`🩺 Health check ready at http://localhost:${port}/health`);
      console.log(`💬 Socket.IO chat service ready at ws://localhost:${port}`);
      resolve();
    });
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    try {
      if (instance.io) {
        instance.io.close();
        console.log('Socket.IO service closed.');
      }

      if (instance.httpServer.listening) {
        await new Promise<void>((resolve, reject) => {
          instance.httpServer.close((err) => (err ? reject(err) : resolve()));
        });
        console.log('HTTP server closed.');
      }

      await instance.apolloServer.stop();
      console.log('Apollo Server stopped.');

      await disconnectDatabase();
      console.log('Database connection closed.');

      console.log('Graceful shutdown completed successfully.');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

  return instance;
}

export async function stopServer(): Promise<void> {
  if (activeInstance) {
    if (activeInstance.io) {
      activeInstance.io.close();
    }
    if (activeInstance.httpServer.listening) {
      await new Promise<void>((resolve, reject) => {
        activeInstance!.httpServer.close((err) => (err ? reject(err) : resolve()));
      });
    }
    await activeInstance.apolloServer.stop();
    await disconnectDatabase();
    activeInstance = null;
  }
}
