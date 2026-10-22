'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Building2,
  Heart,
  MessageSquare,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useCampus } from '../../context/CampusContext.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { fetchGraphQL } from '../../lib/api-client.js';
import type { Campus, User } from '../../types/index.js';

export default function ProfilePage() {
  const { user, token, loading: authLoading, refreshUser } = useAuth();
  const { setCampus } = useCampus();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedCampus, setSelectedCampus] = useState<Campus>('YOUSSOUFIA');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [agencyFeeDetails, setAgencyFeeDetails] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/profile');
    } else if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setSelectedCampus(user.campus || 'YOUSSOUFIA');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setAgencyName(user.agencyName || '');
      setAgencyFeeDetails(user.agencyFeeDetails || '');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <div className="text-center py-16 text-neutral-500">Chargement de votre profil...</div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const mutation = `
        mutation UpdateUserProfile($input: UpdateProfileInput!) {
          updateProfile(input: $input) {
            id
            email
            firstName
            lastName
            role
            campus
            phone
            bio
            isEmailVerified
            isVerified
            agencyName
            agencyFeeDetails
            createdAt
          }
        }
      `;

      await fetchGraphQL<{ updateProfile: User }>(
        mutation,
        {
          input: {
            firstName,
            lastName,
            campus: selectedCampus,
            phone: phone || null,
            bio: bio || null,
            agencyName: (user.role === 'AGENT' || user.role === 'LANDLORD') ? agencyName || null : null,
            agencyFeeDetails: (user.role === 'AGENT') ? agencyFeeDetails || null : null,
          },
        },
        token
      );

      setCampus(selectedCampus);
      await refreshUser();
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de mettre à jour le profil';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    STUDENT: 'Étudiant / Apprenant',
    LANDLORD: 'Propriétaire',
    AGENT: 'Agent immobilier',
    ADMIN: 'Administrateur',
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-blue-600" />
            Mon compte YouColiva
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Gérez vos informations personnelles et vos préférences de campus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/favorites"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
          >
            <Heart className="w-3.5 h-3.5 text-neutral-500" />
            Mes favoris
          </Link>
          <Link
            href="/messages"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
            Messagerie
          </Link>
          {(user.role === 'LANDLORD' || user.role === 'AGENT') && (
            <Link
              href="/listings/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              Déposer une annonce
            </Link>
          )}
          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Espace modération
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="border border-neutral-200 rounded-lg p-5 bg-white shadow-xs">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-4">
              Statut du compte
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-neutral-500 block">Rôle</span>
                <span className="font-semibold text-neutral-900 inline-block mt-0.5 px-2 py-0.5 bg-neutral-100 rounded text-xs">
                  {roleLabels[user.role] || user.role}
                </span>
              </div>

              <div>
                <span className="text-xs text-neutral-500 block">Email officiel</span>
                <span className="font-medium text-neutral-900">{user.email}</span>
              </div>

              <div>
                <span className="text-xs text-neutral-500 block">Vérification de l&apos;email</span>
                {user.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Email vérifié
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-xs mt-1">
                    <AlertCircle className="w-4 h-4" />
                    En attente de confirmation
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs text-neutral-500 block">Vérification YouCode</span>
                {user.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-blue-700 font-medium text-xs mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Profil affilié vérifié
                  </span>
                ) : (
                  <span className="text-xs text-neutral-500 italic block mt-1">
                    Non vérifié par l&apos;administration
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-neutral-100 text-xs text-neutral-500">
                Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="border border-neutral-200 rounded-lg p-6 bg-white shadow-xs space-y-6">
            <h2 className="text-base font-semibold text-neutral-900">
              Modifier mes informations
            </h2>

            {error && (
              <div className="border border-red-200 bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="border border-emerald-200 bg-emerald-50 text-emerald-800 p-3 rounded-md text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Profil mis à jour avec succès. Vos préférences sont enregistrées.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-1">
                Campus YouCode principal
              </label>
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value as Campus)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white text-neutral-900"
              >
                <option value="YOUSSOUFIA">Youssoufia</option>
                <option value="SAFI">Safi</option>
                <option value="NADOR">Nador</option>
              </select>
              <p className="mt-1 text-xs text-neutral-500">
                Ce campus sera utilisé par défaut lors de vos recherches de logements et colocataires.
              </p>
            </div>

            <Input
              label="Numéro de téléphone (optionnel)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 06 12 34 56 78"
            />

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-1">
                Bio / Présentation
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Présentez-vous brièvement à la communauté YouCode..."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white text-neutral-900"
              />
            </div>

            {(user.role === 'AGENT' || user.role === 'LANDLORD') && (
              <div className="pt-4 border-t border-neutral-200 space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Informations professionnelles
                </h3>
                <Input
                  label="Nom de l'agence ou raison sociale"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Ex: Agence Immo Campus"
                />

                {user.role === 'AGENT' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-1">
                      Frais d&apos;agence et conditions de commission
                    </label>
                    <textarea
                      value={agencyFeeDetails}
                      onChange={(e) => setAgencyFeeDetails(e.target.value)}
                      rows={2}
                      placeholder="Détaillez vos honoraires en toute transparence (ex: 1 mois de loyer)"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white text-neutral-900"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button type="submit" isLoading={saving} className="inline-flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
