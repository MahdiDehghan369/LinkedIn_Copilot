import mongoose from 'mongoose';

const calendarSlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: String, required: true },
    time: { type: String },
    topicTag: { type: String },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  },
  { _id: false },
);

const contentCalendarSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weekStart: { type: String, required: true }, // ISO date string, e.g. "2026-08-24"
    slots: { type: [calendarSlotSchema], default: [] },
    preferences: {
      postsPerWeek: { type: Number },
      preferredDays: { type: [String], default: [] },
      preferredTime: { type: String },
    },
  },
  { timestamps: true },
);

contentCalendarSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const ContentCalendarModel = mongoose.model('ContentCalendar', contentCalendarSchema);
