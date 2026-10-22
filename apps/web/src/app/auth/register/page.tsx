'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext.js';
import { Button } from '../../../components/ui/Button.js';
import { Input } from '../../../components/ui/Input.js';
import { GoogleAuthButton } from '../../../components/auth/GoogleAuthButton.js';
import type { Campus, UserRole } from '../../../types/index.js';
import { CAMPUS_DETAILS } from '../../../lib/utils.js';
import { Mail, CheckCircle, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, verifyEmailCode, resendVerificationCode } = useAuth();

  // Registration form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [campus, setCampus] = useState<Campus>('YOUSSOUFIA');
  const [phone, setPhone] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step state: 'form' | 'verify'
  const [step, setStep] = useState<'form' | 'verify'>('form');

  // Verification code state
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        role,
        campus,
        phone: phone || undefined,
        agencyName: role === 'AGENT' ? agencyName : undefined,
      });

      // Switch to email verification step
      setStep('verify');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code || code.trim().length !== 6) {
      setError('Veuillez entrer le code à 6 chiffres envoyé à votre adresse email.');
      return;
    }

    setIsVerifying(true);
    try {
      await verifyEmailCode(email, code.trim());
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Code de vérification invalide ou expiré';
      setError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setResendSuccess(null);
    setIsResending(true);

    try {
      const msg = await resendVerificationCode(email);
      setResendSuccess(msg || 'Un nouveau code de vérification a été envoyé à votre adresse email.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Impossible de renvoyer l'email pour le moment";
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-lg w-full space-y-6 bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-3 transition-opacity hover:opacity-90">
            <Image
              src="/logo.png"
              alt="YouColiva"
              width={160}
              height={48}
              className="h-10 w-auto object-contain mx-auto"
              priority
            />
          </Link>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">
            {step === 'form' ? 'Créer votre compte' : 'Vérification de votre adresse email'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {step === 'form'
              ? 'Rejoignez la communauté YouColiva sur Youssoufia, Safi ou Nador.'
              : `Un code de vérification à 6 chiffres a été envoyé à ${email}.`}
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {resendSuccess && (
          <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resendSuccess}</span>
          </div>
        )}

        {/* STEP 1: Registration Form */}
        {step === 'form' ? (
          <div className="space-y-5">
            {/* Google OAuth Button */}
            <div>
              <GoogleAuthButton
                text="signup"
                campus={campus}
                role={role}
                onError={(msg) => setError(msg)}
              />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold absolute">
                ou par email
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  placeholder="Amine"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <Input
                  label="Nom"
                  placeholder="El Idrissi"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Adresse email"
                type="email"
                placeholder="votre.email@youcode.ma"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Mot de passe (8 caractères minimum)"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Votre rôle</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full text-xs h-10 rounded-md border border-gray-300 bg-white px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    <option value="STUDENT">Apprenant YouCode (Actuel ou Futur)</option>
                    <option value="LANDLORD">Propriétaire bailleur</option>
                    <option value="AGENT">Agent immobilier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Campus principal</label>
                  <select
                    value={campus}
                    onChange={(e) => setCampus(e.target.value as Campus)}
                    className="w-full text-xs h-10 rounded-md border border-gray-300 bg-white px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    <option value="YOUSSOUFIA">{CAMPUS_DETAILS.YOUSSOUFIA.label}</option>
                    <option value="SAFI">{CAMPUS_DETAILS.SAFI.label}</option>
                    <option value="NADOR">{CAMPUS_DETAILS.NADOR.label}</option>
                  </select>
                </div>
              </div>

              <Input
                label="Numéro de téléphone (optionnel)"
                placeholder="+212 6 XX XX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              {role === 'AGENT' && (
                <Input
                  label="Nom de l'agence immobilière"
                  placeholder="Agence Atlas Immo"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  required
                />
              )}

              <p className="text-[11px] text-gray-500 leading-normal">
                En créant un compte, un code de vérification vous sera envoyé par email pour activer votre compte.
              </p>

              <Button type="submit" isLoading={isLoading} className="w-full">
                Créer mon compte
              </Button>
            </form>

            <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
              <span>Déjà inscrit ? </span>
              <Link href="/auth/login" className="font-medium text-brand-600 hover:underline">
                Se connecter
              </Link>
            </div>
          </div>
        ) : (
          /* STEP 2: Email Verification Code Entry */
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Mail className="w-7 h-7" />
              </div>
            </div>

            {/* Crucial Instruction Box about Checking Spam */}
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-900">
                  Vous n&apos;avez pas encore reçu votre code ?
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Vérifiez votre boîte de réception ainsi que votre dossier de <strong>Courriers indésirables (Spams / Pourriel)</strong> ou l&apos;onglet Promotions. Le code reste valable pendant <strong>15 minutes</strong>.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 text-center">
                  Entrez le code de vérification à 6 chiffres
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

            <div className="pt-2 flex flex-col items-center gap-3 text-xs">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>{isResending ? 'Envoi en cours...' : 'Renvoyer un nouveau code'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setResendSuccess(null);
                  setStep('form');
                }}
                className="text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Modifier l&apos;adresse email</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
