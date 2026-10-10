import mongoose from 'mongoose';

const NOTIFICATION_TTL_SECONDS = 60 * 60 * 24 * 90;

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    relatedEntity: {
      type: { type: String },
      id: { type: mongoose.Schema.Types.ObjectId },
    },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: NOTIFICATION_TTL_SECONDS });

export const NotificationModel = mongoose.model('Notification', notificationSchema);
