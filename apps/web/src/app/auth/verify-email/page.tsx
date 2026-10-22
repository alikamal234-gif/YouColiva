'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext.js';
import { Button } from '../../../components/ui/Button.js';
import { Mail, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const { verifyEmailCode, resendVerificationCode } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Veuillez renseigner votre adresse email.');
      return;
    }

    if (!code || code.trim().length !== 6) {
      setError('Veuillez saisir le code à 6 chiffres.');
      return;
    }

    setIsVerifying(true);
    try {
      await verifyEmailCode(email.trim(), code.trim());
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Code de vérification invalide ou expiré';
      setError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Veuillez renseigner votre adresse email avant de renvoyer le code.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setIsResending(true);

    try {
      const msg = await resendVerificationCode(email.trim());
      setSuccessMsg(msg || 'Un nouveau code de vérification a été envoyé à votre adresse email.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'envoi de l'email";
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 mb-2">
            <span>YouColiva</span>
            <span className="w-2 h-2 rounded-full bg-brand-600 mb-0.5" />
          </Link>
          <div className="flex justify-center my-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Mail className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">
            Vérifiez votre adresse email
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Saisissez le code à 6 chiffres envoyé à votre adresse email.
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Spam Warning Message */}
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-900">
              Vous n&apos;avez pas reçu le code ?
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Vérifiez vos dossiers <strong>Spam / Courriers indésirables</strong> ou l&apos;onglet Promotions. Le code reste valable pendant <strong>15 minutes</strong>.
            </p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          {!initialEmail && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <input
                type="email"
                required
                placeholder="votre.email@youcode.ma"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs h-10 rounded-md border border-gray-300 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 text-center">
              Code de vérification (6 chiffres)
            </label>
            <input
              type="text"
              maxLength={6}
              required
              autoFocus
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-2xl font-mono font-bold tracking-[8px] h-14 rounded-lg border border-gray-300 bg-gray-50/30 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <Button type="submit" isLoading={isVerifying} className="w-full h-11 text-sm font-semibold">
            Valider mon compte
          </Button>
        </form>

        <div className="pt-2 text-center text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
            <span>{isResending ? 'Envoi...' : 'Renvoyer un nouveau code'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8 text-xs text-gray-500">Chargement...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
