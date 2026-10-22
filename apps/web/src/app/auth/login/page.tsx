'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext.js';
import { Button } from '../../../components/ui/Button.js';
import { Input } from '../../../components/ui/Input.js';
import { GoogleAuthButton } from '../../../components/auth/GoogleAuthButton.js';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Identifiants incorrects';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
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
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Connexion à votre espace</h1>
          <p className="text-xs text-gray-500 mt-1">
            Accédez à vos annonces, vos messages et vos favoris.
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Google OAuth Button */}
        <div>
          <GoogleAuthButton
            text="signin"
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
          <Input
            label="Adresse email"
            type="email"
            placeholder="votre.nom@youcode.ma"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <div className="flex items-center justify-end text-xs">
            <Link
              href="/auth/forgot-password"
              className="text-brand-600 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full">
            Se connecter
          </Button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          <span>Pas encore de compte ? </span>
          <Link href="/auth/register" className="font-medium text-brand-600 hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
