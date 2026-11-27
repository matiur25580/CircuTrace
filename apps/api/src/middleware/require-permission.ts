import type { RequestHandler } from 'express';
import type { Permission } from '../types/auth.js';

export const requirePermission = (permission: Permission): RequestHandler => (request, response, next) => {
  if (!request.auth?.permissions.includes(permission)) {
    response.status(403).json({ success: false, error: { code: 'INSUFFICIENT_PERMISSION', message: 'You do not have permission to perform this action.' } });
    return;
  }
  next();
};
