import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Wallet, Calendar, CheckCircle2 } from 'lucide-react-native';
import { COLORS, formatMAD, formatDateShort, CAMPUS_DETAILS } from '../constants/theme';
import type { RoommatePost } from '../types/index';

export function RoommateCardMobile({ post }: { post: RoommatePost }) {
  const router = useRouter();
  const campusCity = CAMPUS_DETAILS[post.campus]?.city || post.campus;

  const genderLabel =
    post.preferredRoommateGender === 'MALE'
      ? 'Homme'
      : post.preferredRoommateGender === 'FEMALE'
      ? 'Femme'
      : 'Mixte';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/roommate/${post.id}`)}
    >
      {/* Top Header Tags */}
      <View style={styles.headerRow}>
        <View style={styles.campusTag}>
          <Text style={styles.campusTagText}>{campusCity}</Text>
        </View>
        <Text style={styles.genderTag}>{genderLabel}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {post.title}
      </Text>

      {/* Author info */}
      {post.author && (
        <View style={styles.authorRow}>
          <Text style={styles.authorText}>
            Par {post.author.firstName} {post.author.lastName}
          </Text>
          {post.author.isVerified && (
            <View style={styles.verifiedBadge}>
              <CheckCircle2 size={12} color={COLORS.primary} />
              <Text style={styles.verifiedText}>Vérifié</Text>
            </View>
          )}
        </View>
      )}

      {/* Lifestyle Habits Pills */}
      {post.lifestyleHabits && post.lifestyleHabits.length > 0 && (
        <View style={styles.habitsContainer}>
          {post.lifestyleHabits.slice(0, 3).map((habit, idx) => (
            <View key={idx} style={styles.habitPill}>
              <Text style={styles.habitText}>{habit}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer Metrics */}
      <View style={styles.footerRow}>
        <View style={styles.metricItem}>
          <Wallet size={14} color={COLORS.textMuted} />
          <Text style={styles.budgetText}>Max {formatMAD(post.budgetMax)}</Text>
        </View>

        <View style={styles.metricItem}>
          <Calendar size={14} color={COLORS.textMuted} />
          <Text style={styles.dateText}>{formatDateShort(post.targetMoveInDate)}</Text>
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
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  campusTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  campusTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  genderTag: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  authorText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  habitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  habitPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  habitText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  budgetText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
