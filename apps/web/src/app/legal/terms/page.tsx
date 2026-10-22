import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function TermsPage() {
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
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Conditions Générales d&apos;Utilisation
            </h1>
            <p className="text-xs text-neutral-500">
              Dernière mise à jour : 22 octobre 2026 • Document soumis à révision légale
            </p>
          </div>
        </div>

        <section className="space-y-3 text-sm text-neutral-700 leading-relaxed">
          <h2 className="text-base font-semibold text-neutral-900">1. Objet de la plateforme</h2>
          <p>
            YouColiva est un service communautaire destiné aux apprenants et futurs apprenants de YouCode
            sur les campus de Youssoufia, Safi et Nador. La plateforme facilite la mise en relation entre étudiants,
            bailleurs et agents immobiliers pour la recherche de logements et de colocataires.
          </p>
        </section>

        <section className="space-y-3 text-sm text-neutral-700 leading-relaxed">
          <h2 className="text-base font-semibold text-neutral-900">2. Comptes et vérification</h2>
          <p>
            Chaque utilisateur s&apos;engage à fournir des informations exactes lors de son inscription.
            La qualité d&apos;étudiant YouCode fait l&apos;objet d&apos;une vérification distincte. Les annonces publiées
            par des propriétaires ou des agents sont soumises à la modération de l&apos;équipe administrative
            avant diffusion publique.
          </p>
        </section>

        <section className="space-y-3 text-sm text-neutral-700 leading-relaxed">
          <h2 className="text-base font-semibold text-neutral-900">3. Protection des adresses et de la vie privée</h2>
          <p>
            Afin de préserver la tranquillité des résidents, les adresses précises des biens ne sont jamais
            diffusées publiquement par défaut. Seuls les quartiers et coordonnées géographiques approximatives sont
            visibles des visiteurs non autorisés.
          </p>
        </section>

        <section className="space-y-3 text-sm text-neutral-700 leading-relaxed">
          <h2 className="text-base font-semibold text-neutral-900">4. Rôle d&apos;intermédiaire</h2>
          <p>
            YouColiva agit en tant qu&apos;intermédiaire technique et ne perçoit aucun paiement direct de loyer
            ou de caution. Les contrats de bail et transactions financières relèvent de la responsabilité exclusive
            des bailleurs et locataires.
          </p>
        </section>

        <section className="space-y-3 text-sm text-neutral-700 leading-relaxed">
          <h2 className="text-base font-semibold text-neutral-900">5. Signalement et sanctions</h2>
          <p>
            Tout contenu abusif, propos discriminatoire ou annonce frauduleuse peut être signalé par les utilisateurs.
            L&apos;administration se réserve le droit de suspendre ou de supprimer tout compte ou annonce ne respectant pas
            la charte de la communauté.
          </p>
        </section>
      </div>
    </div>
  );
}
