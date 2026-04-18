import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { HttpError } from '../lib/httpError';

export function notFoundHandler(_request: Request, response: Response) {
  response.status(404).json({ message: 'Not found' });
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      message: 'Validation failed',
      issues: error.flatten()
    });
  }

  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({ message: error.message });
  }

  console.error(error);
  return response.status(500).json({ message: 'Internal server error' });
}
