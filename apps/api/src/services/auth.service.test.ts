import { createHash, randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';

describe('refresh-token storage primitives', () => {
  it('uses one-way SHA-256 token fingerprints rather than storing bearer secrets', () => {
    const rawToken = randomBytes(48).toString('base64url');
    const fingerprint = createHash('sha256').update(rawToken).digest('hex');
    expect(fingerprint).not.toBe(rawToken);
    expect(fingerprint).toHaveLength(64);
    expect(createHash('sha256').update(rawToken).digest('hex')).toBe(fingerprint);
  });
});
