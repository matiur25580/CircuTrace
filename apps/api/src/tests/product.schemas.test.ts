import { describe, expect, it } from 'vitest';
import { createCategorySchema, createProductSchema, productListQuerySchema, updateProductSchema } from '../schemas/product.schemas.js';

describe('product request contracts', () => {
  it('applies safe defaults to a product list query', () => {
    expect(productListQuerySchema.parse({})).toMatchObject({ page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
  });
  it('rejects an invalid GTIN check digit', () => {
    const parsed = createProductSchema.safeParse({ name: 'Reusable bottle', categoryId: '507f1f77bcf86cd799439011', gtin: '12345670', manufacturer: { name: 'Example Works' } });
    expect(parsed.success).toBe(false);
  });
  it('rejects duplicate metadata keys and select fields without options', () => {
    const duplicate = createCategorySchema.safeParse({ name: 'Electronics', metadataFields: [{ key: 'batch', label: 'Batch', type: 'text' }, { key: 'batch', label: 'Batch code', type: 'text' }] });
    const emptySelect = createCategorySchema.safeParse({ name: 'Electronics', metadataFields: [{ key: 'grade', label: 'Grade', type: 'select' }] });
    expect(duplicate.success).toBe(false);
    expect(emptySelect.success).toBe(false);
  });
  it('requires at least one product update field', () => { expect(updateProductSchema.safeParse({}).success).toBe(false); });
});
