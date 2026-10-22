import { ChatService } from './chat.service.js';
import type { IConversation } from '../../models/conversation.model.js';
import type { IMessage } from '../../models/message.model.js';
import type { GraphQLContext } from '../../graphql/context.js';
import { AppError } from '../../errors/app-error.js';

export const chatResolvers = {
  Conversation: {
    id: (parent: IConversation) => parent._id.toString(),
    listingId: (parent: IConversation) => {
      if (!parent.listingId) return null;
      if (typeof parent.listingId === 'object' && '_id' in (parent.listingId as unknown as Record<string, unknown>)) {
        return (parent.listingId as unknown as { _id: { toString(): string } })._id.toString();
      }
      return parent.listingId.toString();
    },
    roommatePostId: (parent: IConversation) => {
      if (!parent.roommatePostId) return null;
      if (typeof parent.roommatePostId === 'object' && '_id' in (parent.roommatePostId as unknown as Record<string, unknown>)) {
        return (parent.roommatePostId as unknown as { _id: { toString(): string } })._id.toString();
      }
      return parent.roommatePostId.toString();
    },
    lastMessageAt: (parent: IConversation) => {
      const d = parent.lastMessageAt || parent.createdAt;
      return d ? new Date(d).toISOString() : new Date().toISOString();
    },
    createdAt: (parent: IConversation) =>
      parent.createdAt ? new Date(parent.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: (parent: IConversation) =>
      parent.updatedAt ? new Date(parent.updatedAt).toISOString() : new Date().toISOString(),
  },

  Message: {
    id: (parent: IMessage) => parent._id.toString(),
    conversationId: (parent: IMessage) => parent.conversationId.toString(),
    createdAt: (parent: IMessage) =>
      parent.createdAt ? new Date(parent.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: (parent: IMessage) =>
      parent.updatedAt ? new Date(parent.updatedAt).toISOString() : new Date().toISOString(),
  },

  Query: {
    myConversations: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to view conversations');
      }
      return ChatService.getUserConversations(context.user);
    },

    conversationMessages: async (
      _parent: unknown,
      {
        conversationId,
        limit,
        offset,
      }: { conversationId: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to view messages');
      }
      return ChatService.getConversationMessages(conversationId, context.user, limit, offset);
    },
  },

  Mutation: {
    getOrCreateConversation: async (
      _parent: unknown,
      {
        recipientId,
        listingId,
        roommatePostId,
      }: { recipientId: string; listingId?: string; roommatePostId?: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to start a conversation');
      }
      return ChatService.getOrCreateConversation(recipientId, context.user, {
        listingId,
        roommatePostId,
      });
    },

    sendMessage: async (
      _parent: unknown,
      { conversationId, content }: { conversationId: string; content: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to send messages');
      }
      return ChatService.sendMessage(conversationId, content, context.user);
    },
  },
};
