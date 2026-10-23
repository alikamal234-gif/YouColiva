import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Home, Users } from 'lucide-react-native';
import { COLORS, formatMAD, PROPERTY_TYPE_LABELS, CAMPUS_DETAILS } from '../constants/theme';
import type { Listing } from '../types/index';

export function ListingCardMobile({ listing }: { listing: Listing }) {
  const router = useRouter();
  const hasPhoto = listing.images && listing.images.length > 0;
  const campusCity = CAMPUS_DETAILS[listing.campus]?.city || listing.campus;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/listing/${listing.id}`)}
    >
      {/* Image Area */}
      <View style={styles.imageContainer}>
        {hasPhoto ? (
          <Image source={{ uri: listing.images[0] }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderContainer}>
            <Home size={32} color={COLORS.textLight} />
            <Text style={styles.placeholderText}>Logement vérifié</Text>
          </View>
        )}

        {/* Campus badge floating on image */}
        <View style={styles.campusBadge}>
          <Text style={styles.campusBadgeText}>{campusCity}</Text>
        </View>

        {/* Available spots tag */}
        {listing.availablePlaces !== undefined && listing.availablePlaces > 0 && (
          <View style={styles.colocBadge}>
            <Users size={12} color={COLORS.primaryDark} />
            <Text style={styles.colocBadgeText}>
              {listing.availablePlaces} place{listing.availablePlaces > 1 ? 's' : ''} libre
            </Text>
          </View>
        )}
      </View>

      {/* Info Area */}
      <View style={styles.content}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatMAD(listing.pricePerMonth)}</Text>
          <Text style={styles.perMonth}>/ mois</Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>

        <View style={styles.locationRow}>
          <MapPin size={13} color={COLORS.textMuted} />
          <Text style={styles.locationText} numberOfLines={1}>
            {listing.neighborhood}, {campusCity}
          </Text>
        </View>

        {/* Footer Meta */}
        <View style={styles.footerRow}>
          <Text style={styles.typeTag}>
            {PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType}
          </Text>
          <Text style={styles.furnishedTag}>
            {listing.furnished ? 'Meublé' : 'Non meublé'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    height: 170,
    width: '100%',
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  campusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  campusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  colocBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(239, 246, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  colocBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  content: {
    padding: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  perMonth: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  typeTag: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  furnishedTag: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
