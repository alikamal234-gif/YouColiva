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
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext.js';
import { fetchGraphQL } from '../../lib/api-client.js';
import type { Conversation, Message, User } from '../../types/index.js';

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
        return [...prev, incomingMsg];
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
      if (recipientIdFromUrl) {
        startOrSelectWithRecipient(recipientIdFromUrl, listingIdFromUrl || undefined);
      } else if (activeConversationId) {
        const found = list.find((c) => c.id === activeConversationId);
        if (found) {
          selectConversation(found);
        } else if (list.length > 0) {
          selectConversation(list[0]);
        }
      } else if (list.length > 0) {
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

      setMessages(data.conversationMessages.items || []);
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

        setMessages((prev) => [...prev, data.sendMessage]);
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Messagerie YouColiva
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Échangez directement et en toute sécurité avec les autres étudiants, bailleurs ou colocataires.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Circle
            className={`w-2.5 h-2.5 ${socketConnected ? 'text-emerald-500 fill-emerald-500' : 'text-neutral-400 fill-neutral-400'}`}
          />
          <span className="text-neutral-600">
            {socketConnected ? 'En direct' : 'Reconnexion...'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-xs h-[650px]">
        {/* Conversations List (4 cols) */}
        <div className="md:col-span-4 border-r border-neutral-200 flex flex-col h-full bg-neutral-50/30">
          <div className="p-3.5 border-b border-neutral-200 font-semibold text-xs text-neutral-700 uppercase tracking-wider bg-white">
            Conversations ({conversations.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
            {loadingConversations ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                Chargement des conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500 space-y-2">
                <p>Aucune conversation pour l&apos;instant.</p>
                <p className="text-neutral-400">
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
                        ? 'bg-blue-50/70 border-l-4 border-blue-600'
                        : 'hover:bg-neutral-100/70'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center shrink-0 text-sm">
                      {other?.firstName ? other.firstName.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-neutral-900 truncate">
                          {other?.firstName} {other?.lastName}
                        </span>
                        <span className="text-[11px] text-neutral-400 shrink-0 ml-1">
                          {new Date(conv.lastMessageAt || conv.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-500 truncate mt-0.5">
                        {conv.lastMessage || 'Aucun message pour l\'instant'}
                      </p>

                      {conv.listingId && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 mt-1">
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
        <div className="md:col-span-8 flex flex-col h-full bg-white">
          {selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 border-b border-neutral-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 font-semibold flex items-center justify-center text-xs">
                    {getInterlocutor(selectedConversation)?.firstName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-900">
                      {getInterlocutor(selectedConversation)?.firstName}{' '}
                      {getInterlocutor(selectedConversation)?.lastName}
                    </h2>
                    <span className="text-xs text-neutral-500 block">
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

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/40">
                {loadingMessages ? (
                  <div className="text-center py-10 text-xs text-neutral-400">
                    Chargement des messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-xs text-neutral-500 space-y-1">
                    <p className="font-medium text-neutral-700">Début de la conversation</p>
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
                          className={`max-w-[75%] rounded-lg px-3.5 py-2 text-sm leading-relaxed ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white text-neutral-900 border border-neutral-200 rounded-bl-none shadow-2xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-neutral-400 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-neutral-200 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
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
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-500">
              <UserIcon className="w-12 h-12 text-neutral-300 mb-3" />
              <p className="text-sm font-medium text-neutral-700">Aucune conversation sélectionnée</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                Choisissez une conversation dans la colonne de gauche pour afficher l&apos;historique des échanges.
              </p>
            </div>
          )}
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
