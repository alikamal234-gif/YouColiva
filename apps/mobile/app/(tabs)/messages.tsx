import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare, ShieldCheck, ChevronRight, Search, User } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { fetchGraphQLMobile } from '../../src/lib/api-client';
import { COLORS } from '../../src/constants/theme';
import type { Conversation, User as UserType } from '../../src/types/index';

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_demo_1',
    participants: [
      {
        id: 'usr_demo_landlord',
        email: 'ahmed.mansouri@gmail.com',
        firstName: 'Ahmed',
        lastName: 'Mansouri',
        role: 'LANDLORD',
        campus: 'YOUSSOUFIA',
        isVerified: true,
      },
    ],
    lastMessage: 'Bonjour ! Oui la chambre est toujours disponible pour les apprenants YouCode.',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    createdAt: new Date().toISOString(),
    listingId: 'list_1',
  },
  {
    id: 'conv_demo_2',
    participants: [
      {
        id: 'usr_demo_student_2',
        email: 'yassine.idrissi@youcode.ma',
        firstName: 'Yassine',
        lastName: 'Idrissi',
        role: 'STUDENT',
        campus: 'SAFI',
        isVerified: true,
      },
    ],
    lastMessage: 'Salam Karim, on peut visiter l’appartement ensemble ce samedi ?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    createdAt: new Date().toISOString(),
    roommatePostId: 'roommate_1',
  },
];

function formatTime(isoString?: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user, token, isAuthenticated, loginAsDemoStudent } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!token) {
      setConversations(DEMO_CONVERSATIONS);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const query = `
        query MyConversations {
          myConversations {
            id
            lastMessage
            lastMessageAt
            createdAt
            listingId
            roommatePostId
            participants {
              id
              firstName
              lastName
              role
              campus
              isVerified
              avatarUrl
            }
          }
        }
      `;

      const data = await fetchGraphQLMobile<{ myConversations: Conversation[] }>(
        query,
        {},
        token
      );

      if (data.myConversations && data.myConversations.length > 0) {
        setConversations(data.myConversations);
      } else {
        // Fallback to sample conversations for preview if empty
        setConversations(DEMO_CONVERSATIONS);
      }
    } catch {
      setConversations(DEMO_CONVERSATIONS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const getOtherParticipant = (conv: Conversation): Partial<UserType> | null => {
    if (!conv.participants || conv.participants.length === 0) return null;
    const other = conv.participants.find((p) => p.id !== user?.id);
    return other || conv.participants[0];
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const other = getOtherParticipant(item);
    const initial = other?.firstName ? other.firstName.charAt(0).toUpperCase() : 'U';
    const fullName = other ? `${other.firstName} ${other.lastName || ''}`.trim() : 'Utilisateur';
    const isLandlord = other?.role === 'LANDLORD' || other?.role === 'AGENT';

    return (
      <TouchableOpacity
        style={styles.convCard}
        activeOpacity={0.75}
        onPress={() =>
          router.push({
            pathname: '/chat/[id]',
            params: {
              id: item.id,
              conversationId: item.id,
              recipientName: fullName,
              recipientRole: other?.role || 'STUDENT',
              isVerified: other?.isVerified ? 'true' : 'false',
            },
          })
        }
      >
        {/* Avatar */}
        <View style={[styles.avatar, isLandlord && styles.avatarLandlord]}>
          <Text style={[styles.avatarText, isLandlord && styles.avatarTextLandlord]}>
            {initial}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.convInfo}>
          <View style={styles.convTopRow}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {fullName}
              </Text>
              {other?.isVerified && (
                <ShieldCheck size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={styles.timeText}>{formatTime(item.lastMessageAt)}</Text>
          </View>

          <View style={styles.roleBadgeRow}>
            <Text style={[styles.roleBadge, isLandlord && styles.roleBadgeLandlord]}>
              {isLandlord ? 'Propriétaire' : 'Étudiant YouCode'}
            </Text>
            {item.roommatePostId && (
              <Text style={styles.contextBadge}>Colocation</Text>
            )}
            {item.listingId && (
              <Text style={styles.contextBadge}>Logement</Text>
            )}
          </View>

          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 'Nouvelle conversation'}
          </Text>
        </View>

        <ChevronRight size={16} color={COLORS.textLight} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>
            Échanges directs avec les étudiants et propriétaires
          </Text>
        </View>
      </View>

      {!isAuthenticated ? (
        <View style={styles.authPromptContainer}>
          <MessageSquare size={40} color={COLORS.primary} />
          <Text style={styles.authPromptTitle}>Connectez-vous pour échanger</Text>
          <Text style={styles.authPromptDesc}>
            Accédez à vos discussions, posez vos questions aux bailleurs et trouvez vos futurs
            colocataires.
          </Text>
          <View style={{ width: '100%', gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/auth/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Se connecter / S&apos;inscrire</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryDemoBtn}
              onPress={() => loginAsDemoStudent()}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryDemoBtnText}>Connexion rapide (Démo YouCode)</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageSquare size={44} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Aucune conversation pour l&apos;instant</Text>
          <Text style={styles.emptySubtitle}>
            Consultez les offres de logement ou de colocation pour démarrer votre premier échange.
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Search size={15} color={COLORS.primaryDark} />
            <Text style={styles.exploreBtnText}>Explorer les annonces</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  avatarLandlord: {
    backgroundColor: COLORS.successLight,
    borderColor: '#A7F3D0',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  avatarTextLandlord: {
    color: COLORS.success,
  },
  convInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primaryDark,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeLandlord: {
    color: COLORS.success,
    backgroundColor: COLORS.successLight,
  },
  contextBadge: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lastMessage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  exploreBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  authPromptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  authPromptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 14,
    marginBottom: 6,
  },
  authPromptDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryDemoBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  secondaryDemoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
});
