import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { ZodError } from 'zod';

interface ErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.');
      const key = path || 'body';
      if (!errors[key]) {
        errors[key] = [];
      }
      errors[key].push(issue.message);
    }

    const response: ErrorResponse = {
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors,
    };

    res.status(400).json(response);
    return;
  }

  if (err instanceof ValidationError) {
    const response: ErrorResponse = {
      success: false,
      message: err.message,
      code: err.code,
      errors: err.errors,
    };

    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      message: err.message,
      code: err.code,
    };

    if (process.env['NODE_ENV'] === 'development') {
      response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  console.error('Unhandled error:', err);

  const response: ErrorResponse = {
    success: false,
    message:
      process.env['NODE_ENV'] === 'production'
        ? 'Internal server error'
        : err.message,
    code: 'INTERNAL_ERROR',
  };

  if (process.env['NODE_ENV'] === 'development') {
    response.stack = err.stack;
  }

  res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
  });
}
