'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchGraphQL } from '../../../lib/api-client.js';
import type { Listing } from '../../../types/index.js';
import { formatMAD, formatDate, PROPERTY_TYPE_LABELS, CAMPUS_DETAILS } from '../../../lib/utils.js';
import { useAuth } from '../../../context/AuthContext.js';
import { Button } from '../../../components/ui/Button.js';
import {
  MapPin,
  Home,
  CheckCircle2,
  Users,
  MessageSquare,
  Shield,
  Flag,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContacting, setIsContacting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    async function loadListing() {
      try {
        const query = `
          query GetListingDetail($id: ID!) {
            listing(id: $id) {
              id
              title
              description
              campus
              neighborhood
              exactAddress
              pricePerMonth
              propertyType
              roomCount
              bathroomCount
              maxCapacity
              availablePlaces
              furnished
              amenities
              images
              availableFrom
              createdAt
              owner {
                id
                firstName
                lastName
                role
                phone
                agencyName
                isVerified
              }
              location {
                longitude
                latitude
              }
            }
          }
        `;

        const data = await fetchGraphQL<{ listing: Listing | null }>(query, {
          id: resolvedParams.id,
        });
        setListing(data.listing);
      } catch (err) {
        console.error('Error loading listing:', err);
      } finally {
        setLoading(false);
      }
    }

    loadListing();
  }, [resolvedParams.id]);

  const handleContactOwner = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!listing?.owner?.id) return;

    setIsContacting(true);
    try {
      const mutation = `
        mutation Contact($recipientId: ID!, $listingId: ID) {
          getOrCreateConversation(recipientId: $recipientId, listingId: $listingId) {
            id
          }
        }
      `;
      const data = await fetchGraphQL<{
        getOrCreateConversation: { id: string };
      }>(mutation, {
        recipientId: listing.owner.id,
        listingId: listing.id,
      });

      router.push(`/messages?conversationId=${data.getOrCreateConversation.id}`);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setIsContacting(false);
    }
  };

  const handleReport = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const reason = window.prompt("Motif du signalement (ex: annonce non conforme, coordonnées erronées) :");
    if (!reason?.trim()) return;

    try {
      const mutation = `
        mutation ReportListing($input: CreateReportInput!) {
          createReport(input: $input) {
            id
          }
        }
      `;
      await fetchGraphQL(mutation, {
        input: {
          targetType: 'LISTING',
          targetId: resolvedParams.id,
          reason,
        },
      });
      setReportSuccess(true);
    } catch {
      alert('Erreur lors de la transmission du signalement.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="h-72 bg-gray-200 rounded-lg" />
        <div className="h-8 w-3/4 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Home className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h1 className="text-base font-bold text-gray-900">Logement introuvable</h1>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Cette annonce n'existe pas ou n'est plus disponible.
        </p>
        <Link href="/listings" className="text-xs font-medium text-brand-600 hover:underline">
          Retour aux logements
        </Link>
      </div>
    );
  }

  const campusInfo = CAMPUS_DETAILS[listing.campus];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Back Link */}
      <Link
        href="/listings"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Retour aux résultats</span>
      </Link>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Photos & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery / Image */}
          <div className="h-80 w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            {listing.images && listing.images.length > 0 ? (
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                <Home className="w-12 h-12 stroke-1 mb-2" />
                <span className="text-xs">Photo non fournie</span>
              </div>
            )}
          </div>

          {/* Title & Location Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded">
                {campusInfo?.label || listing.campus}
              </span>
              <span className="text-xs text-gray-500">
                {PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{listing.title}</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-2">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              <span>
                {listing.neighborhood}, {campusInfo?.city}
              </span>
            </p>
          </div>

          {/* Key Metrics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y border-gray-100">
            <div>
              <div className="text-[11px] text-gray-400">Places dispo</div>
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span>
                  {listing.availablePlaces} / {listing.maxCapacity}
                </span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400">Chambres</div>
              <div className="text-sm font-semibold text-gray-900 mt-0.5">{listing.roomCount}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400">Salles de bain</div>
              <div className="text-sm font-semibold text-gray-900 mt-0.5">
                {listing.bathroomCount}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400">Mobilier</div>
              <div className="text-sm font-semibold text-gray-900 mt-0.5">
                {listing.furnished ? 'Meublé' : 'Non meublé'}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-2">Description du logement</h2>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-2.5">Équipements & Commodités</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {listing.amenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 border border-gray-100 px-3 py-2 rounded-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Privacy Card */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
            <h2 className="text-xs font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-600" />
              <span>Emplacement & Confidentialité</span>
            </h2>
            {listing.exactAddress ? (
              <div className="mt-2 text-xs text-gray-900 font-medium bg-white p-2.5 rounded border border-gray-200">
                <span className="text-gray-500 font-normal">Adresse exacte réservée : </span>
                {listing.exactAddress}
              </div>
            ) : (
              <p className="text-xs text-gray-500 leading-relaxed mt-1">
                L'adresse exacte est tenue confidentielle pour préserver la vie privée des résidents.
                Elle est communiquée par le bailleur une fois la prise de contact validée.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Pricing & Owner Contact Action */}
        <div className="lg:col-span-1 space-y-5">
          <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm sticky top-24 space-y-5">
            <div>
              <div className="text-2xl font-extrabold text-gray-900">
                {formatMAD(listing.pricePerMonth)}
                <span className="text-xs font-normal text-gray-500 ml-1">/ mois</span>
              </div>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Disponible dès le {formatDate(listing.availableFrom)}</span>
              </div>
            </div>

            <Button
              onClick={handleContactOwner}
              isLoading={isContacting}
              className="w-full flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contacter le bailleur</span>
            </Button>

            {/* Owner card preview */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Annonceur
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-900">
                    {listing.owner.firstName} {listing.owner.lastName}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {listing.owner.role === 'AGENT'
                      ? `Agent immobilier (${listing.owner.agencyName || 'Indépendant'})`
                      : 'Bailleur particulier'}
                  </div>
                </div>
                {listing.owner.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    Vérifié
                  </span>
                )}
              </div>
            </div>

            {/* Report Button */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              {reportSuccess ? (
                <span className="text-[11px] text-green-600">Signalement transmis</span>
              ) : (
                <button
                  type="button"
                  onClick={handleReport}
                  className="text-[11px] text-gray-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <Flag className="w-3 h-3" />
                  <span>Signaler cette annonce</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
