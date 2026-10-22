import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  listingId?: Types.ObjectId;
  roommatePostId?: Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      index: true,
    },
    roommatePostId: {
      type: Schema.Types.ObjectId,
      ref: 'RoommatePost',
      index: true,
    },
    lastMessage: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ participants: 1 });

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', conversationSchema);
