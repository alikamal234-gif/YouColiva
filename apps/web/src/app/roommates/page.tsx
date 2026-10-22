'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useCampus } from '../../context/CampusContext.js';
import { fetchGraphQL } from '../../lib/api-client.js';
import type { RoommatePost, Campus, RoommateGenderPreference } from '../../types/index.js';
import { RoommateCard } from '../../components/roommates/RoommateCard.js';
import { CAMPUS_DETAILS } from '../../lib/utils.js';
import { Users, PlusCircle, Search } from 'lucide-react';

function RoommatesContent() {
  const { selectedCampus } = useCampus();

  const [campus, setCampus] = useState<Campus | ''>(selectedCampus);
  const [budgetMax, setBudgetMax] = useState<number | ''>('');
  const [gender, setGender] = useState<RoommateGenderPreference | ''>('');
  const [posts, setPosts] = useState<RoommatePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      try {
        const query = `
          query GetRoommates($filter: RoommatePostFilterInput) {
            roommatePosts(filter: $filter) {
              total
              items {
                id
                title
                description
                campus
                budgetMax
                targetMoveInDate
                preferredRoommateGender
                lifestyleHabits
                createdAt
              }
            }
          }
        `;

        const filterPayload: Record<string, unknown> = {};
        if (campus) filterPayload.campus = campus;
        if (budgetMax) filterPayload.budgetMax = Number(budgetMax);
        if (gender) filterPayload.preferredRoommateGender = gender;

        const data = await fetchGraphQL<{ roommatePosts: { items: RoommatePost[]; total: number } }>(
          query,
          { filter: filterPayload }
        );
        setPosts(data.roommatePosts.items);
      } catch (err) {
        console.error('Failed to query roommate posts:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, [campus, budgetMax, gender]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Trouver un colocataire YouCode
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Recherches de colocation publiées par les apprenants actuels et futurs.
          </p>
        </div>

        <Link
          href="/roommates/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors shadow-sm self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Publier une recherche</span>
        </Link>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white border border-gray-200 rounded-lg p-3.5 mb-8 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <Search className="w-3.5 h-3.5" />
          <span>Filtrer :</span>
        </div>

        <select
          value={campus}
          onChange={(e) => setCampus(e.target.value as Campus | '')}
          className="text-xs h-8 rounded border border-gray-300 bg-white px-2.5 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-600"
        >
          <option value="">Tous les campus</option>
          <option value="YOUSSOUFIA">{CAMPUS_DETAILS.YOUSSOUFIA.label}</option>
          <option value="SAFI">{CAMPUS_DETAILS.SAFI.label}</option>
          <option value="NADOR">{CAMPUS_DETAILS.NADOR.label}</option>
        </select>

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as RoommateGenderPreference | '')}
          className="text-xs h-8 rounded border border-gray-300 bg-white px-2.5 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-600"
        >
          <option value="">Préférence de genre (Tous)</option>
          <option value="ANY">Mixte / Indifférent</option>
          <option value="MALE">Hommes uniquement</option>
          <option value="FEMALE">Femmes uniquement</option>
        </select>

        <input
          type="number"
          placeholder="Budget max MAD (ex: 1000)"
          value={budgetMax}
          onChange={(e) => setBudgetMax(e.target.value ? Number(e.target.value) : '')}
          className="text-xs h-8 w-44 rounded border border-gray-300 bg-white px-2.5 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-600"
        />

        {(campus || budgetMax || gender) && (
          <button
            onClick={() => {
              setCampus('');
              setBudgetMax('');
              setGender('');
            }}
            className="text-xs text-brand-600 hover:underline ml-auto"
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {/* Grid of Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <RoommateCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-lg">
          <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900">Aucune annonce trouvée</h3>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            Soyez le premier à publier une recherche de colocation sur ce campus !
          </p>
          <Link
            href="/roommates/new"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
          >
            <span>Publier ma recherche</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function RoommatesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Chargement...</div>}>
      <RoommatesContent />
    </Suspense>
  );
}
