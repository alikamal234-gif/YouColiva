'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext.js';
import type { Campus, UserRole } from '../../types/index.js';

interface GoogleAuthButtonProps {
  campus?: Campus;
  role?: UserRole;
  text?: 'signin' | 'signup' | 'continue';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle';
              logo_alignment?: 'left' | 'center';
              width?: string | number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function GoogleAuthButton({
  campus = 'YOUSSOUFIA',
  role = 'STUDENT',
  text = 'continue',
  onSuccess,
  onError,
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [devEmail, setDevEmail] = useState('');
  const [devName, setDevName] = useState('');
  const googleBtnContainerRef = useRef<HTMLDivElement | null>(null);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '1084277717462-placeholder.apps.googleusercontent.com';

  useEffect(() => {
    // Dynamically load Google Identity Services script
    if (typeof window === 'undefined') return;

    const existingScript = document.getElementById('google-gsi-client');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogle();
      };
      document.body.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initGoogle();
    }

    function initGoogle() {
      if (!window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential: string }) => {
            if (response.credential) {
              setLoading(true);
              try {
                await loginWithGoogle(response.credential, campus, role);
                onSuccess?.();
                router.push('/');
              } catch (err: unknown) {
                const message =
                  err instanceof Error ? err.message : 'Erreur de connexion avec Google';
                onError?.(message);
              } finally {
                setLoading(false);
              }
            }
          },
        });

        // Optionally render Google's official button if container exists
        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            text: text === 'signup' ? 'signup_with' : text === 'signin' ? 'signin_with' : 'continue_with',
            shape: 'rectangular',
            width: 380,
          });
        }
      } catch {
        // Fallback to custom button
      }
    }
  }, [googleClientId, campus, role, text, loginWithGoogle, onSuccess, onError, router]);

  const handleCustomClick = () => {
    // If real Google client is loaded and configured with non-placeholder
    const isPlaceholder = googleClientId.includes('placeholder');
    if (window.google?.accounts?.id && !isPlaceholder) {
      window.google.accounts.id.prompt();
    } else {
      // In dev without a Google Cloud Project Client ID, open instant dev test modal
      setDevModalOpen(true);
    }
  };

  const handleDevGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devEmail) return;

    setLoading(true);
    try {
      // Create a mock base64 idToken payload that the backend or test environment can handle
      const nameParts = (devName || 'Apprenant YouCode').split(' ');
      const given_name = nameParts[0];
      const family_name = nameParts.slice(1).join(' ') || 'YouCode';

      // Build a demo JWT payload
      const mockPayload = {
        sub: `google_dev_${Date.now()}`,
        email: devEmail.toLowerCase().trim(),
        email_verified: true,
        name: devName || 'Apprenant YouCode',
        given_name,
        family_name,
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      };

      // Header.Payload.Signature format
      const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(mockPayload));
      const simulatedToken = `${header}.${payload}.simulated_signature`;

      await loginWithGoogle(simulatedToken, campus, role);
      setDevModalOpen(false);
      onSuccess?.();
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion avec Google';
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel =
    text === 'signup'
      ? "S'inscrire avec Google"
      : text === 'signin'
      ? 'Se connecter avec Google'
      : 'Continuer avec Google';

  return (
    <div className="w-full">
      {/* Fallback & Custom Styled Google Button */}
      <button
        type="button"
        onClick={handleCustomClick}
        disabled={loading}
        className="w-full h-10 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs flex items-center justify-center gap-3 transition-colors shadow-sm disabled:opacity-60"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{loading ? 'Connexion en cours...' : buttonLabel}</span>
      </button>

      {/* Hidden GIS container if rendered directly by Google */}
      <div ref={googleBtnContainerRef} className="hidden" />

      {/* Dev Mode Google Account Picker Modal */}
      {devModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <h3 className="font-bold text-sm text-gray-900">Connexion Google (Environnement Dev)</h3>
            </div>

            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Testez l&apos;authentification Google instantanément avec une adresse Gmail. Le compte sera automatiquement enregistré et marqué comme vérifié.
            </p>

            <form onSubmit={handleDevGoogleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Adresse Gmail</label>
                <input
                  type="email"
                  required
                  placeholder="votre.compte@gmail.com"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  className="w-full text-xs h-9 rounded-md border border-gray-300 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom complet (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Amine El Idrissi"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  className="w-full text-xs h-9 rounded-md border border-gray-300 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDevModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || !devEmail}
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Connexion...' : 'Continuer avec ce compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
