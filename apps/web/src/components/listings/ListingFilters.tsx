'use client';

import React from 'react';
import type { Campus, PropertyType } from '../../types/index.js';
import { PROPERTY_TYPE_LABELS, CAMPUS_DETAILS } from '../../lib/utils.js';
import { RotateCcw } from 'lucide-react';

export interface FilterState {
  campus?: Campus;
  propertyType?: PropertyType;
  priceMax?: number;
  furnished?: boolean;
  availablePlacesMin?: number;
}

export function ListingFilters({
  filters,
  onChange,
  onReset,
}: {
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onReset: () => void;
}) {
  const propertyTypes: PropertyType[] = ['ROOM', 'STUDIO', 'APARTMENT', 'HOUSE'];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
          Filtres de recherche
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-gray-400 hover:text-brand-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Réinitialiser</span>
        </button>
      </div>

      {/* Campus Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Campus</label>
        <select
          value={filters.campus || ''}
          onChange={(e) => onChange({ campus: (e.target.value as Campus) || undefined })}
          className="w-full text-xs h-9 rounded-md border border-gray-300 bg-white px-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600"
        >
          <option value="">Tous les campus</option>
          <option value="YOUSSOUFIA">{CAMPUS_DETAILS.YOUSSOUFIA.label}</option>
          <option value="SAFI">{CAMPUS_DETAILS.SAFI.label}</option>
          <option value="NADOR">{CAMPUS_DETAILS.NADOR.label}</option>
        </select>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Type de bien</label>
        <select
          value={filters.propertyType || ''}
          onChange={(e) =>
            onChange({ propertyType: (e.target.value as PropertyType) || undefined })
          }
          className="w-full text-xs h-9 rounded-md border border-gray-300 bg-white px-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600"
        >
          <option value="">Tous types</option>
          {propertyTypes.map((t) => (
            <option key={t} value={t}>
              {PROPERTY_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Price Max */}
      <div>
        <div className="flex justify-between text-xs font-medium text-gray-700 mb-1.5">
          <span>Budget maximum</span>
          <span className="text-brand-600 font-semibold">
            {filters.priceMax ? `${filters.priceMax} MAD` : 'Illimité'}
          </span>
        </div>
        <input
          type="range"
          min="500"
          max="5000"
          step="100"
          value={filters.priceMax || 5000}
          onChange={(e) => onChange({ priceMax: Number(e.target.value) })}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>500 MAD</span>
          <span>5000 MAD</span>
        </div>
      </div>

      {/* Furnished & Colocation Status */}
      <div className="pt-2 border-t border-gray-100 space-y-2.5">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
          <input
            type="checkbox"
            checked={!!filters.furnished}
            onChange={(e) => onChange({ furnished: e.target.checked ? true : undefined })}
            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span>Logement meublé uniquement</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
          <input
            type="checkbox"
            checked={Boolean(filters.availablePlacesMin && filters.availablePlacesMin > 0)}
            onChange={(e) =>
              onChange({ availablePlacesMin: e.target.checked ? 1 : undefined })
            }
            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span>Places libres pour colocation</span>
        </label>
      </div>
    </div>
  );
}
