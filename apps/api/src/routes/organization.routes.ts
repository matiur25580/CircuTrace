import { Router } from 'express';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/require-permission.js';
import { validateBody } from '../middleware/validate.js';
import { createOrganizationSchema, switchOrganizationSchema } from '../schemas/auth.schemas.js';
import { createOrganization, listOrganizations, switchOrganization } from '../services/auth.service.js';
import { AuditEvent } from '../models/audit-event.model.js';
import { Membership } from '../models/membership.model.js';
import { inviteMember, acceptInvitation } from '../services/auth.service.js';
import { inviteMemberSchema, acceptInvitationSchema, updateMemberRoleSchema } from '../schemas/auth.schemas.js';
import mongoose from 'mongoose';

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
      path: '/api/v1/auth', maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
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

organizationRouter.post('/members/invitations', requirePermission('members:invite'), validateBody(inviteMemberSchema), async (request, response, next) => {
  try {
    const invitation = await inviteMember({
      organizationId: request.auth!.organizationId.toString(),
      invitedBy: request.auth!.userId.toString(),
      email: request.body.email,
      role: request.body.role,
    }, request.requestId);
    response.status(201).json({ success: true, data: { invitation, delivery: 'manual' } });
  } catch (error) { next(error); }
});

organizationRouter.post('/members/invitations/accept', authenticate, validateBody(acceptInvitationSchema), async (request, response, next) => {
  try {
    const organization = await acceptInvitation(request.auth!.userId.toString(), request.body.token, request.requestId);
    response.status(201).json({ success: true, data: { organization } });
  } catch (error) { next(error); }
});

organizationRouter.patch('/members/:membershipId', requirePermission('members:manage'), validateBody(updateMemberRoleSchema), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.membershipId)) {
      response.status(400).json({ success: false, error: { code: 'INVALID_MEMBER_ID', message: 'Membership identifier is invalid.' } }); return;
    }
    const target = await Membership.findOne({ _id: request.params.membershipId, organizationId: request.auth!.organizationId, status: 'active' });
    if (!target) { response.status(404).json({ success: false, error: { code: 'MEMBERSHIP_NOT_FOUND', message: 'Active membership was not found.' } }); return; }
    if (target.userId.equals(request.auth!.userId)) { response.status(400).json({ success: false, error: { code: 'SELF_ROLE_CHANGE_NOT_ALLOWED', message: 'You cannot change your own organization role.' } }); return; }
    if (target.role === 'owner') { response.status(403).json({ success: false, error: { code: 'OWNER_PROTECTED', message: 'Ownership changes require a dedicated ownership-transfer workflow.' } }); return; }
    target.role = request.body.role;
    await target.save();
    await AuditEvent.create({ organizationId: request.auth!.organizationId, actorUserId: request.auth!.userId, action: 'member.role_updated', targetType: 'membership', targetId: target.id, metadata: { role: target.role }, requestId: request.requestId });
    response.json({ success: true, data: { membership: { id: target.id, role: target.role } } });
  } catch (error) { next(error); }
});

organizationRouter.delete('/members/:membershipId', requirePermission('members:manage'), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.membershipId)) {
      response.status(400).json({ success: false, error: { code: 'INVALID_MEMBER_ID', message: 'Membership identifier is invalid.' } }); return;
    }
    const target = await Membership.findOne({ _id: request.params.membershipId, organizationId: request.auth!.organizationId, status: 'active' });
    if (!target) { response.status(404).json({ success: false, error: { code: 'MEMBERSHIP_NOT_FOUND', message: 'Active membership was not found.' } }); return; }
    if (target.userId.equals(request.auth!.userId) || target.role === 'owner') {
      response.status(403).json({ success: false, error: { code: 'MEMBERSHIP_PROTECTED', message: 'You cannot remove yourself or the organization owner.' }); return;
    }
    target.status = 'removed';
    await target.save();
    await AuditEvent.create({ organizationId: request.auth!.organizationId, actorUserId: request.auth!.userId, action: 'member.removed', targetType: 'membership', targetId: target.id, requestId: request.requestId });
    response.status(204).send();
  } catch (error) { next(error); }
});
