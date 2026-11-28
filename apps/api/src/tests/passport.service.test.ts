import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  productFindOne: vi.fn(),
  passportFindOne: vi.fn(),
  passportFindOneAndUpdate: vi.fn(),
  auditCreate: vi.fn(),
  lifecycleFind: vi.fn(),
}));

vi.mock('../models/product.model.js', () => ({ Product: { findOne: mocks.productFindOne } }));
vi.mock('../models/public-passport.model.js', () => ({ PublicPassport: { findOne: mocks.passportFindOne, findOneAndUpdate: mocks.passportFindOneAndUpdate } }));
vi.mock('../models/audit-event.model.js', () => ({ AuditEvent: { create: mocks.auditCreate } }));
vi.mock('../models/product-lifecycle-event.model.js', () => ({ ProductLifecycleEvent: { find: mocks.lifecycleFind } }));

import { getPublicPassport, publishPassport } from '../services/passport.service.js';

const orgId = new mongoose.Types.ObjectId();
const actorId = new mongoose.Types.ObjectId();
const productId = new mongoose.Types.ObjectId();

function productLookup(product: Record<string, unknown>) {
  mocks.productFindOne.mockReturnValue({
    select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(product) }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auditCreate.mockResolvedValue({});
});

describe('public passport service security boundaries', () => {
  it('scopes publication to the authenticated organization and rotates the bearer slug', async () => {
    productLookup({ _id: productId, identifier: 'CT-ORG-000001', status: 'active' });
    mocks.passportFindOneAndUpdate.mockResolvedValue({ id: 'passport-1' });
    const sections = { identity: true, manufacturer: false, materials: false, lifecycle: false };

    await publishPassport('ct-org-000001', sections, orgId, actorId, 'request-1');

    expect(mocks.productFindOne).toHaveBeenCalledWith({ organizationId: orgId, identifier: 'CT-ORG-000001' });
    const [filter, update] = mocks.passportFindOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ organizationId: orgId, productId });
    expect(update.$set.publicSlug).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(update.$setOnInsert.publicSlug).toBeUndefined();
    expect(update.$set.status).toBe('published');
    const firstSlug = update.$set.publicSlug;
    await publishPassport('CT-ORG-000001', sections, orgId, actorId, 'request-2');
    const secondSlug = mocks.passportFindOneAndUpdate.mock.calls[1][1].$set.publicSlug;
    expect(secondSlug).not.toBe(firstSlug);
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: orgId,
      actorUserId: actorId,
      action: 'product.passport.published',
    }));
  });

  it('refuses to publish draft products before creating or updating a passport', async () => {
    productLookup({ _id: productId, identifier: 'CT-ORG-000001', status: 'draft' });
    await expect(publishPassport('CT-ORG-000001', {
      identity: true, manufacturer: false, materials: false, lifecycle: false,
    }, orgId, actorId)).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.passportFindOneAndUpdate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it('resolves public slugs only when published and binds the product to the passport tenant', async () => {
    mocks.passportFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        organizationId: orgId,
        productId,
        status: 'published',
        publishedAt: new Date('2026-11-20T00:00:00.000Z'),
        updatedAt: new Date('2026-11-21T00:00:00.000Z'),
        sections: { identity: true, manufacturer: false, materials: false, lifecycle: false },
      }),
    });
    const product = {
      identifier: 'CT-ORG-000001',
      name: 'Reusable bottle',
      description: 'A durable bottle',
      status: 'active',
      categoryId: { name: 'Packaging' },
      manufacturer: { name: 'Private manufacturer record' },
      suppliers: [{ name: 'Must not be exposed' }],
      customAttributes: { internalCost: 999 },
    };
    const lean = vi.fn().mockResolvedValue(product);
    const populate = vi.fn().mockReturnValue({ lean });
    const select = vi.fn().mockReturnValue({ populate });
    mocks.productFindOne.mockReturnValue({ select });

    const result = await getPublicPassport('opaque-public-slug');

    expect(mocks.passportFindOne).toHaveBeenCalledWith({ publicSlug: 'opaque-public-slug', status: 'published' });
    expect(mocks.productFindOne).toHaveBeenCalledWith({ _id: productId, organizationId: orgId });
    expect(result).toMatchObject({ identity: { identifier: 'CT-ORG-000001', name: 'Reusable bottle' } });
    expect(result).not.toHaveProperty('manufacturer');
    expect(result).not.toHaveProperty('suppliers');
    expect(result).not.toHaveProperty('customAttributes');
    expect(select).toHaveBeenCalledWith('identifier name description status categoryId manufacturer materials createdAt updatedAt');
  });

  it('bounds lifecycle disclosure to 200 events and scopes it to the passport tenant and product', async () => {
    mocks.passportFindOne.mockReturnValue({ lean: vi.fn().mockResolvedValue({
      organizationId: orgId, productId, status: 'published', publishedAt: new Date(), updatedAt: new Date(),
      sections: { identity: false, manufacturer: false, materials: false, lifecycle: true },
    }) });
    const eventList = [{ eventId: 'event-1', type: 'manufactured' }];
    const limit = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(eventList) });
    const sort = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ sort });
    mocks.lifecycleFind.mockReturnValue({ select });
    const productLean = vi.fn().mockResolvedValue({ status: 'active' });
    const populate = vi.fn().mockReturnValue({ lean: productLean });
    mocks.productFindOne.mockReturnValue({ select: vi.fn().mockReturnValue({ populate }) });

    const result = await getPublicPassport('lifecycle-slug');

    expect(mocks.lifecycleFind).toHaveBeenCalledWith({ organizationId: orgId, productId });
    expect(limit).toHaveBeenCalledWith(200);
    expect(result.lifecycle).toEqual(eventList);
    expect(result).not.toHaveProperty('identity');
  });

  it('does not resolve a product when the public slug is revoked or unknown', async () => {
    mocks.passportFindOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    await expect(getPublicPassport('revoked-slug')).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.productFindOne).not.toHaveBeenCalled();
  });
});
