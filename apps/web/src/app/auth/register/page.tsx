'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext.js';
import { Button } from '../../../components/ui/Button.js';
import { Input } from '../../../components/ui/Input.js';
import type { Campus, UserRole } from '../../../types/index.js';
import { CAMPUS_DETAILS } from '../../../lib/utils.js';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

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
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-lg w-full space-y-6 bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 mb-2">
            <span>YouColiva</span>
            <span className="w-2 h-2 rounded-full bg-brand-600 mb-0.5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Créer votre compte</h1>
          <p className="text-xs text-gray-500 mt-1">
            Rejoignez la communauté YouColiva sur Youssoufia, Safi ou Nador.
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

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
            En créant un compte, vous acceptez la charte communautaire YouColiva et certifiez
            l'exactitude des informations fournies.
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
    </div>
  );
}
