'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext.js';
import { useCampus } from '../../../context/CampusContext.js';
import { fetchGraphQL } from '../../../lib/api-client.js';
import { Button } from '../../../components/ui/Button.js';
import { Input } from '../../../components/ui/Input.js';
import { CAMPUS_DETAILS } from '../../../lib/utils.js';
import type { Campus, RoommateGenderPreference } from '../../../types/index.js';
import { ArrowLeft } from 'lucide-react';

export default function NewRoommatePostPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { selectedCampus } = useCampus();

  const [campus, setCampus] = useState<Campus>(selectedCampus);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [targetMoveInDate, setTargetMoveInDate] = useState('');
  const [preferredGender, setPreferredGender] = useState<RoommateGenderPreference>('ANY');
  const [lifestyleInput, setLifestyleInput] = useState('Calme, Non-fumeur, Travailleur');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return <div className="p-8 text-center text-xs text-gray-400">Vérification de la session...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-base font-bold text-gray-900">Connexion requise</h1>
        <p className="text-xs text-gray-500 mt-2 mb-6">
          Vous devez être connecté avec votre compte YouCode pour publier une recherche de colocataire.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-white bg-brand-600 rounded-md"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const budget = Number(budgetMax);
    if (!title.trim() || !description.trim() || !targetMoveInDate) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (isNaN(budget) || budget <= 0) {
      setError('Veuillez renseigner un budget maximum valide en MAD.');
      return;
    }

    const habits = lifestyleInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      const mutation = `
        mutation CreatePost($input: CreateRoommatePostInput!) {
          createRoommatePost(input: $input) {
            id
          }
        }
      `;

      await fetchGraphQL(mutation, {
        input: {
          title,
          description,
          campus,
          budgetMax: budget,
          targetMoveInDate: new Date(targetMoveInDate).toISOString(),
          preferredRoommateGender: preferredGender,
          lifestyleHabits: habits,
        },
      });

      router.push(`/roommates?campus=${campus}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de la demande';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
      <Link
        href="/roommates"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Retour aux colocataires</span>
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Publier une recherche de colocataire
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Indiquez vos critères et vos habitudes pour trouver le profil compatible avec vos études.
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Campus YouCode</label>
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

          <Input
            label="Titre de votre recherche"
            placeholder="Ex : Apprenant promo 2026 cherche colocataire calme et studieux"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description de vous et de votre recherche
            </label>
            <textarea
              rows={4}
              placeholder="Présentez-vous (filière, rythme de travail, horaires, attentes vis-à-vis du logement)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Budget max par mois (MAD)"
              type="number"
              placeholder="800"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              required
            />
            <Input
              label="Date d'emménagement souhaitée"
              type="date"
              value={targetMoveInDate}
              onChange={(e) => setTargetMoveInDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Préférence de genre
              </label>
              <select
                value={preferredGender}
                onChange={(e) => setPreferredGender(e.target.value as RoommateGenderPreference)}
                className="w-full text-xs h-10 rounded-md border border-gray-300 bg-white px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="ANY">Indifférent / Mixte</option>
                <option value="MALE">Homme uniquement</option>
                <option value="FEMALE">Femme uniquement</option>
              </select>
            </div>
            <Input
              label="Habitudes de vie (séparées par virgules)"
              placeholder="Calme, Non-fumeur, Propre, Travail tardif"
              value={lifestyleInput}
              onChange={(e) => setLifestyleInput(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link
              href="/roommates"
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-md"
            >
              Annuler
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              Publier ma demande
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
