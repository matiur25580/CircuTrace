import { z } from 'zod';

export const lifecycleEventTypes = ['manufactured', 'quality_inspected', 'packaged', 'dispatched', 'shipped', 'received', 'custody_transferred', 'repaired', 'refurbished', 'recycled', 'recalled'] as const;
const evidenceSchema = z.object({
  kind: z.enum(['certificate', 'inspection_report', 'invoice', 'shipping_record', 'photo_reference', 'other']),
  label: z.string().trim().min(1).max(120),
  reference: z.string().trim().min(1).max(500),
  issuer: z.string().trim().max(160).optional().nullable(),
  sourceClassification: z.enum(['self_reported', 'supplier_provided', 'system_recorded']).default('self_reported'),
}).strict();

export const createLifecycleEventSchema = z.object({
  type: z.enum(lifecycleEventTypes),
  occurredAt: z.coerce.date(),
  location: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().min(3).max(2000),
  lotNumber: z.string().trim().max(100).optional().nullable(),
  shipmentReference: z.string().trim().max(120).optional().nullable(),
  custodyFrom: z.string().trim().min(1).max(160).optional().nullable(),
  custodyTo: z.string().trim().min(1).max(160).optional().nullable(),
  evidence: z.array(evidenceSchema).max(20).default([]),
  sourceClassification: z.enum(['self_reported', 'supplier_provided', 'system_recorded']).default('self_reported'),
}).strict().superRefine((event, context) => {
  if (event.type === 'custody_transferred' && (!event.custodyFrom || !event.custodyTo || event.custodyFrom === event.custodyTo)) {
    context.addIssue({ code: 'custom', path: ['custodyTo'], message: 'A custody transfer requires distinct from and to parties.' });
  }
  if (event.type === 'shipped' && !event.shipmentReference) {
    context.addIssue({ code: 'custom', path: ['shipmentReference'], message: 'A shipment reference is required for shipped events.' });
  }
});

export const lifecycleListQuerySchema = z.object({
  type: z.enum(lifecycleEventTypes).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  order: z.enum(['asc', 'desc']).default('desc'),
}).strict();
