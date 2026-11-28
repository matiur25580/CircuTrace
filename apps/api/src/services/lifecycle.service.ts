import mongoose from 'mongoose';
import { LifecycleSequence } from '../models/lifecycle-sequence.model.js';
import { Product } from '../models/product.model.js';
import { AuditEvent } from '../models/audit-event.model.js';
import { ProductLifecycleEvent } from '../models/product-lifecycle-event.model.js';

type LifecycleType = 'manufactured' | 'quality_inspected' | 'packaged' | 'dispatched' | 'shipped' | 'received' | 'custody_transferred' | 'repaired' | 'refurbished' | 'recycled' | 'recalled';
type SourceClassification = 'self_reported' | 'supplier_provided' | 'system_recorded';
type EventInput = {
  type: LifecycleType; occurredAt: Date; location?: string | null; description: string;
  lotNumber?: string | null; shipmentReference?: string | null; custodyFrom?: string | null; custodyTo?: string | null;
  evidence: Array<{ kind: string; label: string; reference: string; issuer?: string | null; sourceClassification: SourceClassification }>;
  sourceClassification: SourceClassification;
};
type ServiceError = Error & { statusCode: number };
const fail = (message: string, statusCode: number): never => { throw Object.assign(new Error(message), { statusCode }) as ServiceError; };

export function formatLifecycleEventId(organizationId: string, sequence: number): string {
  return `CTE-${organizationId.slice(-5).toUpperCase()}-${String(sequence).padStart(7, '0')}`;
}

export function validateLifecycleEvent(input: Pick<EventInput, 'type' | 'shipmentReference' | 'custodyFrom' | 'custodyTo'>): void {
  if (input.type === 'custody_transferred' && (!input.custodyFrom || !input.custodyTo || input.custodyFrom === input.custodyTo)) {
    fail('A custody transfer requires distinct from and to parties.', 400);
  }
  if (input.type === 'shipped' && !input.shipmentReference) fail('A shipment reference is required for shipped events.', 400);
}

async function nextSequence(organizationId: mongoose.Types.ObjectId): Promise<number> {
  const counter = await LifecycleSequence.findOneAndUpdate(
    { organizationId }, { $inc: { sequence: 1 }, $setOnInsert: { organizationId } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  if (!counter) throw new Error('Unable to allocate lifecycle event sequence.');
  return counter.sequence;
}

export async function appendLifecycleEvent(identifier: string, input: EventInput, organizationId: mongoose.Types.ObjectId, actorUserId: mongoose.Types.ObjectId, requestId?: string) {
  const product = await Product.findOne({ organizationId, identifier: identifier.toUpperCase() }).select('_id identifier status').lean();
  if (!product) return fail('Product was not found in this organization.', 404);
  if (product.status === 'recalled' && input.type !== 'recalled') return fail('Only recall-related events can be appended to a recalled product.', 409);
  validateLifecycleEvent(input);
  const sequence = await nextSequence(organizationId);
  const eventId = formatLifecycleEventId(organizationId.toString(), sequence);
  let event;
  try {
    event = await ProductLifecycleEvent.create({
      ...input, organizationId, productId: product._id, productIdentifier: product.identifier,
      sequence, eventId, actorUserId, requestId,
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      fail('A lifecycle event identifier conflict occurred; retry the request.', 409);
    }
    throw error;
  }
  if (input.type === 'recalled') {
    await Product.updateOne({ _id: product._id, organizationId }, { $set: { status: 'recalled', updatedBy: actorUserId } });
  }
  await AuditEvent.create({
    organizationId, actorUserId, action: 'product.lifecycle_event.appended',
    targetType: 'product_lifecycle_event', targetId: event.id,
    metadata: { eventId, productIdentifier: product.identifier, type: input.type, sequence }, requestId,
  });
  return event;
}

export async function listLifecycleEvents(identifier: string, query: { type?: LifecycleType; page: number; limit: number; order: 'asc' | 'desc' }, organizationId: mongoose.Types.ObjectId) {
  const product = await Product.findOne({ organizationId, identifier: identifier.toUpperCase() }).select('_id identifier').lean();
  if (!product) return fail('Product was not found in this organization.', 404);
  const filter: Record<string, unknown> = { organizationId, productId: product._id };
  if (query.type) filter.type = query.type;
  const direction = query.order === 'asc' ? 1 : -1;
  const [events, total] = await Promise.all([
    ProductLifecycleEvent.find(filter).sort({ occurredAt: direction, sequence: direction }).skip((query.page - 1) * query.limit).limit(query.limit).populate('actorUserId', 'name email').lean(),
    ProductLifecycleEvent.countDocuments(filter),
  ]);
  return { productIdentifier: product.identifier, events, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
}
