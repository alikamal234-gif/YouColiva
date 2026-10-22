'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext.js';
import { useCampus } from '../../../context/CampusContext.js';
import { fetchGraphQL } from '../../../lib/api-client.js';
import { Button } from '../../../components/ui/Button.js';
import { Input } from '../../../components/ui/Input.js';
import { CAMPUS_DETAILS } from '../../../lib/utils.js';
import type { Campus, PropertyType } from '../../../types/index.js';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function NewListingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { selectedCampus } = useCampus();

  const [campus, setCampus] = useState<Campus>(selectedCampus);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [exactAddress, setExactAddress] = useState('');
  const [pricePerMonth, setPricePerMonth] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('ROOM');
  const [roomCount, setRoomCount] = useState('1');
  const [bathroomCount, setBathroomCount] = useState('1');
  const [maxCapacity, setMaxCapacity] = useState('1');
  const [availablePlaces, setAvailablePlaces] = useState('1');
  const [furnished, setFurnished] = useState(true);
  const [amenitiesInput, setAmenitiesInput] = useState('WiFi, Machine à laver, Bureau');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return <div className="p-8 text-center text-xs text-gray-400">Vérification de la session...</div>;
  }

  if (!user || !['LANDLORD', 'AGENT', 'ADMIN'].includes(user.role)) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h1 className="text-base font-bold text-gray-900">Accès restreint aux bailleurs</h1>
        <p className="text-xs text-gray-500 mt-2 mb-6">
          Seuls les propriétaires et agents immobiliers peuvent publier des logements sur YouColiva.
          Si vous êtes étudiant cherchant une colocation, déposez une demande de colocataire.
        </p>
        <Link href="/roommates/new" className="text-xs font-medium text-brand-600 hover:underline">
          Créer une annonce colocataire
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const price = Number(pricePerMonth);
    if (!title.trim() || !description.trim() || !neighborhood.trim() || !exactAddress.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (isNaN(price) || price <= 0) {
      setError('Veuillez renseigner un prix valide en dirhams (MAD).');
      return;
    }

    const defaultCoords = CAMPUS_DETAILS[campus].coordinates;
    const amenities = amenitiesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      const mutation = `
        mutation CreateListing($input: CreateListingInput!) {
          createListing(input: $input) {
            id
          }
        }
      `;

      const data = await fetchGraphQL<{ createListing: { id: string } }>(mutation, {
        input: {
          title,
          description,
          campus,
          neighborhood,
          exactAddress,
          pricePerMonth: price,
          propertyType,
          roomCount: Number(roomCount) || 1,
          bathroomCount: Number(bathroomCount) || 1,
          maxCapacity: Number(maxCapacity) || 1,
          availablePlaces: Number(availablePlaces) || 1,
          furnished,
          amenities,
          images: imageUrl.trim() ? [imageUrl.trim()] : [],
          longitude: defaultCoords[0],
          latitude: defaultCoords[1],
        },
      });

      router.push(`/listings/${data.createListing.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'enregistrement de l'annonce";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
      <Link
        href="/listings"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Retour aux logements</span>
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Publier un nouveau logement
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Les annonces sont soumises à modération avant publication générale.
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
            label="Titre de l'annonce"
            placeholder="Ex : Chambre meublée lumineuse à 5 min du campus"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description complète
            </label>
            <textarea
              rows={4}
              placeholder="Précisez les charges incluses, l'environnement, le règlement de la colocation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Quartier / Secteur public"
              placeholder="Ex : Plateau, Al Qods"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              required
            />
            <Input
              label="Loyer mensuel (MAD)"
              type="number"
              placeholder="1200"
              value={pricePerMonth}
              onChange={(e) => setPricePerMonth(e.target.value)}
              required
            />
          </div>

          <Input
            label="Adresse exacte (confidentielle, réservée aux contacts validés)"
            placeholder="Ex : Rue 12, Immeuble A, Appartement 3"
            value={exactAddress}
            onChange={(e) => setExactAddress(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type de bien</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full text-xs h-10 rounded-md border border-gray-300 bg-white px-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="ROOM">Chambre</option>
                <option value="STUDIO">Studio</option>
                <option value="APARTMENT">Appartement</option>
                <option value="HOUSE">Maison</option>
              </select>
            </div>
            <Input
              label="Chambres"
              type="number"
              min="1"
              value={roomCount}
              onChange={(e) => setRoomCount(e.target.value)}
            />
            <Input
              label="Salles de bain"
              type="number"
              min="1"
              value={bathroomCount}
              onChange={(e) => setBathroomCount(e.target.value)}
            />
            <Input
              label="Capacité max"
              type="number"
              min="1"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
            />
            <Input
              label="Places dispo"
              type="number"
              min="0"
              value={availablePlaces}
              onChange={(e) => setAvailablePlaces(e.target.value)}
            />
          </div>

          <Input
            label="Équipements (séparés par des virgules)"
            placeholder="WiFi, Machine à laver, Bureau, Cuisine équipée"
            value={amenitiesInput}
            onChange={(e) => setAmenitiesInput(e.target.value)}
          />

          <Input
            label="Lien photo d'illustration (optionnel)"
            placeholder="https://images.unsplash.com/photo-..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="furnishedCheck"
              checked={furnished}
              onChange={(e) => setFurnished(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="furnishedCheck" className="text-xs text-gray-700 cursor-pointer">
              Le logement est entièrement meublé
            </label>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link
              href="/listings"
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-md"
            >
              Annuler
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              Enregistrer et soumettre
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
