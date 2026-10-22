import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserRole, Campus } from '../models/user.model.js';
import { AppError } from '../errors/app-error.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  campus: Campus;
}

export interface SessionTokenPayload extends TokenPayload {
  sessionId?: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: SessionTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Access token has expired', { expired: true });
    }
    throw AppError.unauthorized('Invalid access token');
  }
}

export function verifyRefreshToken(token: string): SessionTokenPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as SessionTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Refresh token has expired', { expired: true });
    }
    throw AppError.unauthorized('Invalid refresh token');
  }
}
