import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { AuditEvent } from '../models/audit-event.model.js';
import { Product } from '../models/product.model.js';
import { ProductLifecycleEvent } from '../models/product-lifecycle-event.model.js';
import { PublicPassport } from '../models/public-passport.model.js';

type Sections = { identity: boolean; manufacturer: boolean; materials: boolean; lifecycle: boolean };
type ServiceError = Error & { statusCode: number };
const fail = (message: string, statusCode: number): never => { throw Object.assign(new Error(message), { statusCode }) as ServiceError; };

export async function publishPassport(identifier: string, sections: Sections, organizationId: mongoose.Types.ObjectId, actorUserId: mongoose.Types.ObjectId, requestId?: string) {
  const product = await Product.findOne({ organizationId, identifier: identifier.toUpperCase() }).select('_id identifier status').lean();
  if (!product) return fail('Product was not found in this organization.', 404);
  if (product.status === 'draft') return fail('A draft product cannot be published. Activate the product first.', 409);
  const passport = await PublicPassport.findOneAndUpdate(
    { organizationId, productId: product._id },
    { $set: { productIdentifier: product.identifier, status: 'published', sections, publishedAt: new Date(), revokedAt: null, updatedBy: actorUserId },
      $setOnInsert: { organizationId, productId: product._id, publicSlug: randomBytes(24).toString('base64url'), createdBy: actorUserId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  await AuditEvent.create({ organizationId, actorUserId, action: 'product.passport.published', targetType: 'public_passport', targetId: passport.id, metadata: { productIdentifier: product.identifier, sections }, requestId });
  return passport;
}

export async function updatePassport(identifier: string, sections: Sections, organizationId: mongoose.Types.ObjectId, actorUserId: mongoose.Types.ObjectId, requestId?: string) {
  const product = await Product.findOne({ organizationId, identifier: identifier.toUpperCase() }).select('_id identifier').lean();
  if (!product) return fail('Product was not found in this organization.', 404);
  const passport = await PublicPassport.findOneAndUpdate(
    { organizationId, productId: product._id, status: 'published' },
    { $set: { sections, updatedBy: actorUserId } }, { new: true, runValidators: true },
  );
  if (!passport) return fail('No active public passport exists for this product.', 404);
  await AuditEvent.create({ organizationId, actorUserId, action: 'product.passport.updated', targetType: 'public_passport', targetId: passport.id, metadata: { productIdentifier: product.identifier, sections }, requestId });
  return passport;
}

export async function revokePassport(identifier: string, organizationId: mongoose.Types.ObjectId, actorUserId: mongoose.Types.ObjectId, requestId?: string) {
  const product = await Product.findOne({ organizationId, identifier: identifier.toUpperCase() }).select('_id identifier').lean();
  if (!product) return fail('Product was not found in this organization.', 404);
  const passport = await PublicPassport.findOneAndUpdate(
    { organizationId, productId: product._id, status: 'published' },
    { $set: { status: 'revoked', revokedAt: new Date(), updatedBy: actorUserId } }, { new: true },
  );
  if (!passport) return fail('No active public passport exists for this product.', 404);
  await AuditEvent.create({ organizationId, actorUserId, action: 'product.passport.revoked', targetType: 'public_passport', targetId: passport.id, metadata: { productIdentifier: product.identifier }, requestId });
  return passport;
}

export async function getPublicPassport(publicSlug: string) {
  const passport = await PublicPassport.findOne({ publicSlug, status: 'published' }).lean();
  if (!passport) return fail('Public passport was not found.', 404);
  const product = await Product.findOne({ _id: passport.productId, organizationId: passport.organizationId })
    .select('identifier name description status manufacturer materials createdAt updatedAt')
    .populate('categoryId', 'name').lean();
  if (!product) return fail('Public passport was not found.', 404);
  const data: Record<string, unknown> = {
    passport: { status: passport.status, publishedAt: passport.publishedAt, updatedAt: passport.updatedAt },
    productStatus: product.status,
  };
  if (passport.sections.identity) data.identity = { identifier: product.identifier, name: product.name, description: product.description, category: product.categoryId };
  if (passport.sections.manufacturer) data.manufacturer = product.manufacturer;
  if (passport.sections.materials) data.materials = product.materials;
  if (passport.sections.lifecycle) {
    const events = await ProductLifecycleEvent.find({ organizationId: passport.organizationId, productId: passport.productId })
      .select('eventId type occurredAt location description lotNumber shipmentReference sourceClassification evidence.label evidence.kind evidence.issuer')
      .sort({ sequence: 1 }).limit(200).lean();
    data.lifecycle = events;
  }
  return data;
}

export async function getPassportManagement(identifier: string, organizationId: mongoose.Types.ObjectId) {
  const product = await Product.findOne({ organizationId, identifier: identifier.toUpperCase() }).select('_id identifier').lean();
  if (!product) return fail('Product was not found in this organization.', 404);
  return PublicPassport.findOne({ organizationId, productId: product._id }).lean();
}
