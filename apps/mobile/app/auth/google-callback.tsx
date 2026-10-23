import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/constants/theme';

export default function GoogleCallbackScreen() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const handleCallback = async () => {
      try {
        // Parse token from hash (e.g. #id_token=... or #access_token=...)
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const idToken = params.get('id_token') || params.get('access_token');

        if (!idToken) {
          const searchParams = new URLSearchParams(window.location.search);
          const queryToken = searchParams.get('id_token') || searchParams.get('token');
          if (!queryToken) {
            throw new Error("Aucun jeton d'authentification retourné par Google.");
          }

          if (window.opener) {
            window.opener.postMessage(
              { type: 'GOOGLE_AUTH_SUCCESS', token: queryToken },
              window.location.origin
            );
            window.close();
            return;
          }

          await loginWithGoogle(queryToken);
          router.replace('/(tabs)');
          return;
        }

        if (window.opener) {
          window.opener.postMessage(
            { type: 'GOOGLE_AUTH_SUCCESS', token: idToken },
            window.location.origin
          );
          window.close();
          return;
        }

        await loginWithGoogle(idToken);
        router.replace('/(tabs)');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur lors de la connexion Google';
        setError(msg);
        if (window.opener) {
          window.opener.postMessage(
            { type: 'GOOGLE_AUTH_ERROR', error: msg },
            window.location.origin
          );
          setTimeout(() => window.close(), 2000);
        }
      }
    };

    handleCallback();
  }, [loginWithGoogle, router]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {error ? (
          <>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>✕</Text>
            </View>
            <Text style={styles.errorTitle}>Échec de connexion</Text>
            <Text style={styles.errorMsg}>{error}</Text>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
            <Text style={styles.loadingText}>Connexion avec Google en cours...</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  spinner: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  errorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorIconText: {
    color: '#DC2626',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  errorMsg: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
  },
});
