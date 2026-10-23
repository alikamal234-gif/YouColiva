'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCampus } from '../../context/CampusContext.js';
import { fetchGraphQL } from '../../lib/api-client.js';
import type {
  Listing,
  RoommatePost,
  Campus,
  PropertyType,
  RoommateGenderPreference,
} from '../../types/index.js';
import { ListingCard } from '../../components/listings/ListingCard.js';
import { RoommateCard } from '../../components/roommates/RoommateCard.js';
import { CAMPUS_DETAILS, PROPERTY_TYPE_LABELS } from '../../lib/utils.js';
import {
  Home,
  Users,
  PlusCircle,
  RotateCcw,
  ArrowRight,
  Filter,
} from 'lucide-react';

type SearchMode = 'HOUSING' | 'ROOMMATES';

function UnifiedSearchContent() {
  const searchParams = useSearchParams();
  const { selectedCampus } = useCampus();

  const initialMode = searchParams.get('mode') === 'roommates' ? 'ROOMMATES' : 'HOUSING';
  const [activeMode, setActiveMode] = useState<SearchMode>(initialMode);

  // Common filters
  const [campus, setCampus] = useState<Campus | ''>(
    (searchParams.get('campus') as Campus) || selectedCampus
  );
  const [budgetMax, setBudgetMax] = useState<number | ''>(
    searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : ''
  );

  // Housing-specific filters
  const [propertyType, setPropertyType] = useState<PropertyType | ''>(
    (searchParams.get('type') as PropertyType) || ''
  );
  const [furnishedOnly, setFurnishedOnly] = useState<boolean>(
    searchParams.get('furnished') === 'true'
  );
  const [colocOnly, setColocOnly] = useState<boolean>(
    searchParams.get('colocOnly') === 'true'
  );

  // Roommate-specific filters
  const [preferredGender, setPreferredGender] = useState<RoommateGenderPreference | ''>('');

  // Data states
  const [listings, setListings] = useState<Listing[]>([]);
  const [roommates, setRoommates] = useState<RoommatePost[]>([]);
  const [colocListings, setColocListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data depending on active mode
  useEffect(() => {
    let isCancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        if (activeMode === 'HOUSING') {
          const query = `
            query SearchListings($filter: ListingFilterInput) {
              listings(filter: $filter) {
                total
                items {
                  id
                  title
                  description
                  campus
                  neighborhood
                  pricePerMonth
                  propertyType
                  furnished
                  availablePlaces
                  images
                  location { longitude latitude }
                }
              }
            }
          `;

          const filterPayload: Record<string, unknown> = {};
          if (campus) filterPayload.campus = campus;
          if (propertyType) filterPayload.propertyType = propertyType;
          if (budgetMax) filterPayload.priceMax = Number(budgetMax);
          if (furnishedOnly) filterPayload.furnished = true;
          if (colocOnly) filterPayload.availablePlacesMin = 1;

          const data = await fetchGraphQL<{ listings: { items: Listing[]; total: number } }>(
            query,
            { filter: filterPayload }
          );

          if (!isCancelled) {
            setListings(data.listings.items);
          }
        } else {
          // ROOMMATES Mode: fetch both roommate posts AND housing with open colocation places
          const query = `
            query SearchRoommatesHub($roommateFilter: RoommatePostFilterInput, $listingFilter: ListingFilterInput) {
              roommatePosts(filter: $roommateFilter) {
                total
                items {
                  id
                  title
                  description
                  campus
                  budgetMax
                  targetMoveInDate
                  preferredRoommateGender
                  lifestyleHabits
                  createdAt
                  author {
                    id
                    firstName
                    lastName
                    isVerified
                    role
                  }
                }
              }
              listings(filter: $listingFilter) {
                items {
                  id
                  title
                  description
                  campus
                  neighborhood
                  pricePerMonth
                  propertyType
                  furnished
                  availablePlaces
                  images
                  location { longitude latitude }
                }
              }
            }
          `;

          const roommateFilterPayload: Record<string, unknown> = {};
          if (campus) roommateFilterPayload.campus = campus;
          if (budgetMax) roommateFilterPayload.budgetMax = Number(budgetMax);
          if (preferredGender) roommateFilterPayload.preferredRoommateGender = preferredGender;

          const listingFilterPayload: Record<string, unknown> = {
            availablePlacesMin: 1, // Only listings with open spots
          };
          if (campus) listingFilterPayload.campus = campus;
          if (budgetMax) listingFilterPayload.priceMax = Number(budgetMax);

          const data = await fetchGraphQL<{
            roommatePosts: { items: RoommatePost[]; total: number };
            listings: { items: Listing[] };
          }>(query, {
            roommateFilter: roommateFilterPayload,
            listingFilter: listingFilterPayload,
          });

          if (!isCancelled) {
            setRoommates(data.roommatePosts.items);
            setColocListings(data.listings.items);
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Erreur lors de la récupération des données';
          setError(msg);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [activeMode, campus, budgetMax, propertyType, furnishedOnly, colocOnly, preferredGender]);

  const handleResetFilters = () => {
    setCampus(selectedCampus);
    setBudgetMax('');
    setPropertyType('');
    setFurnishedOnly(false);
    setColocOnly(false);
    setPreferredGender('');
  };

  const currentCampusInfo = campus ? CAMPUS_DETAILS[campus] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Page Header */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Recherche & Colocation YouCode
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Trouvez un logement indépendant ou rejoignez d&apos;autres apprenants pour partager une maison.
        </p>

        {/* Mode Selector Tabs */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2 p-1 bg-gray-100 rounded-lg max-w-xl">
          <button
            type="button"
            onClick={() => setActiveMode('HOUSING')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-xs sm:text-sm font-semibold transition-all ${
              activeMode === 'HOUSING'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>1. Louer un Logement</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('ROOMMATES')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-xs sm:text-sm font-semibold transition-all ${
              activeMode === 'ROOMMATES'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Rejoindre des Colocataires</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-900 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-brand-600" />
            <span>
              {activeMode === 'HOUSING'
                ? 'Critères pour votre logement'
                : 'Critères de recherche de colocataires'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-gray-400 hover:text-brand-600 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Réinitialiser</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Campus Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Campus YouCode</label>
            <select
              value={campus}
              onChange={(e) => setCampus((e.target.value as Campus) || '')}
              className="w-full text-xs h-9 rounded-md border border-gray-300 bg-white px-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">Tous les campus</option>
              <option value="YOUSSOUFIA">{CAMPUS_DETAILS.YOUSSOUFIA.label}</option>
              <option value="SAFI">{CAMPUS_DETAILS.SAFI.label}</option>
              <option value="NADOR">{CAMPUS_DETAILS.NADOR.label}</option>
            </select>
          </div>

          {/* Budget Max */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Budget max (MAD)
            </label>
            <input
              type="number"
              placeholder="Ex: 1500"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value ? Number(e.target.value) : '')}
              className="w-full text-xs h-9 rounded-md border border-gray-300 bg-white px-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          {/* Housing specific filters */}
          {activeMode === 'HOUSING' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type de bien</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType((e.target.value as PropertyType) || '')}
                  className="w-full text-xs h-9 rounded-md border border-gray-300 bg-white px-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="">Tous types</option>
                  {(['ROOM', 'STUDIO', 'APARTMENT', 'HOUSE'] as PropertyType[]).map((t) => (
                    <option key={t} value={t}>
                      {PROPERTY_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end space-y-1.5 pb-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={furnishedOnly}
                    onChange={(e) => setFurnishedOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>Meublé uniquement</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={colocOnly}
                    onChange={(e) => setColocOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>Avec places de colocation</span>
                </label>
              </div>
            </>
          )}

          {/* Roommates specific filters */}
          {activeMode === 'ROOMMATES' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Préférence de profil
                </label>
                <select
                  value={preferredGender}
                  onChange={(e) =>
                    setPreferredGender((e.target.value as RoommateGenderPreference) || '')
                  }
                  className="w-full text-xs h-9 rounded-md border border-gray-300 bg-white px-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="">Indifférent / Mixte</option>
                  <option value="MALE">Hommes uniquement</option>
                  <option value="FEMALE">Femmes uniquement</option>
                </select>
              </div>

              <div className="flex items-end">
                <Link
                  href="/roommates/new"
                  className="w-full inline-flex items-center justify-center gap-1.5 h-9 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Publier ma recherche</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="underline font-semibold ml-3"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Content Rendering based on Mode */}
      {activeMode === 'HOUSING' ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              {currentCampusInfo
                ? `Maisons & Appartements disponibles à ${currentCampusInfo.city}`
                : 'Tous les logements disponibles'}
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              {listings.length} logement{listings.length > 1 ? 's' : ''} trouvé{listings.length > 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-lg border border-gray-200" />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-lg p-6">
              <Home className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-900">Aucun logement ne correspond à vos filtres</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-4">
                Essayez d&apos;élargir votre budget ou de désactiver certains critères de filtrage.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ROOMMATES MODE */
        <div className="space-y-12">
          {/* Section 1: Demandes de colocataires (Personnes cherchant à s'ajouter / se grouper) */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-600" />
                  <span>Apprenants cherchant des colocataires ({roommates.length})</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Prenez contact directement pour créer une colocation ou partager un loyer.
                </p>
              </div>

              <Link
                href="/roommates/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-md hover:bg-brand-100 transition-colors self-start sm:self-auto"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Publier mon profil de recherche</span>
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 bg-gray-100 rounded-lg border border-gray-200" />
                ))}
              </div>
            ) : roommates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roommates.map((post) => (
                  <RoommateCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white border border-gray-200 rounded-lg p-6">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <h3 className="text-xs font-bold text-gray-900">
                  Aucune recherche active de colocataire pour le moment
                </h3>
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  Soyez le premier à publier votre demande pour trouver des personnes prêtes à louer avec vous.
                </p>
                <Link
                  href="/roommates/new"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                >
                  <span>Créer une demande de colocation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Section 2: Logements avec places libres (Pour rejoindre une maison déjà disponible) */}
          <div className="pt-8 border-t border-gray-200">
            <div className="mb-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <Home className="w-5 h-5 text-brand-600" />
                <span>Logements avec places disponibles pour colocation ({colocListings.length})</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Maisons et appartements où des places sont libres immédiatement pour de nouveaux colocataires.
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-gray-100 rounded-lg border border-gray-200" />
                ))}
              </div>
            ) : colocListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {colocListings.map((item) => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-xs text-gray-500">
                  Aucun logement avec place de colocation vacante pour ces critères.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnifiedSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-xs text-gray-400">
          Chargement de la recherche...
        </div>
      }
    >
      <UnifiedSearchContent />
    </Suspense>
  );
}
