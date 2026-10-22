import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'NEW_LISTING'
  | 'NEW_ROOMMATE_POST'
  | 'NEW_MESSAGE'
  | 'LISTING_MODERATED'
  | 'GENERAL';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['NEW_LISTING', 'NEW_ROOMMATE_POST', 'NEW_MESSAGE', 'LISTING_MODERATED', 'GENERAL'],
      default: 'GENERAL',
    },
    link: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast timeline queries
notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
