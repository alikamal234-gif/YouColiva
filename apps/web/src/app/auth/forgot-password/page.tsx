'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { Input } from '../../../components/ui/Input.js';
import { fetchGraphQL } from '../../../lib/api-client.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const mutation = `
        mutation RequestPasswordReset($email: String!) {
          requestPasswordReset(email: $email) {
            success
            message
          }
        }
      `;

      await fetchGraphQL<{ requestPasswordReset: { success: boolean; message: string } }>(
        mutation,
        { email }
      );

      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur inattendue est survenue';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <Link
        href="/auth/login"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la connexion
      </Link>

      <div className="border border-neutral-200 rounded-lg p-6 sm:p-8 bg-white shadow-xs">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Mot de passe oublié</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Saisissez votre adresse email YouCode pour recevoir un lien sécurisé de réinitialisation.
        </p>

        {submitted ? (
          <div className="mt-6 border border-emerald-200 bg-emerald-50 text-emerald-900 rounded-md p-4 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Demande enregistrée</p>
              <p className="mt-1 text-emerald-800">
                Si un compte correspond à cette adresse ({email}), vous recevrez un email contenant les instructions pour définir un nouveau mot de passe.
              </p>
              <div className="mt-4">
                <Link
                  href="/auth/login"
                  className="text-sm font-semibold text-emerald-900 underline hover:text-emerald-950"
                >
                  Revenir à la page de connexion
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

            <Input
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.nom@youcode.ma"
              required
              autoFocus
            />

            <Button type="submit" isLoading={loading} className="w-full">
              Envoyer les instructions
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
