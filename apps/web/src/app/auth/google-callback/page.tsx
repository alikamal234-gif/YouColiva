'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext.js';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
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
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: queryToken }, window.location.origin);
            window.close();
            return;
          }
          await loginWithGoogle(queryToken);
          router.push('/');
          return;
        }

        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: idToken }, window.location.origin);
          window.close();
          return;
        }

        await loginWithGoogle(idToken);
        router.push('/');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur lors de la connexion Google';
        setError(msg);
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: msg }, window.location.origin);
          setTimeout(() => window.close(), 2000);
        }
      }
    };

    handleAuth();
  }, [loginWithGoogle, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-sm w-full text-center space-y-4">
        {error ? (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
              ✕
            </div>
            <p className="text-sm font-semibold text-gray-900">Échec de connexion</p>
            <p className="text-xs text-red-600">{error}</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-gray-700">Connexion avec Google en cours...</p>
          </>
        )}
      </div>
    </div>
  );
}
