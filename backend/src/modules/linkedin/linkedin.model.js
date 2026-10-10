import mongoose from 'mongoose';

/**
 * Kept as its own collection (not embedded on `users`) so that ordinary
 * `User` reads/responses can never accidentally include token material —
 * architecture doc §D: "separate collection so tokens never ride along
 * on the `users` document."
 */
const linkedInAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    linkedinUserId: { type: String, required: true },
    accessTokenEnc: { type: String, required: true, select: false },
    refreshTokenEnc: { type: String, select: false },
    tokenExpiresAt: { type: Date, required: true },
    scopes: { type: [String], default: [] },
    connectedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['connected', 'expired', 'revoked'],
      default: 'connected',
    },
  },
  { timestamps: true },
);

export const LinkedInAccountModel = mongoose.model('LinkedInAccount', linkedInAccountSchema);
