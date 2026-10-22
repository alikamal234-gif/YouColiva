import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IRefreshSession extends Document {
  user: Types.ObjectId;
  tokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refreshSessionSchema = new Schema<IRefreshSession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // MongoDB TTL index to auto-expire sessions
    },
  },
  {
    timestamps: true,
  }
);

export const RefreshSession: Model<IRefreshSession> =
  mongoose.models.RefreshSession ||
  mongoose.model<IRefreshSession>('RefreshSession', refreshSessionSchema);
