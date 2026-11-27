import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  emailVerifiedAt: { type: Date, default: null },
  status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
}, { timestamps: true, versionKey: false });

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
