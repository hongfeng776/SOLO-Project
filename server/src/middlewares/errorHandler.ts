import { Request, Response, NextFunction } from 'express';
import { IApiResponse } from '@typings/index';

export class AppError extends Error {
  public readonly code: number;
  public readonly isOperational: boolean;

  constructor(code: number, message: string, isOperational = true) {
    super(message);
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

function formatErrorResponse(code: number, message: string): IApiResponse<null> {
  return {
    code,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  };
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const response = formatErrorResponse(err.code, err.message);
    res.status(err.code).json(response);
    return;
  }

  if (err.name === 'SyntaxError') {
    const response = formatErrorResponse(400, 'Invalid JSON payload');
    res.status(400).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const response = formatErrorResponse(401, 'Token expired');
    res.status(401).json(response);
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    const response = formatErrorResponse(401, 'Invalid token');
    res.status(401).json(response);
    return;
  }

  console.error('Unhandled Error:', err);

  const statusCode = 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  const response = formatErrorResponse(statusCode, message);
  res.status(statusCode).json(response);
}
