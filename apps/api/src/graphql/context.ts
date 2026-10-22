import type { Request, Response } from 'express';

export interface GraphQLContext {
  req: Request;
  res: Response;
  requestId?: string;
}

export async function buildContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<GraphQLContext> {
  return {
    req,
    res,
    requestId: req.id,
  };
}
