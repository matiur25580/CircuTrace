import { describe, expect, it } from 'vitest';
import { canTransitionProductStatus, formatProductIdentifier, validateCustomAttributes } from '../services/product.service.js';

describe('product identity rules', () => {
  it('formats stable organization-scoped human-readable identifiers', () => {
    expect(formatProductIdentifier('507f1f77bcf86cd799439011', 42)).toBe('CT-39011-000042');
  });

  it('allows only forward lifecycle status transitions', () => {
    expect(canTransitionProductStatus('draft', 'active')).toBe(true);
    expect(canTransitionProductStatus('active', 'recalled')).toBe(true);
    expect(canTransitionProductStatus('recalled', 'active')).toBe(false);
    expect(canTransitionProductStatus('draft', 'recalled')).toBe(false);
  });

  it('validates configurable metadata fields and required values', () => {
    const fields = [
      { key: 'batchNumber', label: 'Batch number', type: 'text' as const, required: true, options: [] },
      { key: 'isRepairable', label: 'Repairable', type: 'boolean' as const, required: false, options: [] },
      { key: 'grade', label: 'Grade', type: 'select' as const, required: false, options: ['A', 'B'] },
    ];
    expect(() => validateCustomAttributes(fields, { batchNumber: 'B-42', isRepairable: true, grade: 'A' })).not.toThrow();
    expect(() => validateCustomAttributes(fields, { isRepairable: true })).toThrow('required');
    expect(() => validateCustomAttributes(fields, { batchNumber: 'B-42', unknown: 'value' })).toThrow('Unknown');
    expect(() => validateCustomAttributes(fields, { batchNumber: 'B-42', grade: 'C' })).toThrow('invalid');
  });
});
