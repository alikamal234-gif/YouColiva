'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchGraphQL } from '../../../lib/api-client.js';
import type { RoommatePost } from '../../../types/index.js';
import { formatMAD, formatDate, CAMPUS_DETAILS } from '../../../lib/utils.js';
import { useAuth } from '../../../context/AuthContext.js';
import { Button } from '../../../components/ui/Button.js';
import {
  Users,
  MessageSquare,
  Shield,
  Flag,
  ArrowLeft,
  Calendar,
  Wallet,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function RoommatePostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, token } = useAuth();

  const [post, setPost] = useState<RoommatePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContacting, setIsContacting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    async function loadPost() {
      try {
        const query = `
          query GetRoommatePostDetail($id: ID!) {
            roommatePost(id: $id) {
              id
              title
              description
              campus
              budgetMax
              targetMoveInDate
              preferredRoommateGender
              status
              lifestyleHabits
              createdAt
              author {
                id
                firstName
                lastName
                email
                role
                campus
                isVerified
              }
            }
          }
        `;

        const data = await fetchGraphQL<{ roommatePost: RoommatePost | null }>(
          query,
          { id: resolvedParams.id },
          token
        );
        setPost(data.roommatePost);
      } catch (err) {
        console.error('Erreur chargement annonce colocataire:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [resolvedParams.id, token]);

  const handleContactAuthor = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/roommates/${resolvedParams.id}`);
      return;
    }

    if (!post?.author?.id) return;

    if (user.id === post.author.id) {
      alert("C'est votre propre publication.");
      return;
    }

    setIsContacting(true);
    try {
      const mutation = `
        mutation ContactRoommate($recipientId: ID!, $roommatePostId: ID) {
          getOrCreateConversation(recipientId: $recipientId, roommatePostId: $roommatePostId) {
            id
          }
        }
      `;

      const data = await fetchGraphQL<{ getOrCreateConversation: { id: string } }>(
        mutation,
        {
          recipientId: post.author.id,
          roommatePostId: post.id,
        },
        token
      );

      if (data.getOrCreateConversation?.id) {
        router.push(`/messages?conversationId=${data.getOrCreateConversation.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de contacter cet apprenant';
      alert(msg);
    } finally {
      setIsContacting(false);
    }
  };

  const handleReport = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const reason = window.prompt(
      'Motif du signalement (ex: annonce non conforme, fausse information) :'
    );
    if (!reason?.trim()) return;

    try {
      const mutation = `
        mutation ReportRoommatePost($input: CreateReportInput!) {
          createReport(input: $input) {
            id
          }
        }
      `;
      await fetchGraphQL(
        mutation,
        {
          input: {
            targetType: 'ROOMMATE_POST',
            targetId: resolvedParams.id,
            reason,
          },
        },
        token
      );
      setReportSuccess(true);
    } catch {
      alert('Erreur lors de la transmission du signalement.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="h-48 bg-gray-100 rounded-lg" />
        <div className="h-8 w-3/4 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h1 className="text-base font-bold text-gray-900">Demande introuvable</h1>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Cette recherche de colocataire n&apos;existe pas ou a été fermée.
        </p>
        <Link href="/roommates" className="text-xs font-medium text-brand-600 hover:underline">
          Retour aux colocataires
        </Link>
      </div>
    );
  }

  const campusInfo = CAMPUS_DETAILS[post.campus];
  const isAuthor = user && user.id === post.author.id;

  const genderLabel =
    post.preferredRoommateGender === 'MALE'
      ? 'Homme uniquement'
      : post.preferredRoommateGender === 'FEMALE'
      ? 'Femme uniquement'
      : 'Mixte / Indifférent';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Back Link */}
      <Link
        href="/roommates"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Retour aux recherches de colocataires</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Header Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-medium text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded">
                Campus {campusInfo?.label || post.campus}
              </span>
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                {genderLabel}
              </span>
              {post.status === 'CLOSED' && (
                <span className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Recherche terminée
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {post.title}
            </h1>

            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Publiée le {formatDate(post.createdAt)}</span>
            </p>
          </div>

          {/* Key Details Grid */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Critères et conditions de colocation</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                <span className="text-[11px] text-gray-500 font-medium block">Budget max mensuel</span>
                <div className="flex items-center gap-1 mt-1 text-base font-bold text-gray-900">
                  <Wallet className="w-4 h-4 text-brand-600" />
                  <span>{formatMAD(post.budgetMax)}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                <span className="text-[11px] text-gray-500 font-medium block">Date d&apos;entrée souhaitée</span>
                <div className="flex items-center gap-1 mt-1 text-sm font-semibold text-gray-900">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <span>{formatDate(post.targetMoveInDate)}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                <span className="text-[11px] text-gray-500 font-medium block">Préférence profil</span>
                <div className="flex items-center gap-1 mt-1 text-sm font-semibold text-gray-900">
                  <Users className="w-4 h-4 text-brand-600" />
                  <span>{genderLabel}</span>
                </div>
              </div>
            </div>

            {/* Lifestyle habits */}
            {post.lifestyleHabits && post.lifestyleHabits.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-700 block mb-2">
                  Habitudes de vie et préférences :
                </span>
                <div className="flex flex-wrap gap-2">
                  {post.lifestyleHabits.map((habit, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                      <span>{habit}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Description de la recherche
            </h2>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {post.description}
            </p>
          </div>

          {/* Community Safety Tip */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex gap-3 text-xs text-blue-900">
            <Shield className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-950">Conseil pour une colocation sereine</p>
              <p className="text-blue-800/90 leading-relaxed">
                Discutez au préalable des rythmes de travail, de la répartition du loyer et des charges,
                ainsi que des règles de vie commune. Ne versez jamais d&apos;argent avant d&apos;avoir visité
                le logement ensemble et signé les documents requis.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Action Column (1 col) */}
        <div className="space-y-6">
          {/* Author Card & Contact */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm sticky top-24">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Publié par
            </h3>

            <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-brand-50 border border-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                {post.author.firstName[0]}
                {post.author.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-900 truncate">
                    {post.author.firstName} {post.author.lastName}
                  </span>
                  {post.author.isVerified && (
                    <span title="Profil vérifié">
                      <UserCheck className="w-4 h-4 text-brand-600 shrink-0" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Apprenant YouCode • {campusInfo?.city || post.author.campus}
                </p>
              </div>
            </div>

            {/* Direct Contact Button */}
            <div className="mt-5 space-y-3">
              {isAuthor ? (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-center text-xs text-gray-500">
                  Il s&apos;agit de votre publication. Vous pouvez la gérer depuis votre profil.
                </div>
              ) : (
                <Button
                  onClick={handleContactAuthor}
                  disabled={isContacting || post.status === 'CLOSED'}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    {isContacting
                      ? 'Ouverture de la discussion...'
                      : post.status === 'CLOSED'
                      ? 'Recherche clôturée'
                      : 'Contacter pour rejoindre la colocation'}
                  </span>
                </Button>
              )}

              <p className="text-[11px] text-gray-400 text-center">
                L&apos;échange s&apos;effectue de manière sécurisée via la messagerie interne YouColiva.
              </p>
            </div>

            {/* Report Option */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
              {reportSuccess ? (
                <span className="text-green-600 font-medium">Signalement enregistré.</span>
              ) : (
                <button
                  type="button"
                  onClick={handleReport}
                  className="text-gray-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
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
