import { Schema, model } from 'mongoose';

const publicPassportSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, immutable: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, immutable: true },
  productIdentifier: { type: String, required: true, immutable: true, uppercase: true },
  publicSlug: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['published', 'revoked'], required: true, default: 'published' },
  sections: {
    identity: { type: Boolean, default: true },
    manufacturer: { type: Boolean, default: true },
    materials: { type: Boolean, default: false },
    lifecycle: { type: Boolean, default: true },
  },
  publishedAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, versionKey: false, strict: 'throw' });

publicPassportSchema.index({ organizationId:  1, productId: 1 }, { unique: true });
publicPassportSchema.index({ organizationId: 1, status: 1, updatedAt: -1 });
export const PublicPassport = model('PublicPassport', publicPassportSchema);
