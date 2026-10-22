'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { Input } from '../../../components/ui/Input.js';
import { fetchGraphQL } from '../../../lib/api-client.js';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      const mutation = `
        mutation ResetPassword($token: String!, $newPassword: String!) {
          resetPassword(token: $token, newPassword: $newPassword)
        }
      `;

      const result = await fetchGraphQL<{ resetPassword: boolean }>(mutation, {
        token,
        newPassword,
      });

      if (result.resetPassword) {
        setSuccess(true);
      } else {
        setError('Le jeton de réinitialisation est invalide ou a expiré.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur inattendue est survenue';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-6 sm:p-8 bg-white shadow-xs">
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
        Nouveau mot de passe
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Définissez un mot de passe sécurisé pour votre compte YouColiva.
      </p>

      {success ? (
        <div className="mt-6 border border-emerald-200 bg-emerald-50 text-emerald-900 rounded-md p-4 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Mot de passe réinitialisé avec succès</p>
            <p className="mt-1 text-emerald-800">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <div className="mt-4">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="border border-red-200 bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!tokenFromUrl && (
            <Input
              label="Code ou jeton de réinitialisation"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Collez le jeton reçu"
              required
            />
          )}

          <Input
            label="Nouveau mot de passe"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 8 caractères"
            required
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmez le mot de passe"
            required
          />

          <Button type="submit" isLoading={loading} className="w-full">
            Mettre à jour le mot de passe
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <Link
        href="/auth/login"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la connexion
      </Link>

      <Suspense fallback={<div className="p-8 text-center text-sm text-neutral-500">Chargement...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
