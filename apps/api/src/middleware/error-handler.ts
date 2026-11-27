import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';

export const errorHandler: ErrorRequestHandler = (error: unknown, request, response, _next) => {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
  const statusCode =
    typeof error === 'object' && error !== null && 'statusCode' in error &&
    typeof error.statusCode === 'number'
      ? error.statusCode
      : 500;

  console.error(JSON.stringify({ level: 'error', requestId: request.requestId, message, statusCode }));

  response.status(statusCode).json({
    success: false,
    error: {
      code: statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR',
      message: env.NODE_ENV === 'production' && statusCode >= 500
        ? 'An unexpected error occurred.'
        : message,
      requestId: request.requestId,
    },
  });
};
