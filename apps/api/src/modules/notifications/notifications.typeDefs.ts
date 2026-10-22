export const notificationsTypeDefs = `#graphql
  enum NotificationType {
    NEW_LISTING
    NEW_ROOMMATE_POST
    NEW_MESSAGE
    LISTING_MODERATED
    GENERAL
  }

  type Notification {
    id: ID!
    title: String!
    message: String!
    type: NotificationType!
    link: String
    isRead: Boolean!
    createdAt: String!
  }

  type NotificationFeed {
    items: [Notification!]!
    total: Int!
    unreadCount: Int!
    hasMore: Boolean!
  }

  extend type Query {
    myNotifications(limit: Int, offset: Int): NotificationFeed!
    unreadNotificationsCount: Int!
  }

  extend type Mutation {
    markNotificationAsRead(id: ID!): Notification!
    markAllNotificationsAsRead: Boolean!
  }
`;
