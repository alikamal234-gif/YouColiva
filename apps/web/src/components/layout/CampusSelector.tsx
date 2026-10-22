'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCampus } from '../../context/CampusContext.js';
import { CAMPUS_DETAILS } from '../../lib/utils.js';
import type { Campus } from '../../types/index.js';
import { MapPin, ChevronDown } from 'lucide-react';

export function CampusSelector() {
  const { selectedCampus, setCampus } = useCampus();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const campuses: Campus[] = ['YOUSSOUFIA', 'SAFI', 'NADOR'];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <MapPin className="w-3.5 h-3.5 text-brand-600" />
        <span>{CAMPUS_DETAILS[selectedCampus].city}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Sélectionner un campus YouCode
          </div>
          {campuses.map((campus) => (
            <button
              key={campus}
              type="button"
              onClick={() => {
                setCampus(campus);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-50 transition-colors ${
                selectedCampus === campus
                  ? 'text-brand-600 font-semibold bg-brand-50/50'
                  : 'text-gray-700'
              }`}
            >
              <div>
                <div className="font-medium">{CAMPUS_DETAILS[campus].label}</div>
                <div className="text-[11px] text-gray-400">{CAMPUS_DETAILS[campus].address}</div>
              </div>
              {selectedCampus === campus && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
