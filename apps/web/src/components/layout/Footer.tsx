'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { CAMPUS_DETAILS } from '../../lib/utils.js';

export function Footer() {
  const pathname = usePathname();

  // Hide footer on messages page for a fixed full-height chat experience
  if (pathname?.startsWith('/messages')) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="inline-block transition-opacity hover:opacity-90">
              <Image
                src="/logo.png"
                alt="YouColiva"
                width={140}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed">
              Plateforme communautaire de logement et de colocation dédiée aux apprenants YouCode
              sur les campus de Youssoufia, Safi et Nador.
            </p>
          </div>

          {/* Campus YouCode */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Campus couverts
            </h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li>
                <div className="font-medium text-gray-900">
                  {CAMPUS_DETAILS.YOUSSOUFIA.label}
                </div>
                <div className="text-gray-400">{CAMPUS_DETAILS.YOUSSOUFIA.address}</div>
              </li>
              <li>
                <div className="font-medium text-gray-900">{CAMPUS_DETAILS.SAFI.label}</div>
                <div className="text-gray-400">{CAMPUS_DETAILS.SAFI.address}</div>
              </li>
              <li>
                <div className="font-medium text-gray-900">{CAMPUS_DETAILS.NADOR.label}</div>
                <div className="text-gray-400">{CAMPUS_DETAILS.NADOR.address}</div>
              </li>
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Navigation
            </h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li>
                <Link href="/listings" className="hover:text-brand-600 transition-colors">
                  Trouver un logement
                </Link>
              </li>
              <li>
                <Link href="/roommates" className="hover:text-brand-600 transition-colors">
                  Rechercher un colocataire
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-brand-600 transition-colors">
                  Publier une annonce bailleur
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Safety */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Sécurité & Légal
            </h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li>
                <Link href="/legal/terms" className="hover:text-brand-600 transition-colors">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-brand-600 transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <span className="text-gray-400">
                  Projet communautaire indépendant. Aucune affiliation officielle non confirmée.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400">
          <p>© {new Date().getFullYear()} YouColiva. Conçu pour la communauté YouCode.</p>
          <p className="mt-2 sm:mt-0">Youssoufia • Safi • Nador</p>
        </div>
      </div>
    </footer>
  );
}
