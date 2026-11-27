import { Schema, model } from 'mongoose';

const organizationSchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  slug: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, versionKey: false });

organizationSchema.index({ slug: 1 }, { unique: true });
export const Organization = model('Organization', organizationSchema);
