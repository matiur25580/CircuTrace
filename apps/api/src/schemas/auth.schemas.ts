import { z } from 'zod';

const password = z.string().min(12).max(128).regex(/[a-z]/, 'Password must include a lowercase letter.').regex(/[A-Z]/, 'Password must include an uppercase letter.').regex(/[0-9]/, 'Password must include a number.');
export const registerSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254), password, organizationName: z.string().trim().min(2).max(120) }).strict();
export const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) }).strict();
export const createOrganizationSchema = z.object({ name: z.string().trim().min(2).max(120) }).strict();
export const switchOrganizationSchema = z.object({ organizationId: z.string().regex(/^[a-f\\d]{24}$/i) }).strict();
export const inviteMemberSchema = z.object({ email: z.string().trim().email().max(254), role: z.enum(['admin', 'member', 'auditor']) }).strict();
export const acceptInvitationSchema = z.object({ token: z.string().min(40).max(128) }).strict();
export const updateMemberRoleSchema = z.object({ role: z.enum(['admin', 'member', 'auditor']) }).strict();
