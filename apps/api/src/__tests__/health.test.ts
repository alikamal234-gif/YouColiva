import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp, type AppInstance } from '../server.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';

describe('API Foundation & Health Checks', () => {
  let mongoServer: MongoMemoryServer;
  let appInstance: AppInstance;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    // Start in-memory MongoDB for clean test isolation
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await connectDatabase(uri);
    appInstance = await createApp();
  });

  afterAll(async () => {
    if (appInstance?.apolloServer) {
      await appInstance.apolloServer.stop();
    }
    if (appInstance?.httpServer.listening) {
      await new Promise<void>((resolve) => {
        appInstance.httpServer.close(() => resolve());
      });
    }

    await disconnectDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('REST Endpoint: GET /health', () => {
    it('should return 200 OK with healthy status and database metrics', async () => {
      const response = await request(appInstance.app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.body).toMatchObject({
        status: 'healthy',
        environment: 'test',
        database: {
          status: 'connected',
          readyState: 1,
        },
      });
      expect(typeof response.body.uptime).toBe('number');
      expect(typeof response.body.timestamp).toBe('string');
    });
  });

  describe('GraphQL Endpoint: POST /graphql', () => {
    it('should execute the health query successfully', async () => {
      const query = `
        query GetHealth {
          health {
            status
            uptime
            timestamp
            environment
            database {
              status
              readyState
              latencyMs
            }
          }
        }
      `;

      const response = await request(appInstance.app)
        .post('/graphql')
        .send({ query })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data?.health).toBeDefined();

      const health = response.body.data.health;
      expect(health.status).toBe('healthy');
      expect(health.database.status).toBe('connected');
      expect(health.database.readyState).toBe(1);
      expect(typeof health.uptime).toBe('number');
      expect(typeof health.timestamp).toBe('string');
    });
  });

  describe('Error Handling Middleware', () => {
    it('should return 404 with structured JSON for non-existent routes', async () => {
      const response = await request(appInstance.app)
        .get('/api/does-not-exist')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Cannot GET /api/does-not-exist',
        },
      });
      expect(response.body.error.requestId).toBeDefined();
    });
  });
});
