import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Users,
  Wallet,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Heart,
  Clock,
} from 'lucide-react-native';
import { fetchGraphQLMobile } from '../../src/lib/api-client';
import { useAuth } from '../../src/context/AuthContext';
import {
  COLORS,
  formatMAD,
  formatDateShort,
  CAMPUS_DETAILS,
} from '../../src/constants/theme';
import type { RoommatePost } from '../../src/types/index';

export default function RoommateDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuth();

  const [post, setPost] = useState<RoommatePost | null>(null);
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
    async function loadRoommatePost() {
      if (!id) return;

      try {
        const query = `
          query MobileGetRoommatePost($id: ID!) {
            roommatePost(id: $id) {
              id
              title
              description
              campus
              budgetMax
              targetMoveInDate
              preferredRoommateGender
              status
              lifestyleHabits
              createdAt
              author {
                id
                firstName
                lastName
                email
                role
                campus
                isVerified
              }
            }
          }
        `;

        const data = await fetchGraphQLMobile<{ roommatePost: RoommatePost | null }>(
          query,
          { id },
          token
        );

        if (data.roommatePost) {
          setPost(data.roommatePost);
        } else {
          // Demo fallback
          setPost({
            id: String(id),
            title: 'Recherche 1 ou 2 colocataires sérieux pour appartement proche YouCode',
            description:
              'Salut ! Je suis apprenant en 1ère année à YouCode. Je cherche des colocataires calmes, motivés par les études et le travail en équipe. J’ai repéré un appartement sympa à 10 min de l’école avec 2 chambres et un grand salon pour coder le soir.',
            campus: 'YOUSSOUFIA',
            budgetMax: 1200,
            targetMoveInDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
            preferredRoommateGender: 'ANY',
            status: 'OPEN',
            lifestyleHabits: ['Calme', 'Non-fumeur', 'Travail en équipe', 'Lève-tôt', 'Propre & ordonné'],
            createdAt: new Date().toISOString(),
            author: {
              id: 'usr_student_sample',
              email: 'yassine.idrissi@youcode.ma',
              firstName: 'Yassine',
              lastName: 'Idrissi',
              role: 'STUDENT',
              campus: 'YOUSSOUFIA',
              isVerified: true,
            },
          });
        }
      } catch {
        // Fallback demo
        setPost({
          id: String(id),
          title: 'Recherche 1 ou 2 colocataires sérieux pour appartement proche YouCode',
          description:
            'Salut ! Je suis apprenant en 1ère année à YouCode. Je cherche des colocataires calmes, motivés par les études et le travail en équipe. J’ai repéré un appartement sympa à 10 min de l’école avec 2 chambres et un grand salon pour coder le soir.',
          campus: 'YOUSSOUFIA',
          budgetMax: 1200,
          targetMoveInDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
          preferredRoommateGender: 'ANY',
          status: 'OPEN',
          lifestyleHabits: ['Calme', 'Non-fumeur', 'Travail en équipe', 'Lève-tôt', 'Propre & ordonné'],
          createdAt: new Date().toISOString(),
          author: {
            id: 'usr_student_sample',
            email: 'yassine.idrissi@youcode.ma',
            firstName: 'Yassine',
            lastName: 'Idrissi',
            role: 'STUDENT',
            campus: 'YOUSSOUFIA',
            isVerified: true,
          },
        });
      } finally {
        setLoading(false);
      }
    }

    loadRoommatePost();
  }, [id, token]);

  const handleContactAuthor = async () => {
    if (!post) return;

    if (post.author?.id && user?.id === post.author.id) {
      Alert.alert('Information', "C'est votre propre annonce de colocation.");
      return;
    }

    setContacting(true);
    try {
      if (post.author?.id && token) {
        const mutation = `
          mutation MobileContactRoommate($recipientId: ID!, $roommatePostId: ID) {
            getOrCreateConversation(recipientId: $recipientId, roommatePostId: $roommatePostId) {
              id
            }
          }
        `;
        const data = await fetchGraphQLMobile<{
          getOrCreateConversation: { id: string };
        }>(
          mutation,
          {
            recipientId: post.author.id,
            roommatePostId: post.id,
          },
          token
        );

        if (data.getOrCreateConversation?.id) {
          router.push({
            pathname: '/chat/[id]',
            params: {
              id: data.getOrCreateConversation.id,
              conversationId: data.getOrCreateConversation.id,
              recipientName: `${post.author.firstName} ${post.author.lastName}`,
              recipientRole: post.author.role,
              isVerified: post.author.isVerified ? 'true' : 'false',
            },
          });
          return;
        }
      }

      // Fallback
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: `conv_rm_${post.id}`,
          conversationId: `conv_rm_${post.id}`,
          recipientName: post.author
            ? `${post.author.firstName} ${post.author.lastName}`
            : 'Étudiant YouCode',
          recipientRole: 'STUDENT',
          isVerified: 'true',
        },
      });
    } catch {
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: `conv_rm_${post.id}`,
          conversationId: `conv_rm_${post.id}`,
          recipientName: post.author
            ? `${post.author.firstName} ${post.author.lastName}`
            : 'Étudiant YouCode',
          recipientRole: 'STUDENT',
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

  if (!post) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <Text style={styles.errorText}>Annonce introuvable</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retourner aux annonces</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const campusCity = CAMPUS_DETAILS[post.campus]?.city || post.campus;
  const authorInitial = post.author?.firstName ? post.author.firstName.charAt(0).toUpperCase() : 'E';

  const genderLabel =
    post.preferredRoommateGender === 'MALE'
      ? 'Hommes uniquement'
      : post.preferredRoommateGender === 'FEMALE'
      ? 'Femmes uniquement'
      : 'Colocation mixte acceptée';

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
          Recherche Colocation
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Author Card */}
        <View style={styles.authorCard}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorAvatarText}>{authorInitial}</Text>
          </View>

          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName}>
                {post.author?.firstName} {post.author?.lastName}
              </Text>
              {post.author?.isVerified && (
                <ShieldCheck size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
              )}
            </View>

            <View style={styles.authorBadgeRow}>
              <Text style={styles.studentBadge}>Apprenant YouCode</Text>
              <Text style={styles.campusBadge}>Campus {campusCity}</Text>
            </View>
          </View>
        </View>

        {/* Post Title */}
        <View style={styles.titleCard}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <View style={styles.postedDateRow}>
            <Clock size={13} color={COLORS.textLight} />
            <Text style={styles.postedDateText}>
              Publié {formatDateShort(post.createdAt)}
            </Text>
          </View>
        </View>

        {/* Highlight Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Wallet size={18} color={COLORS.primaryDark} />
            <Text style={styles.metricLabel}>Budget Max</Text>
            <Text style={styles.metricValue}>{formatMAD(post.budgetMax)}</Text>
            <Text style={styles.metricSub}>par mois</Text>
          </View>

          <View style={styles.metricCard}>
            <Calendar size={18} color={COLORS.primaryDark} />
            <Text style={styles.metricLabel}>Emménagement</Text>
            <Text style={styles.metricValue}>{formatDateShort(post.targetMoveInDate)}</Text>
            <Text style={styles.metricSub}>date souhaitée</Text>
          </View>
        </View>

        {/* Gender Preference Banner */}
        <View style={styles.genderCard}>
          <Users size={16} color={COLORS.primaryDark} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.genderTitle}>Préférence de colocation</Text>
            <Text style={styles.genderValue}>{genderLabel}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>À propos de la recherche</Text>
          <Text style={styles.descriptionText}>{post.description}</Text>
        </View>

        {/* Lifestyle Habits */}
        {post.lifestyleHabits && post.lifestyleHabits.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Habitudes & Style de vie</Text>
            <View style={styles.habitsWrap}>
              {post.lifestyleHabits.map((habit, idx) => (
                <View key={idx} style={styles.habitPill}>
                  <CheckCircle2 size={13} color={COLORS.primary} />
                  <Text style={styles.habitText}>{habit}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Community Trust Banner */}
        <View style={styles.trustBanner}>
          <Sparkles size={18} color={COLORS.primaryDark} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.trustTitle}>Communauté vérifiée YouCode</Text>
            <Text style={styles.trustDesc}>
              Les profils étudiants sont réservés aux apprenants inscrits à YouCode.
              Faites connaissance et visitez les lieux ensemble.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBudgetCol}>
          <Text style={styles.bottomBudgetValue}>{formatMAD(post.budgetMax)}</Text>
          <Text style={styles.bottomBudgetLabel}>budget max / mois</Text>
        </View>

        <TouchableOpacity
          style={styles.contactBtn}
          activeOpacity={0.85}
          onPress={handleContactAuthor}
          disabled={contacting}
        >
          {contacting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MessageSquare size={16} color="#FFFFFF" />
              <Text style={styles.contactBtnText}>Proposer une colocation</Text>
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
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  authorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  authorAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  authorInfo: {
    marginLeft: 14,
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  authorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryDark,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  campusBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 6,
  },
  postedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postedDateText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  metricSub: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 1,
  },
  genderCard: {
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
  genderTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  genderValue: {
    fontSize: 13,
    fontWeight: '600',
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
  habitsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  habitPill: {
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
  habitText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  trustTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 2,
  },
  trustDesc: {
    fontSize: 11,
    color: COLORS.primaryDark,
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
  bottomBudgetCol: {
    justifyContent: 'center',
  },
  bottomBudgetValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  bottomBudgetLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
