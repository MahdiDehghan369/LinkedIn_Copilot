import mongoose from 'mongoose';

const aiGenerationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: {
      type: String,
      enum: ['idea', 'post', 'improve', 'writing_style', 'analyze', 'reply'],
      required: true,
    },
    inputSummary: { type: mongoose.Schema.Types.Mixed },
    output: { type: mongoose.Schema.Types.Mixed, required: true },
    model: { type: String },
    tokensUsed: { type: Number },
    latencyMs: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AiGenerationModel = mongoose.model('AiGeneration', aiGenerationSchema);
