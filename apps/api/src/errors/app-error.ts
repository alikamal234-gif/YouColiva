export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    isOperational = true,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', details?: unknown): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', true, details);
  }

  static unauthorized(message = 'Unauthorized', details?: unknown): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED', true, details);
  }

  static forbidden(message = 'Forbidden', details?: unknown): AppError {
    return new AppError(message, 403, 'FORBIDDEN', true, details);
  }

  static notFound(message = 'Resource not found', details?: unknown): AppError {
    return new AppError(message, 404, 'NOT_FOUND', true, details);
  }

  static internal(message = 'Internal server error', details?: unknown): AppError {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR', false, details);
  }
}
