import mongoose from 'mongoose';

const writingStyleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    profile: {
      tone: { type: String, default: '' },
      sentenceLength: { type: String, default: '' },
      technicalDepth: { type: String, default: '' },
      emojiUsage: { type: String, default: '' },
      paragraphStyle: { type: String, default: '' },
      hookStyle: { type: String, default: '' },
      ctaStyle: { type: String, default: '' },
    },
    analyzedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const WritingStyleModel = mongoose.model('WritingStyle', writingStyleSchema);
