import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Membership } from '../models/membership.model.js';
import { Organization } from '../models/organization.model.js';
import { rolePermissions, type AuthContext, type OrganizationRole } from '../types/auth.js';

export const authenticate: RequestHandler = async (request, response, next) => {
  try {
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      response.status(401).json({ success: false, error: { code: 'AUTHENTICATION_REQUIRED', message: 'A valid access token is required.' } });
      return;
    }
    const payload = jwt.verify(authorization.slice(7), env.ACCESS_TOKEN_SECRET, {
      issuer: 'circutrace-api', audience: 'circutrace-web',
    }) as jwt.JwtPayload & { org?: string; role?: OrganizationRole };
    if (!payload.sub || !payload.org || !mongoose.isValidObjectId(payload.sub) || !mongoose.isValidObjectId(payload.org)) {
      response.status(401).json({ success: false, error: { code: 'INVALID_ACCESS_TOKEN', message: 'The access token is invalid.' } });
      return;
    }
    const membership = await Membership.findOne({
      userId: payload.sub, organizationId: payload.org, status: 'active',
    });
    const organization = await Organization.findOne({ _id: payload.org, status: 'active' });
    if (!membership || !organization) {
      response.status(403).json({ success: false, error: { code: 'TENANT_ACCESS_DENIED', message: 'Active organization membership is required.' } });
      return;
    }
    const role = membership.role as OrganizationRole;
    request.auth = {
      userId: new mongoose.Types.ObjectId(payload.sub),
      organizationId: new mongoose.Types.ObjectId(payload.org),
      membershipId: membership._id,
      role,
      permissions: rolePermissions[role],
    } satisfies AuthContext;
    next();
  } catch (error) {
    response.status(401).json({ success: false, error: { code: 'INVALID_ACCESS_TOKEN', message: 'The access token is invalid or expired.' } });
  }
};
