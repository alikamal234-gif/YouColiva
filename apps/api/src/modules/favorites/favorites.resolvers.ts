import { FavoritesService } from './favorites.service.js';
import type { IFavorite } from '../../models/favorite.model.js';
import type { GraphQLContext } from '../../graphql/context.js';
import { AppError } from '../../errors/app-error.js';

export const favoritesResolvers = {
  Favorite: {
    id: (parent: IFavorite) => parent._id.toString(),
  },

  Query: {
    myFavorites: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to view favorites');
      }
      return FavoritesService.getUserFavorites(context.user);
    },

    isListingFavorited: async (
      _parent: unknown,
      { listingId }: { listingId: string },
      context: GraphQLContext
    ) => {
      return FavoritesService.isFavorited(listingId, context.user);
    },
  },

  Mutation: {
    toggleFavorite: async (
      _parent: unknown,
      { listingId }: { listingId: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to favorite a listing');
      }
      return FavoritesService.toggleFavorite(listingId, context.user);
    },
  },
};
