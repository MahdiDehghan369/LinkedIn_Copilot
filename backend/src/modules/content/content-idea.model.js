import mongoose from 'mongoose';

const contentIdeaSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    hook: { type: String, default: '' },
    coreIdea: { type: String, default: '' },
    contentType: { type: String, default: '' },
    audience: { type: String, default: '' },
    suggestedCta: { type: String, default: '' },
    suggestedHashtags: { type: [String], default: [] },
    status: { type: String, enum: ['proposed', 'used', 'dismissed'], default: 'proposed', index: true },
    sourceGenerationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AiGeneration' },
  },
  { timestamps: true },
);

export const ContentIdeaModel = mongoose.model('ContentIdea', contentIdeaSchema);
