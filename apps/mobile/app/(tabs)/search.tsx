import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Home, Users, RotateCcw } from 'lucide-react-native';
import { CampusBarMobile } from '../../src/components/CampusBarMobile';
import { ListingCardMobile } from '../../src/components/ListingCardMobile';
import { RoommateCardMobile } from '../../src/components/RoommateCardMobile';
import { useCampus } from '../../src/context/CampusContext';
import { fetchGraphQLMobile } from '../../src/lib/api-client';
import { COLORS } from '../../src/constants/theme';
import type { Listing, RoommatePost, PropertyType } from '../../src/types/index';

type TabMode = 'HOUSING' | 'ROOMMATES';

export default function SearchScreen() {
  const { selectedCampus } = useCampus();

  const [activeTab, setActiveTab] = useState<TabMode>('HOUSING');
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [colocOnly, setColocOnly] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [roommates, setRoommates] = useState<RoommatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const performSearch = useCallback(async () => {
    try {
      if (activeTab === 'HOUSING') {
        const query = `
          query MobileSearchListings($filter: ListingFilterInput) {
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
                availablePlaces
                images
              }
            }
          }
        `;

        const filterPayload: Record<string, unknown> = {
          campus: selectedCampus,
        };
        if (propertyType) filterPayload.propertyType = propertyType;
        if (colocOnly) filterPayload.availablePlacesMin = 1;
        if (searchQuery.trim()) filterPayload.neighborhood = searchQuery.trim();

        const data = await fetchGraphQLMobile<{ listings: { items: Listing[] } }>(query, {
          filter: filterPayload,
        });
        setListings(data.listings.items || []);
      } else {
        const query = `
          query MobileSearchRoommates($filter: RoommatePostFilterInput) {
            roommatePosts(filter: $filter) {
              total
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

        const data = await fetchGraphQLMobile<{ roommatePosts: { items: RoommatePost[] } }>(query, {
          filter: { campus: selectedCampus },
        });
        setRoommates(data.roommatePosts.items || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, selectedCampus, propertyType, colocOnly, searchQuery]);

  useEffect(() => {
    setLoading(true);
    performSearch();
  }, [performSearch]);

  const onRefresh = () => {
    setRefreshing(true);
    performSearch();
  };

  const handleReset = () => {
    setSearchQuery('');
    setPropertyType('');
    setColocOnly(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Search Header Bar */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={16} color={COLORS.textMuted} />
          <TextInput
            placeholder="Quartier, mot-clé..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={performSearch}
          />
        </View>

        {(propertyType !== '' || colocOnly || searchQuery !== '') && (
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <RotateCcw size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Campus Selector */}
      <CampusBarMobile />

      {/* Dual Tab Mode Switch */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'HOUSING' && styles.tabButtonActive]}
          onPress={() => setActiveTab('HOUSING')}
          activeOpacity={0.8}
        >
          <Home size={15} color={activeTab === 'HOUSING' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'HOUSING' && styles.tabTextActive]}>
            Logements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'ROOMMATES' && styles.tabButtonActive]}
          onPress={() => setActiveTab('ROOMMATES')}
          activeOpacity={0.8}
        >
          <Users size={15} color={activeTab === 'ROOMMATES' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'ROOMMATES' && styles.tabTextActive]}>
            Colocataires
          </Text>
        </TouchableOpacity>
      </View>

      {/* Housing Sub-filters */}
      {activeTab === 'HOUSING' && (
        <View style={styles.subFiltersRow}>
          <TouchableOpacity
            style={[styles.chip, colocOnly && styles.chipActive]}
            onPress={() => setColocOnly(!colocOnly)}
          >
            <Text style={[styles.chipText, colocOnly && styles.chipTextActive]}>
              Places libres (Colocation)
            </Text>
          </TouchableOpacity>

          {(['STUDIO', 'APARTMENT', 'ROOM'] as PropertyType[]).map((type) => {
            const isSelected = propertyType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setPropertyType(isSelected ? '' : type)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {type === 'ROOM' ? 'Chambre' : type === 'STUDIO' ? 'Studio' : 'Appart'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Results List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
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
        {loading && !refreshing ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 30 }} />
        ) : activeTab === 'HOUSING' ? (
          listings.length > 0 ? (
            listings.map((item) => <ListingCardMobile key={item.id} listing={item} />)
          ) : (
            <View style={styles.emptyContainer}>
              <Home size={32} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>Aucun logement trouvé</Text>
              <Text style={styles.emptyDesc}>
                Essayez d&apos;élargir vos critères ou de changer de campus.
              </Text>
            </View>
          )
        ) : roommates.length > 0 ? (
          roommates.map((post) => <RoommateCardMobile key={post.id} post={post} />)
        ) : (
          <View style={styles.emptyContainer}>
            <Users size={32} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Aucune demande de colocation</Text>
            <Text style={styles.emptyDesc}>
              Soyez le premier à publier votre profil pour trouver des colocataires.
            </Text>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  resetBtn: {
    padding: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 6,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primaryDark,
  },
  subFiltersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.surface,
    marginTop: 10,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
