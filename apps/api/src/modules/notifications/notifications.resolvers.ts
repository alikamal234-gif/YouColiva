import { NotificationsService } from './notifications.service.js';
import type { INotification } from '../../models/notification.model.js';
import type { GraphQLContext } from '../../graphql/context.js';
import { AppError } from '../../errors/app-error.js';

export const notificationsResolvers = {
  Notification: {
    id: (parent: INotification) => parent._id.toString(),
    createdAt: (parent: INotification) => parent.createdAt.toISOString(),
  },

  Query: {
    myNotifications: async (
      _parent: unknown,
      { limit = 10, offset = 0 }: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to view notifications');
      }
      return NotificationsService.getUserNotifications(context.user.userId, limit, offset);
    },

    unreadNotificationsCount: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      if (!context.user) {
        return 0;
      }
      return NotificationsService.getUnreadCount(context.user.userId);
    },
  },

  Mutation: {
    markNotificationAsRead: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required');
      }
      return NotificationsService.markAsRead(id, context.user.userId);
    },

    markAllNotificationsAsRead: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required');
      }
      return NotificationsService.markAllAsRead(context.user.userId);
    },
  },
};
