import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { internalError, fail } from '../utils/response';
import { appConfig } from '../config/index';

export class AppError extends Error {
  public readonly code: number;
  public readonly data?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: number = 500,
    data?: unknown,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.data = data;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  fail(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    fail(res, err.message, err.code, err.data);
    return;
  }

  if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    fail(res, 'Invalid JSON format', 400);
    return;
  }

  if (err.name === 'ValidationError') {
    fail(res, err.message, 400);
    return;
  }

  if (appConfig.env !== 'production') {
    internalError(res, err.message, {
      stack: err.stack,
      name: err.name,
    });
    return;
  }

  internalError(res, 'Internal Server Error');
};

export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default errorHandler;
