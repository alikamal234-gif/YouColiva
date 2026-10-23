import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Home, Users, ArrowRight, LogIn } from 'lucide-react-native';
import { CampusBarMobile } from '../../src/components/CampusBarMobile';
import { ListingCardMobile } from '../../src/components/ListingCardMobile';
import { RoommateCardMobile } from '../../src/components/RoommateCardMobile';
import { useCampus } from '../../src/context/CampusContext';
import { useAuth } from '../../src/context/AuthContext';
import { fetchGraphQLMobile } from '../../src/lib/api-client';
import { COLORS, CAMPUS_DETAILS } from '../../src/constants/theme';
import type { Listing, RoommatePost } from '../../src/types/index';

export default function HomeScreen() {
  const router = useRouter();
  const { selectedCampus } = useCampus();
  const { user, isAuthenticated } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [roommates, setRoommates] = useState<RoommatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const campusInfo = CAMPUS_DETAILS[selectedCampus];

  const loadFeed = useCallback(async () => {
    try {
      const query = `
        query MobileHomeFeed($campus: Campus) {
          listings(filter: { campus: $campus, limit: 5 }) {
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
            }
          }
          roommatePosts(filter: { campus: $campus, limit: 3 }) {
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
        }
      `;

      const data = await fetchGraphQLMobile<{
        listings: { items: Listing[] };
        roommatePosts: { items: RoommatePost[] };
      }>(query, { campus: selectedCampus });

      setListings(data.listings.items || []);
      setRoommates(data.roommatePosts.items || []);
    } catch {
      // Keep existing data on error or offline
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCampus]);

  useEffect(() => {
    setLoading(true);
    loadFeed();
  }, [loadFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>
            You<Text style={styles.brandAccent}>Coliva</Text>
          </Text>
          <Text style={styles.brandSubtitle}>Campus {campusInfo.city}</Text>
        </View>

        {/* Right Header Actions */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.searchIconBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Search size={17} color={COLORS.primary} />
          </TouchableOpacity>

          {!isAuthenticated ? (
            <TouchableOpacity
              style={styles.loginBtnHeader}
              activeOpacity={0.85}
              onPress={() => router.push('/auth/login')}
            >
              <LogIn size={13} color="#FFFFFF" />
              <Text style={styles.loginBtnHeaderText}>Connexion</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.userBadgeHeader}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <View style={styles.userBadgeAvatar}>
                <Text style={styles.userBadgeInitial}>
                  {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <Text style={styles.userBadgeName} numberOfLines={1}>
                {user?.firstName}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Campus Selector Bar */}
      <CampusBarMobile />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Quick Action Banner */}
        <View style={styles.heroBox}>
          <Text style={styles.heroTitle}>Trouvez votre logement</Text>
          <Text style={styles.heroSubtitle}>
            Chambres, studios et colocations vérifiés pour les étudiants YouCode à {campusInfo.city}.
          </Text>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Home size={15} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Louer un bien</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Users size={15} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Colocataires</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 1: Listings */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Logements récents</Text>
            <Text style={styles.sectionSubtitle}>À proximité immédiate du campus</Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
            <ArrowRight size={13} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : listings.length > 0 ? (
          listings.map((item) => <ListingCardMobile key={item.id} listing={item} />)
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucun logement listé pour le moment à {campusInfo.city}.</Text>
          </View>
        )}

        {/* Section 2: Roommate Posts */}
        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <View>
            <Text style={styles.sectionTitle}>Recherches de colocataires</Text>
            <Text style={styles.sectionSubtitle}>Étudiants cherchant à s&apos;ajouter</Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
            <ArrowRight size={13} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : roommates.length > 0 ? (
          roommates.map((post) => <RoommateCardMobile key={post.id} post={post} />)
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucune demande de colocation active.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  brandAccent: {
    color: COLORS.primary,
  },
  brandSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  loginBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginBtnHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userBadgeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBadgeInitial: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  userBadgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    maxWidth: 75,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  heroBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 14,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
