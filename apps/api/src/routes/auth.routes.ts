import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../schemas/auth.schemas.js';
import { login, register, revokeRefreshToken, rotateRefreshToken } from '../services/auth.service.js';
import { User } from '../models/user.model.js';

export const authRouter = Router();
authRouter.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: 'draft-7', legacyHeaders: false }));
const cookieName = 'circutrace_refresh';
const cookieOptions = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
});
const setRefreshCookie = (response: import('express').Response, token: string) => response.cookie(cookieName, token, cookieOptions());
const clearRefreshCookie = (response: import('express').Response) => response.clearCookie(cookieName, { ...cookieOptions(), maxAge: undefined });

authRouter.post('/register', validateBody(registerSchema), async (request, response, next) => {
  try {
    const result = await register(request.body, request.requestId);
    setRefreshCookie(response, result.session.refreshToken);
    response.status(201).json({ success: true, data: { accessToken: result.session.accessToken, expiresIn: result.session.expiresIn, user: result.user, organization: result.organization } });
  } catch (error) { next(error); }
});

authRouter.post('/login', validateBody(loginSchema), async (request, response, next) => {
  try {
    const result = await login(request.body);
    setRefreshCookie(response, result.session.refreshToken);
    response.json({ success: true, data: { accessToken: result.session.accessToken, expiresIn: result.session.expiresIn, user: result.user, organization: result.organization } });
  } catch (error) { next(error); }
});

authRouter.post('/refresh', async (request, response, next) => {
  try {
    const origin = request.header('origin');
    if (origin && origin !== env.CLIENT_ORIGIN) {
      response.status(403).json({ success: false, error: { code: 'ORIGIN_NOT_ALLOWED', message: 'Request origin is not allowed.' } });
      return;
    }
    const token = request.cookies?.[cookieName] as string | undefined;
    if (!token) {
      response.status(401).json({ success: false, error: { code: 'REFRESH_TOKEN_REQUIRED', message: 'Refresh session is missing.' } });
      return;
    }
    const session = await rotateRefreshToken(token);
    setRefreshCookie(response, session.refreshToken);
    response.json({ success: true, data: { accessToken: session.accessToken, expiresIn: session.expiresIn, user: session.user, organization: session.organization } });
  } catch (error) { clearRefreshCookie(response); next(error); }
});

authRouter.post('/logout', async (request, response, next) => {
  try {
    await revokeRefreshToken(request.cookies?.[cookieName] as string | undefined);
    clearRefreshCookie(response);
    response.status(204).send();
  } catch (error) { next(error); }
});

authRouter.get('/me', authenticate, async (request, response, next) => {
  try {
    const user = await User.findById(request.auth!.userId).select('name email');
    if (!user) { response.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User was not found.' } }); return; }
    response.json({ success: true, data: { user: { id: user.id, name: user.name, email: user.email }, organizationId: request.auth!.organizationId.toString(), role: request.auth!.role, permissions: request.auth!.permissions } });
  } catch (error) { next(error); }
});
