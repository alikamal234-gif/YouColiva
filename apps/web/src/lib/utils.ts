import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Campus, PropertyType } from '../types/index.js';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatMAD(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export const CAMPUS_DETAILS: Record<
  Campus,
  { label: string; city: string; coordinates: [number, number]; address: string }
> = {
  YOUSSOUFIA: {
    label: 'YouCode Youssoufia',
    city: 'Youssoufia',
    coordinates: [-8.532, 32.246],
    address: 'Boulevard Moulay Youssef, Youssoufia',
  },
  SAFI: {
    label: 'YouCode Safi',
    city: 'Safi',
    coordinates: [-9.237, 32.299],
    address: 'Route Sidi Bouzid, Safi',
  },
  NADOR: {
    label: 'YouCode Nador',
    city: 'Nador',
    coordinates: [-2.928, 35.168],
    address: 'Avenue des FAR, Nador',
  },
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  ROOM: 'Chambre individuelle',
  STUDIO: 'Studio',
  APARTMENT: 'Appartement',
  HOUSE: 'Maison complète',
};
