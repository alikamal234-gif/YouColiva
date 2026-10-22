'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageSquare,
  Send,
  User as UserIcon,
  AlertCircle,
  Building2,
  Circle,
  ArrowLeft,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext.js';
import { fetchGraphQL } from '../../lib/api-client.js';
import type { Conversation, Message, User } from '../../types/index.js';

function parseDateSafe(dateVal: unknown): Date {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? new Date() : dateVal;
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  if (typeof dateVal === 'string') {
    if (/^\d+$/.test(dateVal)) {
      const num = Number(dateVal);
      const d = new Date(num);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

function formatMessageTime(dateVal: unknown): string {
  const d = parseDateSafe(dateVal);
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatConversationDate(dateVal: unknown): string {
  const d = parseDateSafe(dateVal);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

function sortMessagesChronological(list: Message[]): Message[] {
  return [...list].sort(
    (a, b) => parseDateSafe(a.createdAt).getTime() - parseDateSafe(b.createdAt).getTime()
  );
}

function MessagesContent() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeConversationId = searchParams.get('conversationId');
  const recipientIdFromUrl = searchParams.get('recipientId');
  const listingIdFromUrl = searchParams.get('listingId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/messages');
    }
  }, [user, authLoading, router]);

  // Load conversations on mount
  useEffect(() => {
    if (user && token) {
      loadConversations();
    }
  }, [user, token]);

  // Setup Socket.IO connection
  useEffect(() => {
    if (!token) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('new_message', (rawMsg: any) => {
      if (!rawMsg) return;

      const incomingMsg: Message = {
        id: String(rawMsg.id || rawMsg._id || `msg_${Date.now()}_${Math.random()}`),
        conversationId: String(rawMsg.conversationId || ''),
        content: String(rawMsg.content || ''),
        createdAt: rawMsg.createdAt || new Date().toISOString(),
        sender: {
          id: String(rawMsg.sender?.id || rawMsg.sender?._id || ''),
          firstName: rawMsg.sender?.firstName || 'Utilisateur',
          lastName: rawMsg.sender?.lastName || '',
          role: rawMsg.sender?.role || 'STUDENT',
        },
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === incomingMsg.id)) return prev;
        return sortMessagesChronological([...prev, incomingMsg]);
      });

      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === incomingMsg.conversationId
            ? { ...c, lastMessage: incomingMsg.content, lastMessageAt: incomingMsg.createdAt }
            : c
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const query = `
        query GetMyConversations {
          myConversations {
            id
            participants {
              id
              firstName
              lastName
              email
              role
              isVerified
            }
            listingId
            roommatePostId
            lastMessage
            lastMessageAt
            createdAt
          }
        }
      `;

      const data = await fetchGraphQL<{ myConversations: Conversation[] }>(query, {}, token);
      const list = data.myConversations || [];
      setConversations(list);

      // Handle direct recipient flow or selected conversation
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
      if (recipientIdFromUrl) {
        startOrSelectWithRecipient(recipientIdFromUrl, listingIdFromUrl || undefined);
      } else if (activeConversationId) {
        const found = list.find((c) => c.id === activeConversationId);
        if (found) {
          selectConversation(found);
        } else if (list.length > 0 && isDesktop) {
          selectConversation(list[0]);
        }
      } else if (list.length > 0 && isDesktop) {
        selectConversation(list[0]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des conversations';
      setError(message);
    } finally {
      setLoadingConversations(false);
    }
  };

  const startOrSelectWithRecipient = async (recipientId: string, listingId?: string) => {
    try {
      const mutation = `
        mutation GetOrCreateConv($recipientId: ID!, $listingId: ID) {
          getOrCreateConversation(recipientId: $recipientId, listingId: $listingId) {
            id
            participants {
              id
              firstName
              lastName
              email
              role
              isVerified
            }
            listingId
            roommatePostId
            lastMessage
            lastMessageAt
            createdAt
          }
        }
      `;

      const data = await fetchGraphQL<{ getOrCreateConversation: Conversation }>(
        mutation,
        { recipientId, listingId },
        token
      );

      const conv = data.getOrCreateConversation;
      setConversations((prev) => {
        if (!prev.some((c) => c.id === conv.id)) {
          return [conv, ...prev];
        }
        return prev;
      });

      selectConversation(conv);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de démarrer la conversation';
      setError(message);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    setLoadingMessages(true);
    setError(null);

    // Join room on Socket
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_conversation', { conversationId: conv.id });
    }

    try {
      const query = `
        query GetConvMessages($conversationId: ID!) {
          conversationMessages(conversationId: $conversationId, limit: 50) {
            items {
              id
              conversationId
              content
              createdAt
              sender {
                id
                firstName
                lastName
                role
              }
            }
          }
        }
      `;

      const data = await fetchGraphQL<{ conversationMessages: { items: Message[] } }>(
        query,
        { conversationId: conv.id },
        token
      );

      const items = data.conversationMessages?.items || [];
      setMessages(sortMessagesChronological(items));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de charger les messages';
      setError(message);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', {
          conversationId: selectedConversation.id,
          content,
        });
      } else {
        // Fallback to GraphQL mutation
        const mutation = `
          mutation SendMsg($conversationId: ID!, $content: String!) {
            sendMessage(conversationId: $conversationId, content: $content) {
              id
              conversationId
              content
              createdAt
              sender {
                id
                firstName
                lastName
                role
              }
            }
          }
        `;

        const data = await fetchGraphQL<{ sendMessage: Message }>(
          mutation,
          { conversationId: selectedConversation.id, content },
          token
        );

        setMessages((prev) => sortMessagesChronological([...prev, data.sendMessage]));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'envoi du message';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const getInterlocutor = (conv: Conversation): User | undefined => {
    return conv.participants.find((p) => p.id !== user?.id) || conv.participants[0];
  };

  if (!mounted) {
    return (
      <div
        suppressHydrationWarning
        className="flex-1 flex flex-col h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden bg-gray-50/50 p-2 sm:p-4"
      >
        <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0 bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden items-center justify-center p-8 text-center text-xs text-gray-400">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Chargement de la messagerie...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      suppressHydrationWarning
      className="flex-1 flex flex-col h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden bg-gray-50/50 p-2 sm:p-4"
    >
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0 bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {error && (
          <div className="shrink-0 m-2.5 border border-red-200 bg-red-50 text-red-700 p-2.5 rounded-md text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Conversations List (4 cols) */}
          <div
            className={`md:col-span-4 lg:col-span-4 flex flex-col h-full min-h-0 bg-white ${
              selectedConversation ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-3.5 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h1 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                  Conversations ({conversations.length})
                </h1>
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <Circle
                  className={`w-2 h-2 ${
                    socketConnected
                      ? 'text-emerald-500 fill-emerald-500'
                      : 'text-gray-400 fill-gray-400'
                  }`}
                />
                <span className="text-gray-500 text-[11px]">
                  {socketConnected ? 'En direct' : 'Reconnexion'}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-h-0">
              {loadingConversations ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  Chargement des conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 space-y-2">
                  <p className="font-medium text-gray-600">Aucune conversation pour l&apos;instant</p>
                  <p>
                    Contactez un propriétaire ou un colocataire depuis une annonce pour démarrer une discussion.
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const other = getInterlocutor(conv);
                  const isSelected = selectedConversation?.id === conv.id;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                        isSelected
                          ? 'bg-blue-50/80 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center shrink-0 text-xs">
                        {other?.firstName ? other.firstName.charAt(0).toUpperCase() : 'U'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-gray-900 truncate">
                            {other?.firstName} {other?.lastName}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                            {formatConversationDate(conv.lastMessageAt || conv.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {conv.lastMessage || 'Aucun message pour l\'instant'}
                        </p>

                        {conv.listingId && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 mt-1 font-medium">
                            <Building2 className="w-3 h-3" />
                            Au sujet d&apos;un logement
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Message Thread (8 cols) */}
          <div
            className={`md:col-span-8 lg:col-span-8 flex flex-col h-full min-h-0 bg-white ${
              !selectedConversation ? 'hidden md:flex' : 'flex'
            }`}
          >
            {selectedConversation ? (
              <>
                {/* Thread Header */}
                <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-2.5">
                    {/* Back button on mobile */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedConversation(null);
                        router.replace('/messages', { scroll: false });
                      }}
                      className="md:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                      aria-label="Retour aux conversations"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-xs shrink-0">
                      {getInterlocutor(selectedConversation)?.firstName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h2 className="text-xs font-semibold text-gray-900">
                        {getInterlocutor(selectedConversation)?.firstName}{' '}
                        {getInterlocutor(selectedConversation)?.lastName}
                      </h2>
                      <span className="text-[11px] text-gray-500 block">
                        {getInterlocutor(selectedConversation)?.role === 'LANDLORD'
                          ? 'Propriétaire'
                          : getInterlocutor(selectedConversation)?.role === 'AGENT'
                          ? 'Agent immobilier'
                          : 'Étudiant YouCode'}
                      </span>
                    </div>
                  </div>

                  {selectedConversation.listingId && (
                    <Link
                      href={`/listings/${selectedConversation.listingId}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                    >
                      Voir l&apos;annonce
                    </Link>
                  )}
                </div>

                {/* Messages Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/60 min-h-0">
                  {loadingMessages ? (
                    <div className="text-center py-10 text-xs text-gray-400">
                      Chargement des messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-16 text-xs text-gray-500 space-y-1">
                      <p className="font-medium text-gray-700">Début de la conversation</p>
                      <p>Envoyez votre premier message pour faire connaissance ou poser vos questions.</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.sender?.id === user?.id;
                      const messageKey = msg.id || (msg as any)._id || `msg_${idx}_${msg.createdAt}`;

                      return (
                        <div
                          key={messageKey}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none shadow-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 px-1">
                            {formatMessageTime(msg.createdAt)}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input - Fixed bottom */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-gray-200 bg-white flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="inline-flex items-center justify-center p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    aria-label="Envoyer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <UserIcon className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-700">Aucune conversation sélectionnée</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Choisissez une conversation dans la colonne de gauche pour afficher l&apos;historique des échanges.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto py-12 px-4 text-center text-sm text-neutral-500">
          Chargement de la messagerie...
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
