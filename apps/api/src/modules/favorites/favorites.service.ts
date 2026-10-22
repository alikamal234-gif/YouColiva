import { Favorite, type IFavorite } from '../../models/favorite.model.js';
import { Listing } from '../../models/listing.model.js';
import { AppError } from '../../errors/app-error.js';
import type { TokenPayload } from '../../utils/auth-tokens.js';

export class FavoritesService {
  static async toggleFavorite(
    listingId: string,
    user: TokenPayload
  ): Promise<{ favorited: boolean }> {
    const listing = await Listing.findById(listingId);
    if (!listing) {
      throw AppError.notFound('Listing not found');
    }

    const existing = await Favorite.findOne({
      user: user.userId,
      listing: listingId,
    });

    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      return { favorited: false };
    }

    await Favorite.create({
      user: user.userId,
      listing: listingId,
    });

    return { favorited: true };
  }

  static async getUserFavorites(user: TokenPayload): Promise<IFavorite[]> {
    return Favorite.find({ user: user.userId })
      .populate({
        path: 'listing',
        populate: { path: 'owner' },
      })
      .sort({ createdAt: -1 });
  }

  static async isFavorited(listingId: string, user?: TokenPayload): Promise<boolean> {
    if (!user) return false;
    const exists = await Favorite.exists({ user: user.userId, listing: listingId });
    return !!exists;
  }
}
