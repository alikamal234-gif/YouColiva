import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Home,
  Users,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MessageSquare,
  ShieldAlert,
  Wifi,
  Sparkles,
} from 'lucide-react-native';
import { fetchGraphQLMobile } from '../../src/lib/api-client';
import { useAuth } from '../../src/context/AuthContext';
import {
  COLORS,
  formatMAD,
  formatDateShort,
  PROPERTY_TYPE_LABELS,
  CAMPUS_DETAILS,
} from '../../src/constants/theme';
import type { Listing } from '../../src/types/index';

export default function ListingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    async function loadListingDetail() {
      if (!id) return;

      try {
        const query = `
          query MobileGetListing($id: ID!) {
            listing(id: $id) {
              id
              title
              description
              campus
              neighborhood
              exactAddress
              pricePerMonth
              propertyType
              roomCount
              bathroomCount
              maxCapacity
              availablePlaces
              furnished
              amenities
              images
              createdAt
              owner {
                id
                firstName
                lastName
                role
                phone
                agencyName
                isVerified
              }
            }
          }
        `;

        const data = await fetchGraphQLMobile<{ listing: Listing | null }>(
          query,
          { id },
          token
        );

        if (data.listing) {
          setListing(data.listing);
        } else {
          // Mock preview if id not in database
          setListing({
            id: String(id),
            title: 'Logement étudiant moderne proche YouCode',
            description:
              'Appartement calme et lumineux situé à quelques minutes à pied du campus YouCode. Idéal pour colocation entre apprenants avec espace de travail dédié, fibre optique et cuisine totalement équipée.',
            campus: 'YOUSSOUFIA',
            neighborhood: 'Quartier Al Qods',
            pricePerMonth: 2200,
            propertyType: 'APARTMENT',
            roomCount: 2,
            bathroomCount: 1,
            maxCapacity: 3,
            availablePlaces: 2,
            furnished: true,
            amenities: ['Wifi haut débit', 'Cuisine équipée', 'Bureau de travail', 'Machine à laver', 'Proche YouCode'],
            images: [],
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            owner: {
              id: 'usr_landlord_sample',
              email: 'bailleur@youcoliva.ma',
              firstName: 'Hassan',
              lastName: 'El Fassi',
              role: 'LANDLORD',
              campus: 'YOUSSOUFIA',
              phone: '+212 6 61 23 45 67',
              isVerified: true,
            },
          });
        }
      } catch {
        // Fallback demo state
        setListing({
          id: String(id),
          title: 'Logement étudiant moderne proche YouCode',
          description:
            'Appartement calme et lumineux situé à quelques minutes à pied du campus YouCode. Idéal pour colocation entre apprenants avec espace de travail dédié, fibre optique et cuisine totalement équipée.',
          campus: 'YOUSSOUFIA',
          neighborhood: 'Quartier Al Qods',
          pricePerMonth: 2200,
          propertyType: 'APARTMENT',
          roomCount: 2,
          bathroomCount: 1,
          maxCapacity: 3,
          availablePlaces: 2,
          furnished: true,
          amenities: ['Wifi haut débit', 'Cuisine équipée', 'Bureau de travail', 'Machine à laver', 'Proche YouCode'],
          images: [],
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          owner: {
            id: 'usr_landlord_sample',
            email: 'bailleur@youcoliva.ma',
            firstName: 'Hassan',
            lastName: 'El Fassi',
            role: 'LANDLORD',
            campus: 'YOUSSOUFIA',
            phone: '+212 6 61 23 45 67',
            isVerified: true,
          },
        });
      } finally {
        setLoading(false);
      }
    }

    loadListingDetail();
  }, [id, token]);

  const handleContact = async () => {
    if (!listing) return;

    if (listing.owner?.id && user?.id === listing.owner.id) {
      Alert.alert('Information', "Vous êtes l'auteur de cette publication.");
      return;
    }

    setContacting(true);
    try {
      if (listing.owner?.id && token) {
        const mutation = `
          mutation MobileContactOwner($recipientId: ID!, $listingId: ID) {
            getOrCreateConversation(recipientId: $recipientId, listingId: $listingId) {
              id
            }
          }
        `;
        const data = await fetchGraphQLMobile<{
          getOrCreateConversation: { id: string };
        }>(
          mutation,
          {
            recipientId: listing.owner.id,
            listingId: listing.id,
          },
          token
        );

        if (data.getOrCreateConversation?.id) {
          router.push({
            pathname: '/chat/[id]',
            params: {
              id: data.getOrCreateConversation.id,
              conversationId: data.getOrCreateConversation.id,
              recipientName: `${listing.owner.firstName} ${listing.owner.lastName}`,
              recipientRole: listing.owner.role,
              isVerified: listing.owner.isVerified ? 'true' : 'false',
            },
          });
          return;
        }
      }

      // Fallback navigation to direct chat
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: `conv_${listing.id}`,
          conversationId: `conv_${listing.id}`,
          recipientName: listing.owner
            ? `${listing.owner.firstName} ${listing.owner.lastName}`
            : 'Propriétaire',
          recipientRole: 'LANDLORD',
          isVerified: 'true',
        },
      });
    } catch {
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: `conv_${listing.id}`,
          conversationId: `conv_${listing.id}`,
          recipientName: listing.owner
            ? `${listing.owner.firstName} ${listing.owner.lastName}`
            : 'Propriétaire',
          recipientRole: 'LANDLORD',
          isVerified: 'true',
        },
      });
    } finally {
      setContacting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <Text style={styles.errorText}>Logement introuvable</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retourner aux annonces</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const campusCity = CAMPUS_DETAILS[listing.campus]?.city || listing.campus;
  const hasPhoto = listing.images && listing.images.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {PROPERTY_TYPE_LABELS[listing.propertyType] || 'Logement'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          {hasPhoto ? (
            <Image
              source={{ uri: listing.images[0] }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderBox}>
              <Home size={48} color={COLORS.textLight} />
              <Text style={styles.placeholderLabel}>Logement vérifié YouCode</Text>
            </View>
          )}

          <View style={styles.campusTag}>
            <Text style={styles.campusTagText}>Campus {campusCity}</Text>
          </View>
        </View>

        {/* Available Places Coloc Banner */}
        {listing.availablePlaces !== undefined && listing.availablePlaces > 0 && (
          <View style={styles.colocBanner}>
            <Users size={16} color={COLORS.primaryDark} />
            <Text style={styles.colocBannerText}>
              {listing.availablePlaces} place{listing.availablePlaces > 1 ? 's' : ''} disponible
              {listing.availablePlaces > 1 ? 's' : ''} pour colocation YouCode
            </Text>
          </View>
        )}

        {/* Title & Price Header */}
        <View style={styles.headerCard}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceAmount}>{formatMAD(listing.pricePerMonth)}</Text>
            <Text style={styles.pricePeriod}>/ mois</Text>
          </View>

          <Text style={styles.listingTitle}>{listing.title}</Text>

          <View style={styles.locationContainer}>
            <MapPin size={15} color={COLORS.textMuted} />
            <Text style={styles.locationText}>
              {listing.neighborhood}, {campusCity}
            </Text>
          </View>
        </View>

        {/* Key Features Grid */}
        <View style={styles.specsGrid}>
          <View style={styles.specCard}>
            <Text style={styles.specLabel}>Type</Text>
            <Text style={styles.specValue}>
              {PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType}
            </Text>
          </View>

          <View style={styles.specCard}>
            <Text style={styles.specLabel}>Chambres</Text>
            <Text style={styles.specValue}>{listing.roomCount || 1}</Text>
          </View>

          <View style={styles.specCard}>
            <Text style={styles.specLabel}>Salles de bain</Text>
            <Text style={styles.specValue}>{listing.bathroomCount || 1}</Text>
          </View>

          <View style={styles.specCard}>
            <Text style={styles.specLabel}>Mobilier</Text>
            <Text style={styles.specValue}>{listing.furnished ? 'Meublé' : 'Non meublé'}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Description du bien</Text>
          <Text style={styles.descriptionText}>{listing.description}</Text>
        </View>

        {/* Amenities */}
        {listing.amenities && listing.amenities.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Équipements & Services</Text>
            <View style={styles.amenitiesWrap}>
              {listing.amenities.map((item, idx) => (
                <View key={idx} style={styles.amenityChip}>
                  <CheckCircle2 size={13} color={COLORS.primary} />
                  <Text style={styles.amenityText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Landlord Card */}
        {listing.owner && (
          <View style={styles.ownerCard}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerAvatarText}>
                {listing.owner.firstName ? listing.owner.firstName.charAt(0).toUpperCase() : 'P'}
              </Text>
            </View>
            <View style={styles.ownerInfo}>
              <View style={styles.ownerNameRow}>
                <Text style={styles.ownerName}>
                  {listing.owner.firstName} {listing.owner.lastName}
                </Text>
                {listing.owner.isVerified && (
                  <ShieldCheck size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
                )}
              </View>
              <Text style={styles.ownerRole}>
                {listing.owner.role === 'LANDLORD'
                  ? 'Bailleur vérifié'
                  : 'Membre de la communauté'}
              </Text>
            </View>
          </View>
        )}

        {/* Safety Warning */}
        <View style={styles.safetyCard}>
          <ShieldAlert size={18} color={COLORS.warning} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.safetyTitle}>Conseil de sécurité YouCode</Text>
            <Text style={styles.safetyDesc}>
              Ne versez jamais d&apos;acompte ou de loyer d&apos;avance sans avoir visité le logement
              physiquement et signé le bail.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPrice}>{formatMAD(listing.pricePerMonth)}</Text>
          <Text style={styles.bottomPriceLabel}>loyer mensuel</Text>
        </View>

        <TouchableOpacity
          style={styles.contactBtn}
          activeOpacity={0.85}
          onPress={handleContact}
          disabled={contacting}
        >
          {contacting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MessageSquare size={16} color="#FFFFFF" />
              <Text style={styles.contactBtnText}>Contacter le bailleur</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: 10,
  },
  backBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '600',
    fontSize: 13,
  },
  navBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  navBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imageContainer: {
    height: 220,
    width: '100%',
    backgroundColor: COLORS.card,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  placeholderLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  campusTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  campusTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  colocBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryBorder,
  },
  colocBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
    flex: 1,
  },
  headerCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 6,
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  pricePeriod: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  listingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
  },
  specCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  specLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amenityText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ownerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  ownerAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  ownerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  ownerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  ownerRole: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.warningLight,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  safetyDesc: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
