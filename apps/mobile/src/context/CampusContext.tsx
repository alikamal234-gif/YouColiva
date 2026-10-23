import React, { createContext, useContext, useState } from 'react';
import type { Campus } from '../types/index';

interface CampusContextValue {
  selectedCampus: Campus;
  setSelectedCampus: (campus: Campus) => void;
}

const CampusContext = createContext<CampusContextValue>({
  selectedCampus: 'YOUSSOUFIA',
  setSelectedCampus: () => {},
});

export function CampusProvider({ children }: { children: React.ReactNode }) {
  const [selectedCampus, setSelectedCampus] = useState<Campus>('YOUSSOUFIA');

  return (
    <CampusContext.Provider value={{ selectedCampus, setSelectedCampus }}>
      {children}
    </CampusContext.Provider>
  );
}

export function useCampus() {
  return useContext(CampusContext);
}
