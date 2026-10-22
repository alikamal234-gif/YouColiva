'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Campus } from '../types/index.js';

interface CampusContextType {
  selectedCampus: Campus;
  setCampus: (campus: Campus) => void;
}

const CampusContext = createContext<CampusContextType>({
  selectedCampus: 'YOUSSOUFIA',
  setCampus: () => {},
});

export function CampusProvider({ children }: { children: React.ReactNode }) {
  const [selectedCampus, setSelectedCampusState] = useState<Campus>('YOUSSOUFIA');

  useEffect(() => {
    const saved = localStorage.getItem('youcoliva_selected_campus') as Campus;
    if (saved && ['YOUSSOUFIA', 'SAFI', 'NADOR'].includes(saved)) {
      setSelectedCampusState(saved);
    }
  }, []);

  const setCampus = (campus: Campus) => {
    setSelectedCampusState(campus);
    localStorage.setItem('youcoliva_selected_campus', campus);
  };

  return (
    <CampusContext.Provider value={{ selectedCampus, setCampus }}>
      {children}
    </CampusContext.Provider>
  );
}

export const useCampus = () => useContext(CampusContext);
