import { Schema, model } from 'mongoose';

const lifecycleSequenceSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  sequence: { type: Number, required: true, default: 0, min: 0 },
}, { versionKey: false });
lifecycleSequenceSchema.index({ organizationId: 1 }, { unique: true });
export const LifecycleSequence = model('LifecycleSequence', lifecycleSequenceSchema);
