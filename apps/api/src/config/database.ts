import mongoose from 'mongoose';
import { env } from './env.js';

export interface DatabaseStatus {
  status: 'connected' | 'connecting' | 'disconnecting' | 'disconnected' | 'error';
  readyState: number;
  latencyMs: number | null;
}

const readyStateMap: Record<number, DatabaseStatus['status']> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  const connectionUri = uri || env.MONGODB_URI;

  try {
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected.');
    });

    return await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const readyState = mongoose.connection.readyState;
  const status = readyStateMap[readyState] || 'disconnected';

  let latencyMs: number | null = null;

  if (readyState === 1 && mongoose.connection.db) {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      latencyMs = Date.now() - start;
    } catch {
      latencyMs = null;
    }
  }

  return {
    status,
    readyState,
    latencyMs,
  };
}
