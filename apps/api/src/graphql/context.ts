import type { Request, Response } from 'express';
import type { TokenPayload } from '../utils/auth-tokens.js';
import { extractToken } from '../middleware/auth.middleware.js';
import { verifyAccessToken } from '../utils/auth-tokens.js';

export interface GraphQLContext {
  req: Request;
  res: Response;
  requestId?: string;
  user?: TokenPayload;
}

export async function buildContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<GraphQLContext> {
  let user: TokenPayload | undefined = req.user;

  if (!user) {
    const token = extractToken(req);
    if (token) {
      try {
        user = verifyAccessToken(token);
      } catch {
        // Token invalid or expired, continue unauthenticated
      }
    }
  }

  return {
    req,
    res,
    requestId: req.id,
    user,
  };
}
