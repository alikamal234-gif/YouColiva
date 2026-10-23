import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { GoogleAuthButtonMobile } from '../../src/components/GoogleAuthButtonMobile';
import { COLORS, CAMPUS_DETAILS } from '../../src/constants/theme';
import type { Campus, UserRole } from '../../src/types/index';

type AuthMode = 'LOGIN' | 'REGISTER';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithCredentials, registerWithCredentials, loginAsDemoStudent } = useAuth();

  const [mode, setMode] = useState<AuthMode>('LOGIN');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedCampus, setSelectedCampus] = useState<Campus>('YOUSSOUFIA');
  const [role, setRole] = useState<UserRole>('STUDENT');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adapt to phone's back button
  useEffect(() => {
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      router.replace('/(tabs)');
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  const handleLoginSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await loginWithCredentials(email.trim(), password);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Identifiants incorrects.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await registerWithCredentials({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        campus: selectedCampus,
        role,
      });

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'inscription.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    loginAsDemoStudent(selectedCampus);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.navTitle}>
          {mode === 'LOGIN' ? 'Connexion' : 'Créer un compte'}
        </Text>

        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>
              You<Text style={styles.brandAccent}>Coliva</Text>
            </Text>
            <Text style={styles.brandHeading}>
              {mode === 'LOGIN' ? 'Connexion à votre espace' : 'Rejoindre la communauté YouCode'}
            </Text>
            <Text style={styles.brandSubtitle}>
              {mode === 'LOGIN'
                ? 'Accédez à vos annonces, vos messages et vos colocations.'
                : 'Créez votre profil pour chercher un logement ou trouver des colocataires.'}
            </Text>
          </View>

          {/* Mode Tabs Switcher */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabButton, mode === 'LOGIN' && styles.tabButtonActive]}
              onPress={() => {
                setMode('LOGIN');
                setError(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'LOGIN' && styles.tabTextActive]}>
                Connexion
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, mode === 'REGISTER' && styles.tabButtonActive]}
              onPress={() => {
                setMode('REGISTER');
                setError(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'REGISTER' && styles.tabTextActive]}>
                Créer un compte
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBox}>
              <AlertCircle size={15} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form Content */}
          {mode === 'LOGIN' ? (
            <View style={styles.formCard}>
              {/* Google OAuth Button */}
              <GoogleAuthButtonMobile
                text="signin"
                campus={selectedCampus}
                role={role}
                onSuccess={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(tabs)');
                  }
                }}
                onError={(err) => setError(err)}
              />

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou par email</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Adresse email YouCode</Text>
                <View style={styles.inputContainer}>
                  <Mail size={16} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="votre.nom@youcode.ma"
                    placeholderTextColor={COLORS.textLight}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mot de passe</Text>
                <View style={styles.inputContainer}>
                  <Lock size={16} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={COLORS.textMuted} />
                    ) : (
                      <Eye size={16} color={COLORS.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleLoginSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Se connecter</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formCard}>
              {/* Google OAuth Button */}
              <GoogleAuthButtonMobile
                text="signup"
                campus={selectedCampus}
                role={role}
                onSuccess={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(tabs)');
                  }
                }}
                onError={(err) => setError(err)}
              />

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou par email</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Names */}
              <View style={styles.namesRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Prénom</Text>
                  <View style={styles.inputContainer}>
                    <User size={15} color={COLORS.textMuted} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Karim"
                      placeholderTextColor={COLORS.textLight}
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Nom</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.textInput, { marginLeft: 0 }]}
                      placeholder="Bennani"
                      placeholderTextColor={COLORS.textLight}
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Adresse email</Text>
                <View style={styles.inputContainer}>
                  <Mail size={16} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="prenom.nom@youcode.ma"
                    placeholderTextColor={COLORS.textLight}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Campus Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Campus YouCode</Text>
                <View style={styles.campusGrid}>
                  {(['YOUSSOUFIA', 'SAFI', 'NADOR'] as Campus[]).map((c) => {
                    const isSelected = selectedCampus === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        style={[styles.campusChip, isSelected && styles.campusChipActive]}
                        onPress={() => setSelectedCampus(c)}
                      >
                        <Text
                          style={[
                            styles.campusChipText,
                            isSelected && styles.campusChipTextActive,
                          ]}
                        >
                          {CAMPUS_DETAILS[c]?.city}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Role Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Votre profil</Text>
                <View style={styles.rolesRow}>
                  <TouchableOpacity
                    style={[styles.roleChip, role === 'STUDENT' && styles.roleChipActive]}
                    onPress={() => setRole('STUDENT')}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        role === 'STUDENT' && styles.roleChipTextActive,
                      ]}
                    >
                      Étudiant YouCode
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleChip, role === 'LANDLORD' && styles.roleChipActive]}
                    onPress={() => setRole('LANDLORD')}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        role === 'LANDLORD' && styles.roleChipTextActive,
                      ]}
                    >
                      Propriétaire / Bailleur
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mot de passe</Text>
                <View style={styles.inputContainer}>
                  <Lock size={16} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Au moins 6 caractères"
                    placeholderTextColor={COLORS.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={COLORS.textMuted} />
                    ) : (
                      <Eye size={16} color={COLORS.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleRegisterSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Créer mon compte</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  navBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 20,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  brandAccent: {
    color: COLORS.primary,
  },
  brandHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primaryDark,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    flex: 1,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  namesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.text,
  },
  eyeBtn: {
    padding: 6,
  },
  campusGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  campusChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  campusChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  campusChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  campusChipTextActive: {
    color: COLORS.primaryDark,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  roleChipTextActive: {
    color: COLORS.primaryDark,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 11,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  demoLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    paddingVertical: 12,
    borderRadius: 8,
  },
  demoLoginBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
});
