import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type UserRole = 'STUDENT' | 'LANDLORD' | 'AGENT' | 'ADMIN';
export type Campus = 'YOUSSOUFIA' | 'SAFI' | 'NADOR';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  campus: Campus;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  isEmailVerified: boolean;
  isVerified: boolean;
  agencyName?: string;
  agencyFeeDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Don't return password hash by default
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    role: {
      type: String,
      enum: ['STUDENT', 'LANDLORD', 'AGENT', 'ADMIN'],
      default: 'STUDENT',
      index: true,
    },
    campus: {
      type: String,
      enum: ['YOUSSOUFIA', 'SAFI', 'NADOR'],
      required: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    agencyName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    agencyFeeDetails: {
      type: String,
      trim: true,
      maxlength: 250,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1, campus: 1 });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
