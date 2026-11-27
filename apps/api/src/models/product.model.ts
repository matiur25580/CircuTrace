import { Schema, model } from 'mongoose';

const manufacturerSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  registrationNumber: { type: String, default: null, trim: true, maxlength: 100 },
  countryCode: { type: String, default: null, uppercase: true, trim: true, match: /^[A-Z]{2}$/ },
}, { _id: false });

const supplierSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  role: { type: String, enum: ['supplier', 'assembler', 'distributor'], required: true },
  countryCode: { type: String, default: null, uppercase: true, trim: true, match: /^[A-Z]{2}$/ },
  reference: { type: String, default: null, trim: true, maxlength: 120 },
}, { _id: false });

const materialSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  materialType: { type: String, required: true, trim: true, maxlength: 80 },
  massGrams: { type: Number, required: true, min: 0.001 },
  recycledContentPercent: { type: Number, default: 0, min: 0, max: 100 },
  originCountry: { type: String, default: null, uppercase: true, trim: true, match: /^[A-Z]{2}$/ },
}, { _id: false });

const productSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  identifier: { type: String, required: true, immutable: true, uppercase: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
  description: { type: String, default: '', maxlength: 2000 },
  categoryId: { type: Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
  sku: { type: String, default: undefined, trim: true, uppercase: true, maxlength: 64 },
  gtin: { type: String, default: undefined, trim: true, maxlength: 14, match: /^(?:[0-9]{8}|[0-9]{12,14})$/ },
  status: { type: String, enum: ['draft', 'active', 'discontinued', 'recalled'], default: 'draft', index: true },
  manufacturer: { type: manufacturerSchema, required: true },
  suppliers: { type: [supplierSchema], default: [] },
  materials: { type: [materialSchema], default: [] },
  customAttributes: { type: Schema.Types.Mixed, default: {} },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, versionKey: false, minimize: false });

productSchema.index({ organizationId: 1, identifier: 1 }, { unique: true });
productSchema.index({ organizationId: 1, createdAt: -1 });
productSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
productSchema.index({ organizationId: 1, categoryId: 1, status: 1 });
productSchema.index({ organizationId: 1, name: 1 });
productSchema.index({ organizationId: 1, sku: 1 }, { unique: true, partialFilterExpression: { sku: { $type: 'string' } } });
productSchema.index({ organizationId: 1, gtin: 1 }, { unique: true, partialFilterExpression: { gtin: { $type: 'string' } } });
export const Product = model('Product', productSchema);
