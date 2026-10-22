import {
  ListingsService,
  type CreateListingInput,
  type UpdateListingInput,
  type ListingFilterInput,
} from './listings.service.js';
import type { IListing, ModerationStatus } from '../../models/listing.model.js';
import type { GraphQLContext } from '../../graphql/context.js';
import { AppError } from '../../errors/app-error.js';

export const listingsResolvers = {
  Listing: {
    id: (parent: IListing) => parent._id.toString(),
    location: (parent: IListing) => ({
      longitude: parent.location.coordinates[0],
      latitude: parent.location.coordinates[1],
    }),
    exactAddress: (parent: IListing, _args: unknown, context: GraphQLContext) => {
      if (!context.user) {
        return null; // Concealed publicly by default
      }
      const ownerObj = parent.owner as unknown as { _id?: { toString(): string } };
      const ownerId = ownerObj?._id ? ownerObj._id.toString() : parent.owner?.toString();
      const isOwner = ownerId === context.user.userId;
      const isAdmin = context.user.role === 'ADMIN';

      if (isOwner || isAdmin) {
        return parent.exactAddress;
      }
      return null;
    },
  },

  Query: {
    listing: async (_parent: unknown, { id }: { id: string }) => {
      return ListingsService.getListingById(id);
    },
    listings: async (_parent: unknown, { filter }: { filter?: ListingFilterInput }) => {
      return ListingsService.queryListings(filter || {});
    },
  },

  Mutation: {
    createListing: async (
      _parent: unknown,
      { input }: { input: CreateListingInput },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to create a listing');
      }
      return ListingsService.createListing(input, context.user);
    },

    updateListing: async (
      _parent: unknown,
      { input }: { input: UpdateListingInput },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to update a listing');
      }
      return ListingsService.updateListing(input, context.user);
    },

    deleteListing: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to delete a listing');
      }
      return ListingsService.deleteListing(id, context.user);
    },

    moderateListing: async (
      _parent: unknown,
      { id, status, reason }: { id: string; status: ModerationStatus; reason?: string },
      context: GraphQLContext
    ) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw AppError.forbidden('Only administrators can moderate listings');
      }
      return ListingsService.moderateListing(id, status, reason, context.user);
    },
  },
};
