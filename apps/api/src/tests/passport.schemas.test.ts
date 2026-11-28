import { describe, expect, it } from 'vitest';
import { passportSectionsSchema, publishPassportSchema } from '../schemas/passport.schemas.js';

describe('public digital passport schema', () => {
  it('requires at least one explicitly public section', () => {
    expect(passportSectionsSchema.safeParse({ identity: false, manufacturer: false, materials: false, lifecycle: false }).success).toBe(false);
  });
  it('accepts a limited public section selection', () => {
    expect(publishPassportSchema.safeParse({ sections: { identity: true, manufacturer: false, materials: true, lifecycle: false } }).success).toBe(true);
  });
  it('rejects unknown fields to prevent accidental public data exposure', () => {
    expect(publishPassportSchema.safeParse({ sections: { identity: true, manufacturer: true, materials: false, lifecycle: true, suppliers: true } }).success).toBe(false);
  });
});
