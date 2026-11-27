import { Schema, model } from 'mongoose';

const membershipSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  role: { type: String, enum: ['owner', 'admin', 'member', 'auditor'], required: true },
  status: { type: String, enum: ['active', 'invited', 'suspended', 'removed'], default: 'active', index: true },
  joinedAt: { type: Date, default: Date.now },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true, versionKey: false });

membershipSchema.index({ userId:  1, organizationId: 1 }, { unique: true });
membershipSchema.index({ organizationId: 1, status: 1, role: 1 });
export const Membership = model('Membership', membershipSchema);
