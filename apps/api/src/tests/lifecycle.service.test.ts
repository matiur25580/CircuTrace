import { describe, expect, it } from 'vitest';
import { formatLifecycleEventId, validateLifecycleEvent } from '../services/lifecycle.service.js';

describe('product lifecycle traceability rules', () => {
  it('formats organization-scoped event identifiers', () => {
    expect(formatLifecycleEventId('507f1f77bcf86cd799439011', 12)).toBe('CTE-39011-0000012');
  });

  it('requires a distinct sender and recipient for custody transfers', () => {
    expect(() => validateLifecycleEvent({ type: 'custody_transferred', custodyFrom: 'Factory A', custodyTo: 'Warehouse B' })).not.toThrow();
    expect(() => validateLifecycleEvent({ type: 'custody_transferred', custodyFrom: 'Factory A', custodyTo: 'Factory A' })).toThrow('distinct');
    expect(() => validateLifecycleEvent({ type: 'custody_transferred', custodyFrom: 'Factory A', custodyTo: null })).toThrow('distinct');
  });

  it('requires a shipment reference for shipped events', () => {
    expect(() => validateLifecycleEvent({ type: 'shipped', shipmentReference: 'SHIP-42' })).not.toThrow();
    expect(() => validateLifecycleEvent({ type: 'shipped', shipmentReference: null })).toThrow('shipment reference');
  });
});
