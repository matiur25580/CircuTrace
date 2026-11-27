import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

export const validateBody = (schema: ZodSchema): RequestHandler => (request, response, next) => {
  const result = schema.safeParse(request.body);
  if (!result.success) {
    response.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Request validation failed.', details: result.error.flatten().fieldErrors },
    });
    return;
  }
  request.body = result.data;
  next();
};
