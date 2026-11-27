import type { Types } from 'mongoose';

export const roles = ['owner', 'admin', 'member', 'auditor'] as const;
export type OrganizationRole = (typeof roles)[number];

export const permissions = [
  'organization:read',
  'organization:manage',
  'members:read',
  'members:invite',
  'members:manage',
  'products:read',
  'products:write',
  'audit:read',
] as const;
export type Permission = (typeof permissions)[number];

export const rolePermissions: Record<OrganizationRole, readonly Permission[]> = {
  owner: permissions,
  admin: ['organization:read', 'members:read', 'members:invite', 'members:manage', 'products:read', 'products:write', 'audit:read'],
  member: ['organization:read', 'members:read', 'products:read', 'products:write'],
  auditor: ['organization:read', 'members:read', 'products:read', 'audit:read'],
};

export interface AuthContext {
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  membershipId: Types.ObjectId;
  role: OrganizationRole;
  permissions: readonly Permission[];
}
