'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Listing } from '../../types/index.js';
import { formatMAD, PROPERTY_TYPE_LABELS, CAMPUS_DETAILS } from '../../lib/utils.js';
import { useAuth } from '../../context/AuthContext.js';
import { fetchGraphQL } from '../../lib/api-client.js';
import { MapPin, Home, Heart } from 'lucide-react';

export function ListingCard({
  listing,
  initialFavorited = false,
}: {
  listing: Listing;
  initialFavorited?: boolean;
}) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoadingFav, setIsLoadingFav] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    setIsLoadingFav(true);
    try {
      const mutation = `
        mutation Fav($listingId: ID!) {
          toggleFavorite(listingId: $listingId) {
            favorited
          }
        }
      `;
      const res = await fetchGraphQL<{ toggleFavorite: { favorited: boolean } }>(mutation, {
        listingId: listing.id,
      });
      setIsFavorited(res.toggleFavorite.favorited);
    } catch {
      // ignore
    } finally {
      setIsLoadingFav(false);
    }
  };

  const hasPhoto = listing.images && listing.images.length > 0;

  return (
    <div className="group border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-gray-300 transition-all flex flex-col">
      {/* Photo / Media Box */}
      <Link href={`/listings/${listing.id}`} className="relative h-48 w-full bg-gray-100 block overflow-hidden">
        {hasPhoto ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <Home className="w-8 h-8 stroke-1 mb-1" />
            <span className="text-xs">Logement vérifié</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={isLoadingFav}
          aria-label={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/80 shadow-sm transition-colors ${
            isFavorited ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        {/* Campus Badge */}
        <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-medium text-gray-700 border border-gray-200/80">
          {CAMPUS_DETAILS[listing.campus]?.city || listing.campus}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              {formatMAD(listing.pricePerMonth)}
            </span>
            <span className="text-xs text-gray-400">/ mois</span>
          </div>

          <Link href={`/listings/${listing.id}`} className="block">
            <h3 className="text-sm font-semibold text-gray-900 hover:text-brand-600 line-clamp-1 transition-colors">
              {listing.title}
            </h3>
          </Link>

          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{listing.neighborhood}</span>
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>{PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType}</span>
          <span>{listing.furnished ? 'Meublé' : 'Non meublé'}</span>
        </div>
      </div>
    </div>
  );
}
