'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
          prompt: (momentListener?: (moment: any) => void) => void;
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
  const [isGsiRendered, setIsGsiRendered] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement | null>(null);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '921693768189-dl0m2ahp8oi1uuam0r22qtdmllcciobe.apps.googleusercontent.com';

  const handleCredentialResponse = useCallback(
    async (credential: string) => {
      setLoading(true);
      try {
        await loginWithGoogle(credential, campus, role);
        onSuccess?.();
        router.push('/');
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Erreur de connexion avec Google';
        onError?.(message);
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, campus, role, onSuccess, onError, router]
  );

  // Fallback: Open genuine Google OAuth 2.0 popup window
  const openGoogleOAuthPopup = () => {
    if (loading) return;
    setLoading(true);

    const redirectUri = `${window.location.origin}/auth/google-callback`;
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      googleClientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token id_token&scope=openid%20email%20profile&prompt=select_account&nonce=${Date.now()}`;

    const width = 500;
    const height = 620;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    const popup = window.open(
      oauthUrl,
      'google_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
    );

    if (!popup) {
      // If popup was blocked by browser, redirect current window
      window.location.href = oauthUrl;
      return;
    }

    const messageHandler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.token) {
        window.removeEventListener('message', messageHandler);
        await handleCredentialResponse(event.data.token);
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        window.removeEventListener('message', messageHandler);
        onError?.(event.data.error || 'Authentification Google annulée ou échouée');
        setLoading(false);
      }
    };

    window.addEventListener('message', messageHandler);

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        window.removeEventListener('message', messageHandler);
        setLoading(false);
      }
    }, 1000);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const setupGoogleGsi = () => {
      if (!window.google?.accounts?.id || !googleBtnContainerRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: { credential: string }) => {
            if (response.credential) {
              handleCredentialResponse(response.credential);
            }
          },
        });

        googleBtnContainerRef.current.innerHTML = '';
        const parentWidth = googleBtnContainerRef.current.offsetWidth || 360;
        const targetWidth = Math.min(Math.max(parentWidth, 240), 400);

        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: 'outline',
          size: 'large',
          text: text === 'signup' ? 'signup_with' : text === 'signin' ? 'signin_with' : 'continue_with',
          shape: 'rectangular',
          width: targetWidth,
          logo_alignment: 'left',
        });

        if (isMounted) {
          setIsGsiRendered(true);
        }
      } catch (err) {
        console.warn('Google GSI render error, using popup fallback:', err);
      }
    };

    const existingScript = document.getElementById('google-gsi-client');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setupGoogleGsi();
      };
      document.body.appendChild(script);
    } else {
      setupGoogleGsi();
    }

    return () => {
      isMounted = false;
    };
  }, [googleClientId, text, handleCredentialResponse]);

  const buttonLabel =
    text === 'signup'
      ? "S'inscrire avec Google"
      : text === 'signin'
      ? 'Se connecter avec Google'
      : 'Continuer avec Google';

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* Official Google GIS Button Container */}
      <div
        ref={googleBtnContainerRef}
        className={`w-full flex justify-center items-center ${isGsiRendered ? 'block' : 'hidden'}`}
      />

      {/* Fallback button when GSI iframe is loading or if GIS button is not yet rendered */}
      {!isGsiRendered && (
        <button
          type="button"
          onClick={openGoogleOAuthPopup}
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
      )}
    </div>
  );
}
