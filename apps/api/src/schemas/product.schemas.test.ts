import { describe, expect, it } from 'vitest';
import { createCategorySchema, createProductSchema, productListQuerySchema } from './product.schemas.js';

describe('product request validation', () => {
  it('accepts a valid GTIN check digit and rejects an invalid one', () => {
    const base = {
      name: 'Reusable bottle',
      categoryId: '507f1f77bcf86cd799439011',
      manufacturer: { name: 'Example Manufacturing' },
    };
    expect(createProductSchema.safeParse({ ...base, gtin: '4006381333931' }).success).toBe(true);
    expect(createProductSchema.safeParse({ ...base, gtin: '4006381333932' }).success).toBe(false);
  });

  it('requires select metadata fields to declare options and unique keys', () => {
    expect(createCategorySchema.safeParse({
      name: 'Electronics',
      metadataFields: [{ key: 'grade', label: 'Grade', type: 'select', required: true, options: ['A', 'B'] }],
    }).success).toBe(true);
    expect(createCategorySchema.safeParse({
      name: 'Electronics',
      metadataFields: [{ key: 'grade', label: 'Grade', type: 'select', required: true, options: [] }],
    }).success).toBe(false);
    expect(createCategorySchema.safeParse({
      name: 'Electronics',
      metadataFields: [
        { key: 'grade', label: 'Grade', type: 'text' },
        { key: 'grade', label: 'Quality', type: 'text' },
      ],
    }).success).toBe(false);
  });

  it('bounds pagination and restricts sort fields to an allowlist', () => {
    expect(productListQuerySchema.safeParse({ page: '1', limit: '100', sort: 'name' }).success).toBe(true);
    expect(productListQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
    expect(productListQuerySchema.safeParse({ sort: 'organizationId' }).success).toBe(false);
  });
});
