import { describe, expect, it } from 'vitest';
import { canTransitionProductStatus, formatProductIdentifier, validateCustomAttributes } from './product.service.js';

describe('product identity primitives', () => {
  it('formats stable, organization-scoped human-readable identifiers', () => {
    expect(formatProductIdentifier('507f1f77bcf86cd799439011', 1)).toBe('CT-39011-000001');
    expect(formatProductIdentifier('507f1f77bcf86cd799439011', 42)).toBe('CT-39011-000042');
  });

  it('allows only forward lifecycle transitions', () => {
    expect(canTransitionProductStatus('draft', 'active')).toBe(true);
    expect(canTransitionProductStatus('active', 'discontinued')).toBe(true);
    expect(canTransitionProductStatus('active', 'recalled')).toBe(true);
    expect(canTransitionProductStatus('discontinued', 'recalled')).toBe(true);
    expect(canTransitionProductStatus('recalled', 'active')).toBe(false);
    expect(canTransitionProductStatus('draft', 'recalled')).toBe(false);
    expect(canTransitionProductStatus('active', 'draft')).toBe(false);
    expect(canTransitionProductStatus('active', 'active')).toBe(true);
  });

  it('validates required and typed category metadata', () => {
    const fields = [
      { key: 'batchNumber', label: 'Batch number', type: 'text' as const, required: true, options: [] },
      { key: 'weightGrams', label: 'Weight (g)', type: 'number' as const, required: true, options: [] },
      { key: 'recyclable', label: 'Recyclable', type: 'boolean' as const, required: false, options: [] },
      { key: 'grade', label: 'Grade', type: 'select' as const, required: true, options: ['A', 'B'] },
      { key: 'manufacturedOn', label: 'Manufactured on', type: 'date' as const, required: false, options: [] },
    ];

    expect(() => validateCustomAttributes(fields, {
      batchNumber: 'LOT-2026-01',
      weightGrams: 125.5,
      recyclable: true,
      grade: 'A',
      manufacturedOn: '2026-10-12',
    })).not.toThrow();

    expect(() => validateCustomAttributes(fields, { weightGrams: 100, grade: 'A' })).toThrow(/Batch number.*required/);
    expect(() => validateCustomAttributes(fields, { batchNumber: 'LOT-1', weightGrams: '100', grade: 'A' })).toThrow(/Weight.*invalid/);
    expect(() => validateCustomAttributes(fields, { batchNumber: 'LOT-1', weightGrams: 100, grade: 'C' })).toThrow(/Grade.*invalid/);
    expect(() => validateCustomAttributes(fields, { batchNumber: 'LOT-1', weightGrams: 100, grade: 'A', unexpected: 'value' })).toThrow(/Unknown category attribute/);
  });
});
