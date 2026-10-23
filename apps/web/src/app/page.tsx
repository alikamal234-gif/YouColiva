'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCampus } from '../context/CampusContext.js';
import { CAMPUS_DETAILS } from '../lib/utils.js';
import { fetchGraphQL } from '../lib/api-client.js';
import type { Listing, RoommatePost } from '../types/index.js';
import { ListingCard } from '../components/listings/ListingCard.js';
import { RoommateCard } from '../components/roommates/RoommateCard.js';
import { Search, Users, ArrowRight, ShieldCheck, MapPin, Home } from 'lucide-react';

export default function HomePage() {
  const { selectedCampus } = useCampus();
  const [listings, setListings] = useState<Listing[]>([]);
  const [roommates, setRoommates] = useState<RoommatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const campusInfo = CAMPUS_DETAILS[selectedCampus];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const query = `
          query HomeFeed($campus: Campus) {
            listings(filter: { campus: $campus, limit: 6 }) {
              items {
                id
                title
                description
                campus
                neighborhood
                pricePerMonth
                propertyType
                furnished
                images
                location { longitude latitude }
              }
            }
            roommatePosts(filter: { campus: $campus, limit: 3 }) {
              items {
                id
                title
                description
                campus
                budgetMax
                targetMoveInDate
                preferredRoommateGender
                lifestyleHabits
              }
            }
          }
        `;

        const data = await fetchGraphQL<{
          listings: { items: Listing[] };
          roommatePosts: { items: RoommatePost[] };
        }>(query, { campus: selectedCampus });

        setListings(data.listings.items);
        setRoommates(data.roommatePosts.items);
      } catch (err) {
        console.error('Erreur chargement page accueil:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedCampus]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200/60">
            <MapPin className="w-3.5 h-3.5 text-brand-600" />
            <span>Campus actuel : {campusInfo.label}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Le logement étudiant pensé pour{' '}
            <span className="text-brand-600">YouCode</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-600 leading-relaxed">
            Trouvez une chambre, un studio ou une colocation vérifiée à proximité immédiate de votre
            campus à {campusInfo.city}.
          </p>

          {/* Quick Search Bar */}
          <div className="max-w-xl mx-auto mt-8 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Quartier, type de bien, budget..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
            <Link
              href={`/recherche?campus=${selectedCampus}${
                searchQuery ? `&neighborhood=${encodeURIComponent(searchQuery)}` : ''
              }`}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors shadow-sm shrink-0"
            >
              Rechercher
            </Link>
          </div>

          {/* Quick Choice Buttons for the two user profiles */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href={`/recherche?campus=${selectedCampus}&mode=housing`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-brand-600" />
              <span>Je cherche un logement à louer</span>
            </Link>

            <Link
              href={`/recherche?campus=${selectedCampus}&mode=roommates`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-brand-600" />
              <span>Je cherche des colocataires (m&apos;ajouter)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Housing Listings */}
      <section className="py-12 bg-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">
              Logements disponibles à {campusInfo.city}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Annonces vérifiées et modérées par la communauté.
            </p>
          </div>
          <Link
            href={`/listings?campus=${selectedCampus}`}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Voir tout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
            <p className="text-xs text-gray-500 mb-3">
              Aucun logement actuellement listé à {campusInfo.city}.
            </p>
            <Link
              href="/listings/new"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
            >
              <span>Êtes-vous bailleur ? Déposez la première annonce</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </section>

      {/* Roommates Discovery */}
      <section className="py-12 bg-gray-50/60 border-t border-gray-200 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-600" />
                <span>Recherches de colocataires ({campusInfo.city})</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Entrez en contact direct avec d'autres apprenants YouCode.
              </p>
            </div>
            <Link
              href={`/roommates?campus=${selectedCampus}`}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Voir tout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-gray-200 rounded-lg" />
              ))}
            </div>
          ) : roommates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {roommates.map((post) => (
                <RoommateCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 mb-3">
                Aucune recherche de colocation active pour le moment.
              </p>
              <Link
                href="/roommates/new"
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Créer une demande de colocation
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Safety & Guidelines Trust Section */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
          <ShieldCheck className="w-7 h-7 text-brand-600 mx-auto" />
          <h2 className="text-base font-bold text-gray-900">
            Sécurité et protection des coordonnées
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed max-w-2xl mx-auto">
            L'adresse exacte d'un logement n'est jamais divulguée publiquement par défaut. Seule une
            zone approximative est affichée. Les coordonnées complètes sont transmises uniquement
            lors d'un échange autorisé.
          </p>
        </div>
      </section>
    </div>
  );
}
