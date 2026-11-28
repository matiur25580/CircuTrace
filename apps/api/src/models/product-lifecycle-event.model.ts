import { Schema, model } from 'mongoose';

const evidenceReferenceSchema = new Schema({
  kind: { type: String, enum: ['certificate', 'inspection_report', 'invoice', 'shipping_record', 'photo_reference', 'other'], required: true },
  label: { type: String, required: true, trim: true, maxlength: 120 },
  reference: { type: String, required: true, trim: true, maxlength: 500 },
  issuer: { type: String, default: null, trim: true, maxlength: 160 },
  sourceClassification: { type: String, enum: ['self_reported', 'supplier_provided', 'system_recorded'], required: true, default: 'self_reported' },
}, { _id: false, strict: 'throw' });

const lifecycleEventSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, immutable: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, immutable: true },
  productIdentifier: { type: String, required: true, immutable: true, uppercase: true },
  eventId: { type: String, required: true, immutable: true, uppercase: true },
  sequence: { type: Number, required: true, immutable: true, min: 1 },
  type: { type: String, enum: ['manufactured', 'quality_inspected', 'packaged', 'dispatched', 'shipped', 'received', 'custody_transferred', 'repaired', 'refurbished', 'recycled', 'recalled'], required: true, immutable: true },
  occurredAt: { type: Date, required: true, immutable: true },
  location: { type: String, default: null, trim: true, maxlength: 200, immutable: true },
  description: { type: String, required: true, trim: true, maxlength: 2000, immutable: true },
  lotNumber: { type: String, default: null, trim: true, maxlength: 100, immutable: true },
  shipmentReference: { type: String, default: null, trim: true, maxlength: 120, immutable: true },
  custodyFrom: { type: String, default: null, trim: true, maxlength: 160, immutable: true },
  custodyTo: { type: String, default: null, trim: true, maxlength: 160, immutable: true },
  evidence: { type: [evidenceReferenceSchema], default: [], immutable: true },
  sourceClassification: { type: String, enum: ['self_reported', 'supplier_provided', 'system_recorded'], required: true, default: 'self_reported', immutable: true },
  actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  requestId: { type: String, default: null, immutable: true },
}, { timestamps: { createdAt: 'recordedAt', updatedAt: false }, versionKey: false, strict: 'throw' });

lifecycleEventSchema.index({ organizationId: 1, productId: 1, sequence: -1 }, { unique: true });
lifecycleEventSchema.index({ organizationId: 1, eventId: 1 }, { unique: true });
lifecycleEventSchema.index({ organizationId: 1, type: 1, occurredAt: -1 });
lifecycleEventSchema.index({ organizationId: 1, occurredAt: -1 });
export const ProductLifecycleEvent = model('ProductLifecycleEvent', lifecycleEventSchema);
