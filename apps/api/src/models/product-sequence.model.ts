import { Schema, model } from 'mongoose';

const productSequenceSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  sequence: { type: Number, required: true, default: 0, min: 0 },
}, { timestamps: false, versionKey: false });

productSequenceSchema.index({ organizationId: 1 }, { unique: true });
export const ProductSequence = model('ProductSequence', productSequenceSchema);
