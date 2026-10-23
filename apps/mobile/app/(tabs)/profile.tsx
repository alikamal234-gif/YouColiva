import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Bookmark,
  Users,
  LifeBuoy,
  ShieldAlert,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useCampus } from '../../src/context/CampusContext';
import { COLORS, CAMPUS_DETAILS } from '../../src/constants/theme';
import type { Campus } from '../../src/types/index';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, loginAsDemoStudent, updateUser } = useAuth();
  const { selectedCampus, setSelectedCampus } = useCampus();

  const handleCampusChange = (campus: Campus) => {
    setSelectedCampus(campus);
    updateUser({ campus });
  };

  const handleLogout = () => {
    logout();
  };

  const campusInfo = CAMPUS_DETAILS[selectedCampus];
  const initial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        {/* <View style={styles.communityPill}> */}
          {/* <Sparkles size={12} color={COLORS.primaryDark} /> */}
          <Text style={styles.communityPillText}>YouCodeur</Text>
        {/* </View> */}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        {isAuthenticated && user ? (
          <View style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>

              <View style={styles.profileMeta}>
                <View style={styles.nameRow}>
                  <Text style={styles.fullName}>
                    {user.firstName} {user.lastName}
                  </Text>
                  {user.isVerified && (
                    <ShieldCheck size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
                  )}
                </View>

                <View style={styles.badgesRow}>
                  <Text style={styles.roleTag}>
                    {user.role === 'STUDENT' ? 'Apprenant YouCode' : 'Propriétaire'}
                  </Text>
                  <Text style={styles.verifiedTag}>Compte vérifié</Text>
                </View>

                <Text style={styles.campusTagText}>
                  Campus {CAMPUS_DETAILS[user.campus || selectedCampus]?.city}
                </Text>
              </View>
            </View>

            {user.bio ? (
              <View style={styles.bioBox}>
                <Text style={styles.bioText}>{user.bio}</Text>
              </View>
            ) : null}

            {/* Contact details */}
            <View style={styles.contactDetails}>
              <View style={styles.contactItem}>
                <Mail size={13} color={COLORS.textMuted} />
                <Text style={styles.contactItemText}>{user.email}</Text>
              </View>
              {user.phone ? (
                <View style={styles.contactItem}>
                  <Phone size={13} color={COLORS.textMuted} />
                  <Text style={styles.contactItemText}>{user.phone}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.authNoticeCard}>
            <User size={36} color={COLORS.textLight} />
            <Text style={styles.authNoticeTitle}>Session non connectée</Text>
            <Text style={styles.authNoticeDesc}>
              Connectez-vous pour gérer votre profil et contacter la communauté YouCode.
            </Text>
            <View style={{ width: '100%', gap: 8 }}>
              <TouchableOpacity
                style={styles.loginBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/auth/login')}
              >
                <Text style={styles.loginBtnText}>Se connecter / S&apos;inscrire</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickDemoBtn}
                activeOpacity={0.8}
                onPress={() => loginAsDemoStudent(selectedCampus)}
              >
                <Sparkles size={14} color={COLORS.primaryDark} />
                <Text style={styles.quickDemoBtnText}>Connexion rapide Démo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Campus Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Campus actif</Text>
          <Text style={styles.sectionSubtitle}>
            Sélectionnez votre campus de rattachement pour filtrer instantanément
          </Text>

          <View style={styles.campusGrid}>
            {(['YOUSSOUFIA', 'SAFI', 'NADOR'] as Campus[]).map((campusKey) => {
              const isSelected = selectedCampus === campusKey;
              const details = CAMPUS_DETAILS[campusKey];

              return (
                <TouchableOpacity
                  key={campusKey}
                  style={[styles.campusButton, isSelected && styles.campusButtonActive]}
                  onPress={() => handleCampusChange(campusKey)}
                  activeOpacity={0.8}
                >
                  <MapPin
                    size={14}
                    color={isSelected ? COLORS.primaryDark : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.campusButtonText,
                      isSelected && styles.campusButtonTextActive,
                    ]}
                  >
                    {details.city}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Menu Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Espace étudiant</Text>

          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/search')}
            >
              <View style={styles.menuIconContainer}>
                <Bookmark size={16} color={COLORS.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>Logements consultés</Text>
                <Text style={styles.menuDesc}>Retrouver vos offres préférées</Text>
              </View>
              <ChevronRight size={16} color={COLORS.textLight} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/search')}
            >
              <View style={styles.menuIconContainer}>
                <Users size={16} color={COLORS.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>Recherches de colocation</Text>
                <Text style={styles.menuDesc}>Annonces publiées par les apprenants</Text>
              </View>
              <ChevronRight size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Help & Safety */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confiance & Sécurité</Text>

          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  'Charte YouColiva',
                  'Plateforme réservée aux étudiants YouCode. Ne payez aucun acompte avant la visite physique du logement. Signalez tout abus à l’équipe pédagogique.'
                );
              }}
            >
              <View style={styles.menuIconContainer}>
                <ShieldAlert size={16} color={COLORS.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>Charte de colocation YouCode</Text>
                <Text style={styles.menuDesc}>Règles de bonne conduite et sécurité</Text>
              </View>
              <ChevronRight size={16} color={COLORS.textLight} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  'Support YouColiva',
                  'Besoin d’aide pour trouver un logement ou un colocataire ? Contactez le bureau des étudiants ou écrivez à contact@youcoliva.ma'
                );
              }}
            >
              <View style={styles.menuIconContainer}>
                <LifeBuoy size={16} color={COLORS.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>Assistance & Contact</Text>
                <Text style={styles.menuDesc}>Équipe support YouColiva</Text>
              </View>
              <ChevronRight size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Session Actions */}
        {isAuthenticated ? (
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <LogOut size={16} color={COLORS.danger} />
            <Text style={styles.logoutBtnText}>Se déconnecter</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.footerInfo}>
          <Text style={styles.footerVersion}>YouColiva Mobile • v1.0.0</Text>
          <Text style={styles.footerCopyright}>Communauté YouCode (Youssoufia, Safi, Nador)</Text>
        </View>
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
  communityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    // backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    // borderColor: None,
  },
  communityPillText: {
    fontSize: 11,
    fontWeight: '600',
    // color: COLORS.primaryDark,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  profileMeta: {
    marginLeft: 14,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  roleTag: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryDark,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedTag: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.success,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  campusTagText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  bioBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bioText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  contactDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactItemText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  authNoticeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  authNoticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 4,
  },
  authNoticeDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickDemoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    paddingVertical: 10,
    borderRadius: 8,
  },
  quickDemoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  campusGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  campusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  campusButtonActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  campusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  campusButtonTextActive: {
    color: COLORS.primaryDark,
  },
  menuBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  menuDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 58,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 20,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.danger,
  },
  footerInfo: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  footerVersion: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  footerCopyright: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
