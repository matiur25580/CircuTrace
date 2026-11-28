import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/require-permission.js';
import { validateBody } from '../middleware/validate.js';
import { createLifecycleEventSchema, lifecycleListQuerySchema } from '../schemas/lifecycle.schemas.js';
import { appendLifecycleEvent, listLifecycleEvents } from '../services/lifecycle.service.js';

export const lifecycleRouter = Router();
lifecycleRouter.use(authenticate);

lifecycleRouter.get('/:identifier/events', requirePermission('products:read'), async (request, response, next) => {
  try {
    const parsed = lifecycleListQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      response.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Lifecycle query parameters are invalid.', details: parsed.error.flatten().fieldErrors } });
      return;
    }
    const result = await listLifecycleEvents(String(request.params.identifier), parsed.data, request.auth!.organizationId);
    response.json({ success: true, data: result });
  } catch (error) { next(error); }
});

lifecycleRouter.post('/:identifier/events', requirePermission('products:write'), validateBody(createLifecycleEventSchema), async (request, response, next) => {
  try {
    const event = await appendLifecycleEvent(String(request.params.identifier), request.body, request.auth!.organizationId, request.auth!.userId, request.requestId);
    response.status(201).json({ success: true, data: { event } });
  } catch (error) { next(error); }
});
