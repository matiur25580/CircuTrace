import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/require-permission.js';
import { validateBody } from '../middleware/validate.js';
import { publishPassportSchema, updatePassportSchema } from '../schemas/passport.schemas.js';
import { getPassportManagement, getPublicPassport, publishPassport, revokePassport, updatePassport } from '../services/passport.service.js';

export const passportRouter = Router();
const publicRouter = Router();

publicRouter.get('/', async (request, response, next) => {
  try {
    const data = await getPublicPassport(String(request.params.slug));
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Robots-Tag', 'noindex, nofollow');
    response.json({ success: true, data });
  } catch (error) { next(error); }
});

passportRouter.get('/public', (_request, response) => response.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Public passport was not found.' } }));
passportRouter.use('/public/:slug', publicRouter);
passportRouter.use(authenticate);

passportRouter.get('/manage/:identifier', requirePermission('products:read'), async (request, response, next) => {
  try {
    const passport = await getPassportManagement(String(request.params.identifier), request.auth!.organizationId);
    response.json({ success: true, data: { passport } });
  } catch (error) { next(error); }
});

passportRouter.post('/manage/:identifier/publish', requirePermission('products:write'), validateBody(publishPassportSchema), async (request, response, next) => {
  try {
    const passport = await publishPassport(String(request.params.identifier), request.body.sections, request.auth!.organizationId, request.auth!.userId, request.requestId);
    response.status(201).json({ success: true, data: { passport } });
  } catch (error) { next(error); }
});

passportRouter.patch('/manage/:identifier', requirePermission('products:write'), validateBody(updatePassportSchema), async (request, response, next) => {
  try {
    const passport = await updatePassport(String(request.params.identifier), request.body.sections, request.auth!.organizationId, request.auth!.userId, request.requestId);
    response.json({ success: true, data: { passport } });
  } catch (error) { next(error); }
});

passportRouter.post('/manage/:identifier/revoke', requirePermission('products:write'), async (request, response, next) => {
  try {
    const passport = await revokePassport(String(request.params.identifier), request.auth!.organizationId, request.auth!.userId, request.requestId);
    response.json({ success: true, data: { passport } });
  } catch (error) { next(error); }
});
