import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { AuditEvent } from '../models/audit-event.model.js';
import { Product } from '../models/product.model.js';
import { ProductCategory } from '../models/product-category.model.js';
import { ProductSequence } from '../models/product-sequence.model.js';

type MetadataField = { key: string; label: string; type: 'text' | 'number' | 'boolean' | 'date' | 'select'; required: boolean; options: string[] };
type ProductStatus = 'draft' | 'active' | 'discontinued' | 'recalled';
type ServiceError = Error & { statusCode: number };
const fail = (message: string, statusCode: number): never => { throw Object.assign(new Error(message), { statusCode }) as ServiceError; };
const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function formatProductIdentifier(organizationId: string, sequence: number): string {
  return `CT-${organizationId.slice(-5).toUpperCase()}-${String(sequence).padStart(6, '0')}`;
}

export function canTransitionProductStatus(from: ProductStatus, to: ProductStatus): boolean {
  const transitions: Record<ProductStatus, ProductStatus[]> = {
    draft: ['active'],
    active: ['discontinued', 'recalled'],
    discontinued: ['recalled'],
    recalled: [],
  };
  return from === to || transitions[from].includes(to);
}

export function validateCustomAttributes(fields: MetadataField[], attributes: Record<string, unknown>): void {
  const allowed = new Map(fields.map((field) => [field.key, field]));
  for (const key of Object.keys(attributes)) if (!allowed.has(key)) fail(`Unknown category attribute: ${key}.`, 400);
  for (const field of fields) {
    const value = attributes[field.key];
    if (value === undefined || value === null || value === '') {
      if (field.required) fail(`Category attribute "${field.label}" is required.`, 400);
      continue;
    }
    const valid = field.type === 'text' ? typeof value === 'string'
      : field.type === 'number' ? typeof value === 'number' && Number.isFinite(value)
      : field.type === 'boolean' ? typeof value === 'boolean'
      : field.type === 'date' ? typeof value === 'string' && !Number.isNaN(Date.parse(value))
      : field.type === 'select' ? typeof value === 'string' && field.options.includes(value)
      : false;
    if (!valid) fail(`Category attribute "${field.label}" has an invalid value.`, 400);
  }
}

async function nextIdentifier(organizationId: mongoose.Types.ObjectId): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const sequence = await ProductSequence.findOneAndUpdate({ organizationId }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
      if (!sequence) throw new Error('Unable to allocate a product identifier.');
      return formatProductIdentifier(organizationId.toString(), sequence.sequence);
    } catch (error) {
      if (!(typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) || attempt === 2) throw error;
    }
  }
  throw new Error('Unable to allocate a product identifier.');
}

function handleDuplicate(error: unknown): never {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
    fail('A product with this SKU, GTIN or identifier already exists in this organization.', 409);
  }
  throw error;
}

export async function listProductCategories(organizationId: mongoose.Types.ObjectId) {
  return ProductCategory.find({ organizationId }).sort({ name: 1 }).lean();
}

export async function createProductCategory(input: { name: string; description: string; metadataFields: MetadataField[] }, organizationId: mongoose.Types.ObjectId, actorUserId: mongoose.Types.ObjectId, requestId?: string) {
  const key = slugify(input.name) || `category-${randomBytes(3).toString('hex')}`;
  try {
    const category = await ProductCategory.create({ ...input, key, organizationId, createdBy: actorUserId });
    await AuditEvent.create({ organizationId, actorUserId, action: 'product_category.created', targetType: 'product_category', targetId: category.id, metadata: { key, name: category.name }, requestId });
    return category;
  } catch (error) { handleDuplicate(error); }
}

