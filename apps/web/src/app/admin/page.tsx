'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Flag,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { fetchGraphQL } from '../../lib/api-client.js';
import { formatMAD, CAMPUS_DETAILS } from '../../lib/utils.js';
import type { Listing, Report } from '../../types/index.js';

export default function AdminDashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'listings' | 'reports'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login?redirect=/admin');
      } else if (user.role !== 'ADMIN') {
        router.push('/');
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      // 1. Fetch listings for moderation
      const listingsQuery = `
        query GetAdminListings {
          listings(filter: { limit: 50 }) {
            items {
              id
              title
              description
              campus
              neighborhood
              pricePerMonth
              propertyType
              status
              moderationStatus
              moderationReason
              createdAt
              owner {
                id
                firstName
                lastName
                email
                role
                isVerified
              }
            }
          }
        }
      `;

      // 2. Fetch reports
      const reportsQuery = `
        query GetAdminReports {
          reports {
            id
            targetType
            targetId
            reason
            details
            status
            actionTaken
            createdAt
            reporter {
              id
              firstName
              lastName
              email
            }
          }
        }
      `;

      const [listingsRes, reportsRes] = await Promise.all([
        fetchGraphQL<{ listings: { items: Listing[] } }>(listingsQuery, {}, token),
        fetchGraphQL<{ reports: Report[] }>(reportsQuery, {}, token),
      ]);

      setListings(listingsRes.listings.items || []);
      setReports(reportsRes.reports || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setFeedback({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  const handleModerateListing = async (
    listingId: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ) => {
    setActionInProgress(listingId);
    setFeedback(null);

    try {
      const mutation = `
        mutation Moderate($id: ID!, $status: ModerationStatus!, $reason: String) {
          moderateListing(id: $id, status: $status, reason: $reason) {
            id
            moderationStatus
            moderationReason
          }
        }
      `;

      await fetchGraphQL(mutation, { id: listingId, status, reason }, token);

      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, moderationStatus: status, moderationReason: reason } : l))
      );

      setFeedback({
        type: 'success',
        message: `Annonce mise à jour: ${status === 'APPROVED' ? 'Approuvée' : 'Rejetée'}.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de modération';
      setFeedback({ type: 'error', message });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResolveReport = async (
    reportId: string,
    status: 'RESOLVED' | 'DISMISSED',
    actionTaken: string
  ) => {
    setActionInProgress(reportId);
    setFeedback(null);

    try {
      const mutation = `
        mutation ResolveRep($id: ID!, $status: ReportStatus!, $actionTaken: String!) {
          resolveReport(id: $id, status: $status, actionTaken: $actionTaken) {
            id
            status
            actionTaken
          }
        }
      `;

      await fetchGraphQL(mutation, { id: reportId, status, actionTaken }, token);

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status, actionTaken } : r))
      );

      setFeedback({
        type: 'success',
        message: `Signalement marqué comme ${status === 'RESOLVED' ? 'résolu' : 'classé'}.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la résolution';
      setFeedback({ type: 'error', message });
    } finally {
      setActionInProgress(null);
    }
  };

  if (authLoading || (user && user.role !== 'ADMIN')) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 text-center text-sm text-neutral-500">
        Vérification des autorisations administrateur...
      </div>
    );
  }

  const pendingListings = listings.filter((l) => l.moderationStatus === 'PENDING');
  const pendingReports = reports.filter((r) => r.status === 'PENDING');

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-purple-600" />
            Espace d&apos;administration YouColiva
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Contrôle qualité, modération des annonces et traitement des signalements pour les 3 campus YouCode.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {feedback && (
        <div
          className={`mt-6 p-4 rounded-md text-sm border flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="border border-neutral-200 rounded-lg p-5 bg-white shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Annonces en attente
          </span>
          <span className="text-2xl font-bold text-neutral-900 mt-2 block">
            {pendingListings.length}
          </span>
          <span className="text-xs text-neutral-400 mt-1 block">
            Sur {listings.length} annonces totales
          </span>
        </div>

        <div className="border border-neutral-200 rounded-lg p-5 bg-white shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Signalements ouverts
          </span>
          <span className="text-2xl font-bold text-amber-600 mt-2 block">
            {pendingReports.length}
          </span>
          <span className="text-xs text-neutral-400 mt-1 block">
            Sur {reports.length} signalements totaux
          </span>
        </div>

        <div className="border border-neutral-200 rounded-lg p-5 bg-white shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Campus couverts
          </span>
          <span className="text-2xl font-bold text-blue-600 mt-2 block">3</span>
          <span className="text-xs text-neutral-400 mt-1 block">
            Youssoufia, Safi, Nador
          </span>
        </div>

        <div className="border border-neutral-200 rounded-lg p-5 bg-white shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Modérateur actif
          </span>
          <span className="text-sm font-semibold text-neutral-900 mt-2 block truncate">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="text-xs text-purple-700 bg-purple-50 inline-block px-1.5 py-0.5 rounded mt-1 font-medium">
            ADMIN
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 mt-8 flex gap-6 text-sm">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'listings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Modération des annonces ({pendingListings.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Flag className="w-4 h-4" />
          Signalements communautaires ({pendingReports.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'listings' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-sm text-neutral-500">Chargement...</div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg text-sm text-neutral-500">
                Aucune annonce enregistrée dans le système.
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-700 border-b border-neutral-200 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Titre & Quartier</th>
                      <th className="p-4">Campus</th>
                      <th className="p-4">Bailleur</th>
                      <th className="p-4">Loyer</th>
                      <th className="p-4">Statut Modération</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {listings.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-neutral-900">{item.title}</div>
                          <div className="text-xs text-neutral-500">{item.neighborhood}</div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-800">
                            {CAMPUS_DETAILS[item.campus]?.label || item.campus}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-neutral-900 font-medium">
                            {item.owner.firstName} {item.owner.lastName}
                          </div>
                          <div className="text-xs text-neutral-500">{item.owner.email}</div>
                        </td>
                        <td className="p-4 font-semibold text-neutral-900">
                          {formatMAD(item.pricePerMonth)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                              item.moderationStatus === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : item.moderationStatus === 'REJECTED'
                                ? 'bg-red-50 text-red-800 border border-red-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {item.moderationStatus === 'APPROVED'
                              ? 'Approuvée'
                              : item.moderationStatus === 'REJECTED'
                              ? 'Rejetée'
                              : 'En attente'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/listings/${item.id}`}
                              target="_blank"
                              className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-100"
                              title="Voir l'annonce"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            {item.moderationStatus !== 'APPROVED' && (
                              <button
                                onClick={() => handleModerateListing(item.id, 'APPROVED')}
                                disabled={actionInProgress === item.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors disabled:opacity-50"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approuver
                              </button>
                            )}

                            {item.moderationStatus !== 'REJECTED' && (
                              <button
                                onClick={() =>
                                  handleModerateListing(
                                    item.id,
                                    'REJECTED',
                                    'Non conforme aux standards YouColiva'
                                  )
                                }
                                disabled={actionInProgress === item.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Rejeter
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-sm text-neutral-500">Chargement...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg text-sm text-neutral-500">
                Aucun signalement dans la file d&apos;attente.
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-700 border-b border-neutral-200 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Type & Cible</th>
                      <th className="p-4">Signalé par</th>
                      <th className="p-4">Motif</th>
                      <th className="p-4">Détails</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-right">Traitement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="p-4">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800">
                            {rep.targetType}
                          </span>
                          <span className="text-xs text-neutral-400 block mt-1 font-mono truncate max-w-[120px]">
                            {rep.targetId}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-neutral-900 font-medium">
                            {rep.reporter.firstName} {rep.reporter.lastName}
                          </div>
                          <div className="text-xs text-neutral-500">{rep.reporter.email}</div>
                        </td>
                        <td className="p-4 font-semibold text-neutral-900">{rep.reason}</td>
                        <td className="p-4 text-xs text-neutral-600 max-w-xs break-words">
                          {rep.details || 'Aucun détail fourni'}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                              rep.status === 'RESOLVED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : rep.status === 'DISMISSED'
                                ? 'bg-neutral-100 text-neutral-600'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {rep.status === 'RESOLVED'
                              ? 'Résolu'
                              : rep.status === 'DISMISSED'
                              ? 'Classé sans suite'
                              : 'En attente'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {rep.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  handleResolveReport(
                                    rep.id,
                                    'RESOLVED',
                                    'Action corrective appliquée par la modération'
                                  )
                                }
                                disabled={actionInProgress === rep.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors disabled:opacity-50"
                              >
                                Résoudre
                              </button>
                              <button
                                onClick={() =>
                                  handleResolveReport(
                                    rep.id,
                                    'DISMISSED',
                                    'Non fondé après examen'
                                  )
                                }
                                disabled={actionInProgress === rep.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors disabled:opacity-50"
                              >
                                Classer
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-400 italic">
                              Traité: {rep.actionTaken}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
