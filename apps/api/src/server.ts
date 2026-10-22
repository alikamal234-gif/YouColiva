import http from 'http';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { AppError } from './errors/app-error.js';
import { healthRouter } from './modules/health/health.router.js';
import { typeDefs, resolvers } from './graphql/schema.js';
import { buildContext, type GraphQLContext } from './graphql/context.js';

export interface AppInstance {
  app: Express;
  httpServer: http.Server;
  apolloServer: ApolloServer<GraphQLContext>;
}

export async function createApp(): Promise<AppInstance> {
  const app = express();
  const httpServer = http.createServer(app);

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
      crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (such as mobile apps, curl, or same-origin)
        if (!origin || env.CORS_ORIGIN.includes(origin)) {
          return callback(null, true);
        }
        return callback(new AppError(`Origin ${origin} not allowed by CORS`, 403, 'CORS_ERROR'));
      },
      credentials: true,
    })
  );

  // Request ID & Structured Logging
  app.use(requestIdMiddleware);
  app.use(requestLogger);

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

  return { app, httpServer, apolloServer };
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
      resolve();
    });
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    try {
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
