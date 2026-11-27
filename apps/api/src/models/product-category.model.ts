import { Schema, model } from 'mongoose';

const metadataFieldSchema = new Schema({
  key: { type: String, required: true, trim: true, maxlength: 40 },
  label: { type: String, required: true, trim: true, maxlength: 80 },
  type: { type: String, enum: ['text', 'number', 'boolean', 'date', 'select'], required: true },
  required: { type: Boolean, default: false },
  options: { type: [String], default: [] },
}, { _id: false });

const productCategorySchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  key: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
  description: { type: String, default: '', maxlength: 500 },
  metadataFields: { type: [metadataFieldSchema], default: [] },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, versionKey: false });

productCategorySchema.index({ organizationId: 1, key: 1 }, { unique: true });
productCategorySchema.index({ organizationId: 1, name: 1 });
export const ProductCategory = model('ProductCategory', productCategorySchema);
