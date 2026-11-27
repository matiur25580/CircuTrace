import { Schema, model } from 'mongoose';

const auditEventSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, maxlength: 120 },
  targetType: { type: String, required: true, maxlength: 80 },
  targetId: { type: String, default: null, maxlength: 120 },
  metadata: { type: Schema.Types.Mixed, default: {} },
  requestId: { type: String, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });

auditEventSchema.index({ organizationId: 1, createdAt: -1 });
export const AuditEvent = model('AuditEvent', auditEventSchema);
