import { ChatService } from './chat.service.js';
import type { IConversation } from '../../models/conversation.model.js';
import type { IMessage } from '../../models/message.model.js';
import type { GraphQLContext } from '../../graphql/context.js';
import { AppError } from '../../errors/app-error.js';

export const chatResolvers = {
  Conversation: {
    id: (parent: IConversation) => parent._id.toString(),
    lastMessageAt: (parent: IConversation) =>
      parent.lastMessageAt ? parent.lastMessageAt.toISOString() : parent.createdAt.toISOString(),
  },

  Message: {
    id: (parent: IMessage) => parent._id.toString(),
    conversationId: (parent: IMessage) => parent.conversationId.toString(),
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
