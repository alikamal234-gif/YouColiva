export const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  primaryBorder: '#BFDBFE',
  
  background: '#FFFFFF',
  surface: '#F9FAFB',
  card: '#FFFFFF',
  
  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  
  border: '#E5E7EB',
  borderDark: '#D1D5DB',
  
  success: '#059669',
  successLight: '#ECFDF5',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
};

export const CAMPUS_DETAILS = {
  YOUSSOUFIA: { label: 'Youssoufia', city: 'Youssoufia', tag: 'Campus Youssoufia' },
  SAFI: { label: 'Safi', city: 'Safi', tag: 'Campus Safi' },
  NADOR: { label: 'Nador', city: 'Nador', tag: 'Campus Nador' },
} as const;

export const PROPERTY_TYPE_LABELS = {
  ROOM: 'Chambre',
  STUDIO: 'Studio',
  APARTMENT: 'Appartement',
  HOUSE: 'Maison',
} as const;

export function formatMAD(amount?: number | null): string {
  if (amount === undefined || amount === null) return '0 MAD';
  return `${amount.toLocaleString('fr-FR')} MAD`;
}

export function formatDateShort(dateString?: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
