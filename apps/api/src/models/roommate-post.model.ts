import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import type { Campus } from './user.model.js';

export type RoommateGenderPreference = 'ANY' | 'MALE' | 'FEMALE';
export type RoommatePostStatus = 'OPEN' | 'CLOSED';

export interface IRoommatePost extends Document {
  author: Types.ObjectId;
  title: string;
  description: string;
  campus: Campus;
  budgetMax: number; // in MAD
  targetMoveInDate: Date;
  preferredRoommateGender: RoommateGenderPreference;
  status: RoommatePostStatus;
  lifestyleHabits: string[];
  createdAt: Date;
  updatedAt: Date;
}

const roommatePostSchema = new Schema<IRoommatePost>(
  {
    author: {
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
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    campus: {
      type: String,
      enum: ['YOUSSOUFIA', 'SAFI', 'NADOR'],
      required: true,
      index: true,
    },
    budgetMax: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    targetMoveInDate: {
      type: Date,
      required: true,
    },
    preferredRoommateGender: {
      type: String,
      enum: ['ANY', 'MALE', 'FEMALE'],
      default: 'ANY',
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    lifestyleHabits: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

roommatePostSchema.index({ campus: 1, status: 1, budgetMax: 1 });

export const RoommatePost: Model<IRoommatePost> =
  mongoose.models.RoommatePost || mongoose.model<IRoommatePost>('RoommatePost', roommatePostSchema);
