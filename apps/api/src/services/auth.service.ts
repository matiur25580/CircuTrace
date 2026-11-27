import { randomBytes, createHash, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { Organization } from '../models/organization.model.js';
import { Membership } from '../models/membership.model.js';
import { RefreshToken } from '../models/refresh-token.model.js';
import { AuditEvent } from '../models/audit-event.model.js';
import { rolePermissions, type OrganizationRole } from '../types/auth.js';

const accessTokenSeconds = 15 * 60;
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}
export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRole;
}

async function issueSession(userId: string, organizationId: string, role: OrganizationRole, familyId = randomUUID()) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user || user.status !== 'active') throw new Error('Account is unavailable.');
  const accessToken = jwt.sign(
    { org: organizationId, role, permissions: rolePermissions[role] },
    env.ACCESS_TOKEN_SECRET,
    { subject: userId, expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'], issuer: 'circutrace-api', audience: 'circutrace-web' },
  );
  const refreshToken = randomBytes(48).toString('base64url');
  const tokenHash = hashToken(refreshToken);
  await RefreshToken.create({
    tokenHash, familyId, userId, organizationId,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
  });
  return { accessToken, refreshToken, expiresIn: accessTokenSeconds };
}

export async function register(input: { name: string; email: string; password: string; organizationName: string }, requestId?: string) {
  const email = input.email.toLowerCase().trim();
  if (await User.exists({ email })) {
    const error = new Error('An account with this email already exists.') as Error & { statusCode: number };
    error.statusCode = 409; throw error;
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({ name: input.name.trim(), email, passwordHash });
  let organization;
  try {
    const baseSlug = slugify(input.organizationName) || 'organization';
    let slug = baseSlug;
    for (let attempt = 0; await Organization.exists({ slug }); attempt += 1) {
      slug = `${baseSlug}-${randomBytes(3).toString('hex')}`;
      if (attempt > 4) throw new Error('Unable to allocate an organization URL.');
    }
    organization = await Organization.create({ name: input.organizationName.trim(), slug, createdBy: user._id });
    await Membership.create({ userId: user._id, organizationId: organization._id, role: 'owner', status: 'active' });
    await AuditEvent.create({ organizationId: organization._id, actorUserId: user._id, action: 'organization.created', targetType: 'organization', targetId: organization.id, requestId });
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    if (organization) await Organization.deleteOne({ _id: organization._id });
    throw error;
  }
  const session = await issueSession(user.id, organization.id, 'owner');
  return { session, user: toAuthUser(user), organization: toAuthOrganization(organization, 'owner') };
}

export async function login(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email.toLowerCase().trim() }).select('+passwordHash');
  if (!user || user.status !== 'active' || !(await bcrypt.compare(input.password, user.passwordHash))) {
    const error = new Error('Email or password is incorrect.') as Error & { statusCode: number };
    error.statusCode = 401; throw error;
  }
  const membership = await Membership.findOne({ userId: user._id, status: 'active' }).sort({ createdAt: 1 });
  if (!membership) {
    const error = new Error('No active organization membership was found.') as Error & { statusCode: number };
    error.statusCode = 403; throw error;
  }
  const organization = await Organization.findOne({ _id: membership.organizationId, status: 'active' });
  if (!organization) {
    const error = new Error('Organization is unavailable.') as Error & { statusCode: number };
    error.statusCode = 403; throw error;
  }
  const session = await issueSession(user.id, organization.id, membership.role as OrganizationRole);
  return { session, user: toAuthUser(user), organization: toAuthOrganization(organization, membership.role as OrganizationRole) };
}

