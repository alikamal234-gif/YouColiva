import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useCampus } from '../context/CampusContext';
import { COLORS, CAMPUS_DETAILS } from '../constants/theme';
import type { Campus } from '../types/index';

const CAMPUSES: Campus[] = ['YOUSSOUFIA', 'SAFI', 'NADOR'];

export function CampusBarMobile() {
  const { selectedCampus, setSelectedCampus } = useCampus();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CAMPUSES.map((c) => {
          const isActive = selectedCampus === c;
          const info = CAMPUS_DETAILS[c];
          return (
            <TouchableOpacity
              key={c}
              onPress={() => setSelectedCampus(c)}
              activeOpacity={0.7}
              style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
            >
              <Text style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}>
                {info.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  pillInactive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: COLORS.primaryDark,
  },
  pillTextInactive: {
    color: COLORS.textMuted,
  },
});
