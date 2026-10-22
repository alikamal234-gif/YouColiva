'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Home,
  Users,
  MessageSquare,
  ShieldCheck,
  Info,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { fetchGraphQL } from '../../lib/api-client.js';
import type { AppNotification, NotificationFeed, NotificationType } from '../../types/index.js';

export function NotificationDropdown() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getActiveToken = () => {
    return token || (typeof window !== 'undefined' ? localStorage.getItem('youcoliva_access_token') : null);
  };

  // Fetch initial unread count on mount and polling
  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, token]);

  const fetchUnreadCount = async () => {
    const activeToken = getActiveToken();
    if (!activeToken) return;

    try {
      const query = `
        query GetUnreadCount {
          unreadNotificationsCount
        }
      `;
      const data = await fetchGraphQL<{ unreadNotificationsCount: number }>(query, {}, activeToken);
      setUnreadCount(data.unreadNotificationsCount || 0);
    } catch {
      // ignore in background
    }
  };

  const loadNotifications = async (offset = 0, isAppend = false) => {
    const activeToken = getActiveToken();
    if (!activeToken) return;

    if (isAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const query = `
        query GetNotifications($limit: Int, $offset: Int) {
          myNotifications(limit: $limit, offset: $offset) {
            items {
              id
              title
              message
              type
              link
              isRead
              createdAt
            }
            total
            unreadCount
            hasMore
          }
        }
      `;

      const data = await fetchGraphQL<{ myNotifications: NotificationFeed }>(
        query,
        { limit: 10, offset },
        activeToken
      );

      const feed = data.myNotifications;
      if (isAppend) {
        setNotifications((prev) => [...prev, ...feed.items]);
      } else {
        setNotifications(feed.items);
      }

      setUnreadCount(feed.unreadCount);
      setHasMore(feed.hasMore);
    } catch (err) {
      console.warn('Erreur chargement notifications:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      loadNotifications(0, false);
    }
  };

  const handleShowMore = () => {
    loadNotifications(notifications.length, true);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    const activeToken = getActiveToken();
    if (!notif.isRead && activeToken) {
      try {
        const mutation = `
          mutation MarkRead($id: ID!) {
            markNotificationAsRead(id: $id) {
              id
              isRead
            }
          }
        `;
        await fetchGraphQL(mutation, { id: notif.id }, activeToken);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // proceed anyway
      }
    }

    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    const activeToken = getActiveToken();
    if (!activeToken) return;

    try {
      const mutation = `
        mutation MarkAll {
          markAllNotificationsAsRead
        }
      `;
      await fetchGraphQL(mutation, {}, activeToken);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'NEW_LISTING':
        return <Home className="w-4 h-4 text-blue-600" />;
      case 'NEW_ROOMMATE_POST':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'LISTING_MODERATED':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-neutral-500" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    if (days === 1) return 'Hier';
    return `Il y a ${days} j`;
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Mini Popup / Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden text-neutral-900">
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-neutral-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-medium bg-blue-100 text-blue-700 rounded-full">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3" />
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Notifications List (scrollable max 10 initially) */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                Chargement des notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <Bell className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-neutral-700">Aucune notification pour le moment</p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Vous serez averti dès qu&apos;un nouveau logement ou colocataire sera publié.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                    notif.isRead
                      ? 'bg-white hover:bg-neutral-50/80 text-neutral-600'
                      : 'bg-blue-50/40 hover:bg-blue-50/70 text-neutral-900 font-medium'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-neutral-100 shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-xs ${notif.isRead ? 'text-neutral-900 font-medium' : 'text-neutral-900 font-semibold'} truncate`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer with "Show more" button */}
          {hasMore && (
            <div className="p-2 border-t border-neutral-100 bg-neutral-50/50 text-center">
              <button
                onClick={handleShowMore}
                disabled={loadingMore}
                className="w-full py-1.5 px-3 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {loadingMore ? (
                  <span>Chargement...</span>
                ) : (
                  <>
                    <span>Afficher plus</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