export async function rotateRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash }).select('+tokenHash +replacedByTokenHash');
  if (!existing) {
    const error = new Error('Refresh session is invalid.') as Error & { statusCode: number };
    error.statusCode = 401; throw error;
  }
  if (existing.revokedAt) {
    await RefreshToken.updateMany({ familyId: existing.familyId, revokedAt: null }, { $set: { revokedAt: new Date() } });
    const error = new Error('Refresh token reuse detected. Please sign in again.') as Error & { statusCode: number };
    error.statusCode = 401; throw error;
  }
  if (existing.expiresAt <= new Date()) {
    await RefreshToken.updateOne({ _id: existing._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
    const error = new Error('Refresh session has expired.') as Error & { statusCode: number };
    error.statusCode = 401; throw error;
  }
  const membership = await Membership.findOne({ userId: existing.userId, organizationId: existing.organizationId, status: 'active' });
  const organization = await Organization.findOne({ _id: existing.organizationId, status: 'active' });
  if (!membership || !organization) {
    await RefreshToken.updateMany({ familyId: existing.familyId, revokedAt: null }, { $set: { revokedAt: new Date() } });
    const error = new Error('Organization access is no longer active.') as Error & { statusCode: number };
    error.statusCode = 403; throw error;
  }
  const replacement = randomBytes(48).toString('base64url');
  const replacementHash = hashToken(replacement);
  const changed = await RefreshToken.findOneAndUpdate(
    { _id: existing._id, revokedAt: null },
    { $set: { revokedAt: new Date(), replacedByTokenHash: replacementHash } },
    { new: true },
  );
  if (!changed) {
    await RefreshToken.updateMany({ familyId: existing.familyId, revokedAt: null }, { $set: { revokedAt: new Date() } });
    const error = new Error('Refresh token reuse detected. Please sign in again.') as Error & { statusCode: number };
    error.statusCode = 401; throw error;
  }
  const session = await issueSession(existing.userId.toString(), existing.organizationId.toString(), membership.role as OrganizationRole, existing.familyId);
  await RefreshToken.updateOne({ tokenHash: replacementHash }, { $set: { revokedAt: new Date(), replacedByTokenHash: hashToken(session.refreshToken) } });
  return session;
}

export async function revokeRefreshToken(rawToken?: string) {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  const token = await RefreshToken.findOne({ tokenHash }).select('+tokenHash');
  if (token && !token.revokedAt) {
    await RefreshToken.updateOne({ _id: token._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  }
}

export async function createOrganization(userId: string, name: string, requestId?: string) {
  const baseSlug = slugify(name) || 'organization';
  let slug = baseSlug;
  for (let attempt = 0; await Organization.exists({ slug }); attempt += 1) {
    slug = `${baseSlug}-${randomBytes(3).toString('hex')}`;
    if (attempt > 4) throw new Error('Unable to allocate an organization URL.');
  }
  const organization = await Organization.create({ name: name.trim(), slug, createdBy: userId });
  await Membership.create({ userId, organizationId: organization._id, role: 'owner', status: 'active' });
  await AuditEvent.create({ organizationId: organization._id, actorUserId: userId, action: 'organization.created', targetType: 'organization', targetId: organization.id, requestId });
  return toAuthOrganization(organization, 'owner');
}

export async function listOrganizations(userId: string) {
  const memberships = await Membership.find({ userId, status: 'active' }).sort({ createdAt: 1 });
  const organizations = await Organization.find({ _id: { $in: memberships.map((item) => item.organizationId) }, status: 'active' });
  const roles = new Map(memberships.map((item) => [item.organizationId.toString(), item.role as OrganizationRole]));
  return organizations.map((organization) => toAuthOrganization(organization, roles.get(organization.id) ?? 'member'));
}

export async function switchOrganization(userId: string, organizationId: string) {
  const membership = await Membership.findOne({ userId, organizationId, status: 'active' });
  const organization = await Organization.findOne({ _id: organizationId, status: 'active' });
  if (!membership || !organization) {
    const error = new Error('Organization membership not found.') as Error & { statusCode: number };
    error.statusCode = 403; throw error;
  }
  const session = await issueSession(userId, organizationId, membership.role as OrganizationRole);
  return { session, organization: toAuthOrganization(organization, membership.role as OrganizationRole) };
}

export function toAuthUser(user: { id: string; name: string; email: string }): AuthUser {
  return { id: user.id, name: user.name, email: user.email };
}
export function toAuthOrganization(organization: { id: string; name: string; slug: string }, role: OrganizationRole): AuthOrganization {
  return { id: organization.id, name: organization.name, slug: organization.slug, role };
}
