import {
  Listing,
  type IListing,
  type PropertyType,
  type ListingStatus,
  type ModerationStatus,
} from '../../models/listing.model.js';
import type { Campus } from '../../models/user.model.js';
import { AppError } from '../../errors/app-error.js';
import type { TokenPayload } from '../../utils/auth-tokens.js';

export interface CreateListingInput {
  title: string;
  description: string;
  campus: Campus;
  neighborhood: string;
  longitude: number;
  latitude: number;
  exactAddress: string;
  pricePerMonth: number;
  propertyType: PropertyType;
  roomCount?: number;
  bathroomCount?: number;
  maxCapacity?: number;
  availablePlaces?: number;
  furnished?: boolean;
  amenities?: string[];
  images?: string[];
  availableFrom?: Date;
}

export interface UpdateListingInput extends Partial<CreateListingInput> {
  id: string;
  status?: ListingStatus;
}

export interface ListingFilterInput {
  campus?: Campus;
  neighborhood?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: PropertyType;
  roomCountMin?: number;
  furnished?: boolean;
  availablePlacesMin?: number;
  status?: ListingStatus;
  near?: {
    longitude: number;
    latitude: number;
    maxDistanceMeters?: number;
  };
  limit?: number;
  offset?: number;
}

export class ListingsService {
  static async createListing(input: CreateListingInput, user: TokenPayload): Promise<IListing> {
    if (!['LANDLORD', 'AGENT', 'ADMIN'].includes(user.role)) {
      throw AppError.forbidden('Only landlords, agents or admins can create housing listings');
    }

    if (input.pricePerMonth < 0) {
      throw AppError.badRequest('Price cannot be negative');
    }

    const listing = await Listing.create({
      owner: user.userId,
      title: input.title.trim(),
      description: input.description.trim(),
      campus: input.campus,
      neighborhood: input.neighborhood.trim(),
      location: {
        type: 'Point',
        coordinates: [input.longitude, input.latitude],
      },
      exactAddress: input.exactAddress.trim(),
      pricePerMonth: input.pricePerMonth,
      propertyType: input.propertyType,
      roomCount: input.roomCount || 1,
      bathroomCount: input.bathroomCount || 1,
      maxCapacity: input.maxCapacity || 1,
      availablePlaces: input.availablePlaces !== undefined ? input.availablePlaces : 1,
      furnished: input.furnished || false,
      amenities: input.amenities || [],
      images: input.images || [],
      status: user.role === 'ADMIN' ? 'PUBLISHED' : 'PENDING_REVIEW',
      moderationStatus: user.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
      availableFrom: input.availableFrom || new Date(),
    });

    return listing;
  }

  static async updateListing(input: UpdateListingInput, user: TokenPayload): Promise<IListing> {
    const listing = await Listing.findById(input.id);
    if (!listing) {
      throw AppError.notFound('Listing not found');
    }

    const isOwner = listing.owner.toString() === user.userId;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw AppError.forbidden('You do not have permission to modify this listing');
    }

    if (input.title) listing.title = input.title.trim();
    if (input.description) listing.description = input.description.trim();
    if (input.campus) listing.campus = input.campus;
    if (input.neighborhood) listing.neighborhood = input.neighborhood.trim();
    if (input.longitude !== undefined && input.latitude !== undefined) {
      listing.location = {
        type: 'Point',
        coordinates: [input.longitude, input.latitude],
      };
    }
    if (input.exactAddress) listing.exactAddress = input.exactAddress.trim();
    if (input.pricePerMonth !== undefined) listing.pricePerMonth = input.pricePerMonth;
    if (input.propertyType) listing.propertyType = input.propertyType;
    if (input.roomCount !== undefined) listing.roomCount = input.roomCount;
    if (input.bathroomCount !== undefined) listing.bathroomCount = input.bathroomCount;
    if (input.maxCapacity !== undefined) listing.maxCapacity = input.maxCapacity;
    if (input.availablePlaces !== undefined) listing.availablePlaces = input.availablePlaces;
    if (input.furnished !== undefined) listing.furnished = input.furnished;
    if (input.amenities) listing.amenities = input.amenities;
    if (input.images) listing.images = input.images;
    if (input.availableFrom) listing.availableFrom = input.availableFrom;

    if (input.status) {
      // Landlord/agent can mark rented, archive, or submit for review
      listing.status = input.status;
    }

    await listing.save();
    return listing;
  }

  static async deleteListing(id: string, user: TokenPayload): Promise<boolean> {
    const listing = await Listing.findById(id);
    if (!listing) {
      throw AppError.notFound('Listing not found');
    }

    const isOwner = listing.owner.toString() === user.userId;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw AppError.forbidden('You do not have permission to delete this listing');
    }

    await Listing.findByIdAndDelete(id);
    return true;
  }

  static async moderateListing(
    id: string,
    status: ModerationStatus,
    reason?: string,
    user?: TokenPayload
  ): Promise<IListing> {
    if (!user || user.role !== 'ADMIN') {
      throw AppError.forbidden('Only administrators can moderate listings');
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      throw AppError.notFound('Listing not found');
    }

    listing.moderationStatus = status;
    if (reason) listing.moderationReason = reason;

    if (status === 'APPROVED') {
      listing.status = 'PUBLISHED';
    } else if (status === 'REJECTED') {
      listing.status = 'DRAFT';
    }

    await listing.save();
    return listing;
  }

  static async getListingById(id: string): Promise<IListing | null> {
    return Listing.findById(id).populate('owner');
  }

  static async queryListings(
    filter: ListingFilterInput
  ): Promise<{ items: IListing[]; total: number }> {
    const query: Record<string, unknown> = {};

    // By default, public queries only see PUBLISHED listings with APPROVED moderation
    query.status = filter.status || 'PUBLISHED';
    query.moderationStatus = 'APPROVED';

    if (filter.campus) {
      query.campus = filter.campus;
    }

    if (filter.neighborhood) {
      query.neighborhood = new RegExp(filter.neighborhood, 'i');
    }

    if (filter.propertyType) {
      query.propertyType = filter.propertyType;
    }

    if (filter.furnished !== undefined) {
      query.furnished = filter.furnished;
    }

    if (filter.availablePlacesMin !== undefined) {
      query.availablePlaces = { $gte: filter.availablePlacesMin };
    }

    if (filter.roomCountMin !== undefined) {
      query.roomCount = { $gte: filter.roomCountMin };
    }

    if (filter.priceMin !== undefined || filter.priceMax !== undefined) {
      const priceQuery: Record<string, number> = {};
      if (filter.priceMin !== undefined) priceQuery.$gte = filter.priceMin;
      if (filter.priceMax !== undefined) priceQuery.$lte = filter.priceMax;
      query.pricePerMonth = priceQuery;
    }

    // Geospatial search if coordinates provided
    if (filter.near) {
      const radiusInRadians = (filter.near.maxDistanceMeters || 10000) / 6378137;
      query.location = {
        $geoWithin: {
          $centerSphere: [[filter.near.longitude, filter.near.latitude], radiusInRadians],
        },
      };
    }

    const limit = Math.min(filter.limit || 20, 50);
    const offset = filter.offset || 0;

    const [items, total] = await Promise.all([
      Listing.find(query)
        .populate('owner')
        .sort(filter.near ? undefined : { createdAt: -1 })
        .skip(offset)
        .limit(limit),
      Listing.countDocuments(query),
    ]);

    return { items, total };
  }
}
