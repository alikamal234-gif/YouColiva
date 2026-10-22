'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext.js';
import { CampusSelector } from './CampusSelector.js';
import { NotificationDropdown } from './NotificationDropdown.js';
import {
  Home,
  Users,
  Heart,
  MessageSquare,
  Shield,
  PlusCircle,
  LogOut,
  User as UserIcon,
  Menu,
  X,
} from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const canAddListing = user && ['LANDLORD', 'AGENT', 'ADMIN'].includes(user.role);
  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-gray-900"
            >
              <span>YouColiva</span>
              <span className="w-2 h-2 rounded-full bg-brand-600 mb-0.5" />
            </Link>

            {/* Desktop Main Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link
                href="/listings"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Logements</span>
              </Link>
              <Link
                href="/roommates"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Colocataires</span>
              </Link>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center gap-4">
            <CampusSelector />

            {user ? (
              <div className="flex items-center gap-3">
                {canAddListing && (
                  <Link
                    href="/listings/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-md hover:bg-brand-100 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Publier un logement</span>
                  </Link>
                )}

                {isStudent && (
                  <Link
                    href="/roommates/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-md hover:bg-brand-100 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Chercher un colocataire</span>
                  </Link>
                )}

                <NotificationDropdown />

                <Link
                  href="/favorites"
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  title="Mes favoris"
                >
                  <Heart className="w-4 h-4" />
                </Link>

                <Link
                  href="/messages"
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  title="Messagerie"
                >
                  <MessageSquare className="w-4 h-4" />
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                    title="Administration"
                  >
                    <Shield className="w-4 h-4" />
                  </Link>
                )}

                <div className="h-4 w-[1px] bg-gray-200 mx-1" />

                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="text-xs font-medium text-gray-700 hover:text-brand-600 flex items-center gap-1"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>{user.firstName}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                    title="Déconnexion"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-xs font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors shadow-sm"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <CampusSelector />
            {user && <NotificationDropdown />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            href="/listings"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-gray-700"
          >
            Logements
          </Link>
          <Link
            href="/roommates"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-gray-700"
          >
            Colocataires
          </Link>
          {user ? (
            <>
              <Link
                href="/favorites"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-gray-700"
              >
                Mes favoris
              </Link>
              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-gray-700"
              >
                Messagerie
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-gray-700"
                >
                  Administration
                </Link>
              )}
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-gray-700"
              >
                Mon profil ({user.firstName})
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm font-medium text-red-600"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md"
              >
                Connexion
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-medium text-white bg-brand-600 rounded-md"
              >
                Inscription
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
