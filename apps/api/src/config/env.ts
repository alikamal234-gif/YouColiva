import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file if available
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .default('4000')
    .transform((val) => parseInt(val, 10))
    .refine((port) => !isNaN(port) && port > 0 && port <= 65535, {
      message: 'PORT must be a valid port number between 1 and 65535',
    }),
  MONGODB_URI: z
    .string({
      required_error: 'MONGODB_URI is required',
    })
    .min(1, 'MONGODB_URI cannot be empty')
    .default('mongodb://127.0.0.1:27017/youcoliva_dev'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000,http://localhost:5173')
    .transform((origins) =>
      origins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  JWT_ACCESS_SECRET: z
    .string()
    .default('youcoliva_jwt_access_secret_key_dev_minimum_32_characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .default('youcoliva_jwt_refresh_secret_key_dev_minimum_32_characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('900000')
    .transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX: z
    .string()
    .default('100')
    .transform((val) => parseInt(val, 10)),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(input: Record<string, unknown> = process.env): EnvConfig {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const formattedErrors = result.error.errors
      .map((err) => `  - [${err.path.join('.')}]: ${err.message}`)
      .join('\n');

    const errorMessage = `❌ Environment configuration validation failed:\n${formattedErrors}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return result.data;
}

export const env = validateEnv();
