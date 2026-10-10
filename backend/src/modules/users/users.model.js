import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Preferences drive AI context in later phases (architecture doc §9) but
 * are plain profile data in Phase 1 — no AI/LinkedIn logic touches this
 * model.
 */
const preferencesSchema = new Schema(
  {
    language: { type: String, default: 'English' },
    tone: { type: String, default: 'Neutral' },
    audience: { type: String, default: '' },
    postingFrequency: { type: String, default: '' },
    emojiUsage: { type: String, enum: ['none', 'minimal', 'moderate', 'heavy'], default: 'minimal' },
  },
  { _id: false },
);

const aiSettingsSchema = new Schema(
  {
    model: { type: String, default: 'default' },
    creativity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    preferences: { type: preferencesSchema, default: () => ({}) },
    aiSettings: { type: aiSettingsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export const UserModel = mongoose.model('User', userSchema);
