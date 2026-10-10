import mongoose from 'mongoose';

export const POST_STATUSES = [
  'DRAFT',
  'GENERATED',
  'EDITED',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHING',
  'PUBLISHED',
  'FAILED',
  'CANCELLED',
];

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: POST_STATUSES,
      default: "DRAFT",
      index: true,
    },
    content: {
      hook: { type: String, default: "" },
      body: { type: String, default: "" },
      cta: { type: String, default: "" },
      hashtags: { type: [String], default: [] },
    },
    topicTags: { type: [String], default: [] },
    originIdeaId: { type: mongoose.Schema.Types.ObjectId, ref: "ContentIdea" },
    sourceGenerationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AiGeneration",
    },
    image: {
      storageKey: { type: String },
      filename: { type: String },
      mimeType: { type: String },
      size: { type: Number },
    },
    approvedAt: { type: Date },
    scheduledFor: { type: Date },
    linkedin: {
      postId: { type: String },
      publishedAt: { type: Date },
      lastError: { type: String },
      retryCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

postSchema.index({ userId: 1, status: 1 });
postSchema.index({ userId: 1, scheduledFor: 1 });

export const PostModel = mongoose.model('Post', postSchema);
