import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 mb-6 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour à l&apos;accueil
      </Link>

      <div className="border border-neutral-200 rounded-lg p-6 sm:p-10 bg-white shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
          <Lock className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Politique de Confidentialité
            </h1>
            <p className="text-xs text-neutral-500">
              Conformité protection des données personnelles (Loi 09-08) • Dernière mise à jour : 22 octobre 2026
            </p>
          </div>
        </div>

        <section className="space-y-3 text-sm text-neutral-700 leading-relaxed">
          <h2 className="text-base font-semibold text-neutral-900">1. Données collectées</h2>
          <p>
            YouColiva collecte les données strictement nécessaires au fonctionnement du service :
            nom, prénom, adresse électronique, numéro de téléphone (optionnel), campus de rattachement,
            et préférences de logement ou de colocation.
          </p>
        </section>

        <section className="space-y-3 text-sm text-neutral-700 leading-relaxed">
          <h2 className="text-base font-semibold text-neutral-900">2. Sécurité et protection des adresses exactes</h2>
          <p>
            Conformément à nos principes d&apos;ingénierie et de sécurité, l&apos;adresse postale exacte
            d&apos;un logement n&apos;est jamais exposée aux utilisateurs anonymes ou non autorisés.
            Seul le quartier et des coordonnées approximatives sont affichés sur la carte publique.
          </p>
        </section>

        <section className="space-y-3 text-sm text-neutral-700 leading-relaxed">
          <h2 className="text-base font-semibold text-neutral-900">3. Stockage et mots de passe</h2>
          <p>
            Les mots de passe sont rigoureusement hachés via des algorithmes robustes (Argon2 / Bcrypt)
            et ne sont jamais stockés en clair. Les jetons de session sont gérés de manière sécurisée
            avec des durées de vie réduites et des révocations automatiques.
          </p>
        </section>

        <section className="space-y-3 text-sm text-neutral-700 leading-relaxed">
          <h2 className="text-base font-semibold text-neutral-900">4. Partage et tiers</h2>
          <p>
            Aucune donnée personnelle n&apos;est vendue ou partagée avec des tiers à des fins publicitaires.
            Les informations de contact (téléphone, WhatsApp) ne sont partagées qu&apos;avec le consentement
            explicite de l&apos;utilisateur au sein des fiches d&apos;annonces ou de profils.
          </p>
        </section>

        <section className="space-y-3 text-sm text-neutral-700 leading-relaxed">
          <h2 className="text-base font-semibold text-neutral-900">5. Droits d&apos;accès et de rectification</h2>
          <p>
            Vous pouvez à tout moment accéder à vos informations personnelles, les modifier via la section
            Mon Profil ou demander la suppression définitive de votre compte et de vos données associées
            en contactant l&apos;équipe d&apos;administration YouColiva.
          </p>
        </section>
      </div>
    </div>
  );
}
