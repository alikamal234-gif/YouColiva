import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import type { Campus } from './user.model.js';

export type PropertyType = 'ROOM' | 'STUDIO' | 'APARTMENT' | 'HOUSE';
export type ListingStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'RENTED' | 'ARCHIVED';
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

export interface IListingLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IListing extends Document {
  owner: Types.ObjectId;
  title: string;
  description: string;
  campus: Campus;
  neighborhood: string;
  location: IListingLocation;
  exactAddress: string;
  pricePerMonth: number; // In Moroccan Dirham (MAD)
  propertyType: PropertyType;
  roomCount: number;
  bathroomCount: number;
  maxCapacity: number;
  availablePlaces: number;
  furnished: boolean;
  amenities: string[];
  images: string[];
  status: ListingStatus;
  moderationStatus: ModerationStatus;
  moderationReason?: string;
  availableFrom: Date;
  createdAt: Date;
  updatedAt: Date;
}

const listingSchema = new Schema<IListing>(
  {
    owner: {
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
    neighborhood: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    exactAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    pricePerMonth: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    propertyType: {
      type: String,
      enum: ['ROOM', 'STUDIO', 'APARTMENT', 'HOUSE'],
      required: true,
      index: true,
    },
    roomCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    bathroomCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxCapacity: {
      type: Number,
      default: 1,
      min: 1,
    },
    availablePlaces: {
      type: Number,
      default: 1,
      min: 0,
    },
    furnished: {
      type: Boolean,
      default: false,
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'RENTED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    moderationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'],
      default: 'PENDING',
      index: true,
    },
    moderationReason: {
      type: String,
      trim: true,
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geolocation search
listingSchema.index({ location: '2dsphere' });

// Compound indexes for high performance filtering
listingSchema.index({ campus: 1, status: 1, pricePerMonth: 1 });
listingSchema.index({ campus: 1, moderationStatus: 1 });

export const Listing: Model<IListing> =
  mongoose.models.Listing || mongoose.model<IListing>('Listing', listingSchema);
