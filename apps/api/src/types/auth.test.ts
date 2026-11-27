import { describe, expect, it } from 'vitest';
import { rolePermissions, roles } from './auth.js';

describe('organization role permissions', () => {
  it('defines least-privilege permissions for every role', () => {
    expect(roles).toEqual(['owner', 'admin', 'member', 'auditor']);
    expect(rolePermissions.owner).toContain('organization:manage');
    expect(rolePermissions.auditor).toContain('audit:read');
    expect(rolePermissions.auditor).not.toContain('products:write');
    expect(rolePermissions.member).not.toContain('members:manage');
  });
});
