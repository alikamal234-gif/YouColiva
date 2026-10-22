'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { fetchGraphQL } from '../../lib/api-client.js';
import { ListingCard } from '../../components/listings/ListingCard.js';
import type { Listing } from '../../types/index.js';

interface FavoriteItem {
  id: string;
  listing: Listing;
  createdAt: string;
}

export default function FavoritesPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/favorites');
      return;
    }

    if (user && token) {
      loadFavorites();
    }
  }, [user, token, authLoading, router]);

  const loadFavorites = async () => {
    setLoading(true);
    setError(null);

    try {
      const query = `
        query GetMyFavorites {
          myFavorites {
            id
            createdAt
            listing {
              id
              title
              description
              campus
              neighborhood
              location {
                longitude
                latitude
              }
              pricePerMonth
              propertyType
              roomCount
              bathroomCount
              maxCapacity
              availablePlaces
              furnished
              amenities
              images
              status
              moderationStatus
              availableFrom
              createdAt
              owner {
                id
                firstName
                lastName
                role
                isVerified
              }
            }
          }
        }
      `;

      const data = await fetchGraphQL<{ myFavorites: FavoriteItem[] }>(query, {}, token);
      setFavorites(data.myFavorites || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de charger vos favoris';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6">
        <div className="text-center py-16 text-neutral-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <Link
            href="/listings"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour aux annonces
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            Mes logements favoris
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Retrouvez rapidement les biens que vous avez sauvegardés pour vos études à YouCode.
          </p>
        </div>

        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
        >
          <Search className="w-4 h-4" />
          Explorer d&apos;autres logements
        </Link>
      </div>

      {error && (
        <div className="mt-6 border border-red-200 bg-red-50 text-red-700 p-4 rounded-md text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadFavorites}
            className="text-xs font-semibold underline hover:text-red-900"
          >
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-neutral-200 rounded-lg p-4 animate-pulse bg-neutral-50 h-72" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 rounded-lg mt-8 bg-neutral-50/50">
          <Heart className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-neutral-900">Aucun favori pour le moment</h3>
          <p className="mt-1 text-sm text-neutral-500 max-w-sm mx-auto">
            Cliquez sur le cœur d&apos;une annonce pour l&apos;ajouter à votre liste et y revenir plus tard.
          </p>
          <div className="mt-6">
            <Link
              href="/listings"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Parcourir les annonces
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {favorites.map((fav) => (
            <ListingCard
              key={fav.id}
              listing={fav.listing}
              initialFavorited={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
