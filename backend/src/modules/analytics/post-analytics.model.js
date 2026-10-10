import mongoose from 'mongoose';

const analyticsSnapshotSchema = new mongoose.Schema(
  {
    fetchedAt: { type: Date, required: true },
    impressions: { type: Number, default: null },
    reactions: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    reposts: { type: Number, default: 0 },
    engagementRate: { type: Number, default: null },
  },
  { _id: false },
);

const postAnalyticsSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    impressions: { type: Number, default: null },
    reactions: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    reposts: { type: Number, default: 0 },
    engagementRate: { type: Number, default: null },
    fetchedAt: { type: Date },
    history: { type: [analyticsSnapshotSchema], default: [] },
  },
  { timestamps: true },
);

export const PostAnalyticsModel = mongoose.model('PostAnalytics', postAnalyticsSchema);
