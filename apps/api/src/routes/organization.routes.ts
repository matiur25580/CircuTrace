import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/require-permission.js';
import { validateBody } from '../middleware/validate.js';
import { createOrganizationSchema, switchOrganizationSchema } from '../schemas/auth.schemas.js';
import { createOrganization, listOrganizations, switchOrganization } from '../services/auth.service.js';
import { AuditEvent } from '../models/audit-event.model.js';
import { Membership } from '../models/membership.model.js';

export const organizationRouter = Router();
organizationRouter.use(authenticate);

organizationRouter.get('/', async (request, response, next) => {
  try {
    const organizations = await listOrganizations(request.auth!.userId.toString());
    response.json({ success: true, data: { organizations } });
  } catch (error) { next(error); }
});

organizationRouter.post('/', validateBody(createOrganizationSchema), async (request, response, next) => {
  try {
    const organization = await createOrganization(request.auth!.userId.toString(), request.body.name, request.requestId);
    response.status(201).json({ success: true, data: { organization } });
  } catch (error) { next(error); }
});

organizationRouter.post('/switch', validateBody(switchOrganizationSchema), async (request, response, next) => {
  try {
    const result = await switchOrganization(request.auth!.userId.toString(), request.body.organizationId);
    response.cookie('circutrace_refresh', result.session.refreshToken, {
      httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'strict',
      path: '/api/v1/auth', maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    response.json({ success: true, data: { accessToken: result.session.accessToken, expiresIn: result.session.expiresIn, organization: result.organization } });
  } catch (error) { next(error); }
});

organizationRouter.get('/members', requirePermission('members:read'), async (request, response, next) => {
  try {
    const members = await Membership.find({ organizationId: request.auth!.organizationId, status: 'active' })
      .populate('userId', 'name email')
      .select('userId role joinedAt');
    response.json({ success: true, data: { members } });
  } catch (error) { next(error); }
});

organizationRouter.get('/audit-events', requirePermission('audit:read'), async (request, response, next) => {
  try {
    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 25));
    const [events, total] = await Promise.all([
      AuditEvent.find({ organizationId: request.auth!.organizationId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AuditEvent.countDocuments({ organizationId: request.auth!.organizationId }),
    ]);
    response.json({ success: true, data: { events, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
});
