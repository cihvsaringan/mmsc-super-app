import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { DatabaseError } from 'pg';
import { MulterError } from 'multer';
import { logger } from './logger.js';

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  void _next;
  if (error instanceof ZodError) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: error.issues }, requestId: req.id });
    return;
  }
  if (error instanceof MulterError) {
    res.status(400).json({ error: { code: 'INVALID_UPLOAD', message: error.code === 'LIMIT_FILE_SIZE' ? 'Photo must be 5 MB or smaller' : 'Photo upload is invalid' }, requestId: req.id });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message, details: error.details }, requestId: req.id });
    return;
  }
  if (error instanceof DatabaseError && error.code === '23505') {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'A record with those unique details already exists' }, requestId: req.id });
    return;
  }
  if (error instanceof DatabaseError && ['23503', '23514'].includes(error.code ?? '')) {
    res.status(400).json({ error: { code: 'INVALID_RELATIONSHIP', message: 'The request references invalid or protected data' }, requestId: req.id });
    return;
  }
  const databaseCode = error instanceof DatabaseError ? error.code : undefined;
  logger.error({
    err: error,
    requestId: req.id,
    method: req.method,
    route: req.originalUrl,
    authenticatedUserId: req.auth?.userId ?? null,
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    databaseCode,
  }, 'Unhandled request error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, requestId: req.id });
};