export async function createProduct(input: {
  name: string; description: string; categoryId: string; sku?: string; gtin?: string;
  manufacturer: { name: string; registrationNumber?: string | null; countryCode?: string | null };
  suppliers: Array<{ name: string; role: string; countryCode?: string | null; reference?: string | null }>;
  materials: Array<{ name: string; materialType: string; massGrams: number; recycledContentPercent: number; originCountry?: string | null }>;
  customAttributes: Record<string, unknown>;
}, organizationId: mongoose.Types.ObjectId, actorUserId: mongoose.Types.ObjectId, requestId?: string) {
  const category = await ProductCategory.findOne({ _id: input.categoryId, organizationId }).lean();
  if (!category) return fail('Product category was not found in this organization.', 404);
  validateCustomAttributes(category.metadataFields as MetadataField[], input.customAttributes);
  if (input.sku && await Product.exists({ organizationId, sku: input.sku.toUpperCase() })) fail('SKU already exists in this organization.', 409);
  if (input.gtin && await Product.exists({ organizationId, gtin: input.gtin })) fail('GTIN already exists in this organization.', 409);
  const identifier = await nextIdentifier(organizationId);
  try {
    const product = await Product.create({ ...input, organizationId, identifier, createdBy: actorUserId, updatedBy: actorUserId });
    await AuditEvent.create({ organizationId, actorUserId, action: 'product.created', targetType: 'product', targetId: product.id, metadata: { identifier, categoryId: category._id.toString() }, requestId });
    return product;
  } catch (error) { handleDuplicate(error); }
}

export async function listProducts(input: { q?: string; categoryId?: string; status?: ProductStatus; page: number; limit: number; sort: string; order: 'asc' | 'desc' }, organizationId: mongoose.Types.ObjectId) {
  const filter: Record<string, unknown> = { organizationId };
  if (input.categoryId) filter.categoryId = input.categoryId;
  if (input.status) filter.status = input.status;
  if (input.q) {
    const expression = new RegExp(escapeRegex(input.q), 'i');
    filter.$or = [{ identifier: expression }, { name: expression }, { sku: expression }, { gtin: expression }, { 'manufacturer.name': expression }];
  }
  const sortField = input.sort || 'createdAt';
  const direction = input.order === 'asc' ? 1 : -1;
  const [products, total] = await Promise.all([
    Product.find(filter).populate('categoryId', 'name key').sort({ [sortField]: direction, _id: -1 }).skip((input.page - 1) * input.limit).limit(input.limit).lean(),
    Product.countDocuments(filter),
  ]);
  return { products, pagination: { page: input.page, limit: input.limit, total, pages: Math.ceil(total / input.limit) } };
}

export async function getProduct(identifier: string, organizationId: mongoose.Types.ObjectId) {
  const product = await Product.findOne({ organizationId, identifier: identifier.toUpperCase() }).populate('categoryId', 'name key metadataFields').lean();
  if (!product) return fail('Product was not found in this organization.', 404);
  return product;
}

export async function updateProduct(identifier: string, changes: {
  name?: string; description?: string; categoryId?: string; sku?: string | null; gtin?: string | null;
  status?: ProductStatus; manufacturer?: { name: string; registrationNumber?: string | null; countryCode?: string | null };
  suppliers?: Array<{ name: string; role: string; countryCode?: string | null; reference?: string | null }>;
  materials?: Array<{ name: string; materialType: string; massGrams: number; recycledContentPercent: number; originCountry?: string | null }>;
  customAttributes?: Record<string, unknown>;
}, organizationId: mongoose.Types.ObjectId, actorUserId: mongoose.Types.ObjectId, requestId?: string) {
  const product = await Product.findOne({ organizationId, identifier: identifier.toUpperCase() });
  if (!product) return fail('Product was not found in this organization.', 404);
  if (changes.status && !canTransitionProductStatus(product.status as ProductStatus, changes.status)) {
    fail(`Product status cannot transition from ${product.status} to ${changes.status}.`, 409);
  }
  const categoryId = changes.categoryId ?? product.categoryId.toString();
  const category = await ProductCategory.findOne({ _id: categoryId, organizationId }).lean();
  if (!category) return fail('Product category was not found in this organization.', 404);
  const attributes = changes.customAttributes ?? product.customAttributes as Record<string, unknown>;
  validateCustomAttributes(category.metadataFields as MetadataField[], attributes);
  if (changes.sku && await Product.exists({ organizationId, sku: changes.sku.toUpperCase(), _id: { $ne: product._id } })) fail('SKU already exists in this organization.', 409);
  if (changes.gtin && await Product.exists({ organizationId, gtin: changes.gtin, _id: { $ne: product._id } })) fail('GTIN already exists in this organization.', 409);
  product.set({ ...changes, updatedBy: actorUserId });
  try {
    await product.save();
  } catch (error) { handleDuplicate(error); }
  await AuditEvent.create({ organizationId, actorUserId, action: changes.status ? 'product.status_changed' : 'product.updated', targetType: 'product', targetId: product.id, metadata: { identifier: product.identifier, changedFields: Object.keys(changes), status: product.status }, requestId });
  return product;
}
