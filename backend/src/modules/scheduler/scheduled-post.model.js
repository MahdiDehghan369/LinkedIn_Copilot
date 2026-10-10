import mongoose from 'mongoose';

const scheduledPostSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    runAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ['pending', 'dispatched', 'failed'], default: 'pending' },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
  },
  { timestamps: true },
);

export const ScheduledPostModel = mongoose.model('ScheduledPost', scheduledPostSchema);
