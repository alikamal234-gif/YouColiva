import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  Circle,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { fetchGraphQLMobile } from '../../src/lib/api-client';
import { COLORS } from '../../src/constants/theme';
import type { Message } from '../../src/types/index';

function formatMessageTime(dateString?: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    conversationId?: string;
    recipientName?: string;
    recipientRole?: string;
    isVerified?: string;
  }>();

  const conversationId = params.conversationId || params.id;
  const recipientName = params.recipientName || 'Interlocuteur YouCode';
  const recipientRole = params.recipientRole || 'STUDENT';
  const isVerified = params.isVerified === 'true';

  const { user, token } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      if (token && !conversationId.startsWith('conv_')) {
        const query = `
          query MobileGetMessages($conversationId: ID!) {
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
        const data = await fetchGraphQLMobile<{
          conversationMessages: { items: Message[] };
        }>(query, { conversationId }, token);

        if (data.conversationMessages?.items && data.conversationMessages.items.length > 0) {
          setMessages(data.conversationMessages.items);
          return;
        }
      }

      // Initial friendly greeting preview
      setMessages([
        {
          id: 'welcome_msg_1',
          conversationId,
          content: `Bonjour ! Merci de m'avoir contacté via YouColiva. Comment puis-je vous aider ?`,
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          sender: {
            id: 'recipient_id',
            firstName: recipientName.split(' ')[0] || 'Contact',
            lastName: recipientName.split(' ')[1] || '',
            role: recipientRole as any,
          },
        },
      ]);
    } catch {
      setMessages([
        {
          id: 'fallback_msg_1',
          conversationId,
          content: `Bonjour ! Merci de m'avoir contacté via YouColiva.`,
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          sender: {
            id: 'recipient_id',
            firstName: recipientName.split(' ')[0] || 'Contact',
            lastName: recipientName.split(' ')[1] || '',
            role: recipientRole as any,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, recipientName, recipientRole, token]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    const tempMessage: Message = {
      id: `local_${Date.now()}`,
      conversationId,
      content: trimmed,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || 'my_id',
        firstName: user?.firstName || 'Moi',
        lastName: user?.lastName || '',
        role: user?.role || 'STUDENT',
      },
    };

    // Optimistic UI append
    setMessages((prev) => [...prev, tempMessage]);
    setInputText('');
    setSending(true);

    try {
      if (token && !conversationId.startsWith('conv_')) {
        const mutation = `
          mutation MobileSendMessage($conversationId: ID!, $content: String!) {
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
        const data = await fetchGraphQLMobile<{ sendMessage: Message }>(
          mutation,
          { conversationId, content: trimmed },
          token
        );

        if (data.sendMessage) {
          // Replace temp message with server response
          setMessages((prev) =>
            prev.map((m) => (m.id === tempMessage.id ? data.sendMessage : m))
          );
        }
      }
    } catch {
      // Kept optimistic message
    } finally {
      setSending(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const initial = recipientName ? recipientName.charAt(0).toUpperCase() : 'U';

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMine = item.sender.id === user?.id || item.id.startsWith('local_');

    return (
      <View style={[styles.messageRow, isMine ? styles.myMessageRow : styles.otherMessageRow]}>
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.otherMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isMine ? styles.myMessageTime : styles.otherMessageTime]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Chat Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.navRecipient}>
          <View style={styles.recipientAvatar}>
            <Text style={styles.recipientAvatarText}>{initial}</Text>
          </View>

          <View style={styles.recipientMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.recipientNameText} numberOfLines={1}>
                {recipientName}
              </Text>
              {isVerified && (
                <ShieldCheck size={14} color={COLORS.primary} style={{ marginLeft: 3 }} />
              )}
            </View>

            <View style={styles.statusRow}>
              <Circle size={7} fill="#10B981" color="#10B981" />
              <Text style={styles.statusText}>En ligne • YouCode</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Messages Feed */}
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Bottom Input Field */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Écrivez un message..."
            placeholderTextColor={COLORS.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  navBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  navBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
  },
  navRecipient: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recipientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  recipientAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  recipientMeta: {
    marginLeft: 10,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  flexContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loadingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContent: {
    padding: 16,
    gap: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  otherMessageTime: {
    color: COLORS.textLight,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.borderDark,
  },
});
