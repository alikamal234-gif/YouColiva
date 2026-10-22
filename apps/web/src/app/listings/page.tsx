'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCampus } from '../../context/CampusContext.js';
import { fetchGraphQL } from '../../lib/api-client.js';
import type { Listing, Campus, PropertyType } from '../../types/index.js';
import { ListingCard } from '../../components/listings/ListingCard.js';
import { ListingFilters, type FilterState } from '../../components/listings/ListingFilters.js';
import { CAMPUS_DETAILS } from '../../lib/utils.js';
import { Map, List, Home } from 'lucide-react';

function ListingsContent() {
  const searchParams = useSearchParams();
  const { selectedCampus } = useCampus();

  const [filters, setFilters] = useState<FilterState>({
    campus: (searchParams.get('campus') as Campus) || selectedCampus,
    propertyType: (searchParams.get('type') as PropertyType) || undefined,
    priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
    furnished: searchParams.get('furnished') === 'true' ? true : undefined,
  });

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    async function search() {
      setLoading(true);
      try {
        const query = `
          query Search($filter: ListingFilterInput) {
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
                images
                location { longitude latitude }
              }
            }
          }
        `;

        const filterPayload: Record<string, unknown> = {};
        if (filters.campus) filterPayload.campus = filters.campus;
        if (filters.propertyType) filterPayload.propertyType = filters.propertyType;
        if (filters.priceMax) filterPayload.priceMax = filters.priceMax;
        if (filters.furnished !== undefined) filterPayload.furnished = filters.furnished;

        const data = await fetchGraphQL<{ listings: { items: Listing[]; total: number } }>(
          query,
          { filter: filterPayload }
        );

        setListings(data.listings.items);
      } catch (err) {
        console.error('Failed to query listings:', err);
      } finally {
        setLoading(false);
      }
    }

    search();
  }, [filters]);

  const handleFilterChange = (updated: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleReset = () => {
    setFilters({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Title & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Logements pour étudiants YouCode
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {filters.campus
              ? `Recherche active sur ${CAMPUS_DETAILS[filters.campus].label}`
              : 'Tous les campus YouCode'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Liste</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Carte</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <ListingFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleReset}
          />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {viewMode === 'map' ? (
            <div className="border border-gray-200 rounded-lg p-8 bg-gray-50 text-center min-h-[400px] flex flex-col items-center justify-center">
              <Map className="w-8 h-8 text-brand-600 mb-2" />
              <h3 className="text-sm font-bold text-gray-900">Carte OpenStreetMap</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
                Affichage des marqueurs géographiques approximatifs pour les logements trouvés.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {listings.map((l) => (
                  <span
                    key={l.id}
                    className="text-[11px] bg-white border border-gray-200 px-2 py-1 rounded shadow-sm text-gray-700"
                  >
                    {l.title} ({l.pricePerMonth} MAD)
                  </span>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div>
              <div className="text-xs text-gray-500 mb-4 font-medium">
                {listings.length} logement{listings.length > 1 ? 's' : ''} trouvé
                {listings.length > 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-lg">
              <Home className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900">Aucun logement correspondant</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Essayez d'élargir vos filtres de prix ou de changer de campus.
              </p>
              <button
                onClick={handleReset}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Réinitialiser tous les critères
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Chargement...</div>}>
      <ListingsContent />
    </Suspense>
  );
}
