import { healthTypeDefs } from '../modules/health/health.typeDefs.js';
import { healthResolvers } from '../modules/health/health.resolvers.js';
import { authTypeDefs } from '../modules/auth/auth.typeDefs.js';
import { authResolvers } from '../modules/auth/auth.resolvers.js';
import { listingsTypeDefs } from '../modules/listings/listings.typeDefs.js';
import { listingsResolvers } from '../modules/listings/listings.resolvers.js';
import { roommateTypeDefs } from '../modules/roommate/roommate.typeDefs.js';
import { roommateResolvers } from '../modules/roommate/roommate.resolvers.js';
import { chatTypeDefs } from '../modules/chat/chat.typeDefs.js';
import { chatResolvers } from '../modules/chat/chat.resolvers.js';
import { favoritesTypeDefs } from '../modules/favorites/favorites.typeDefs.js';
import { favoritesResolvers } from '../modules/favorites/favorites.resolvers.js';
import { reportsTypeDefs } from '../modules/reports/reports.typeDefs.js';
import { reportsResolvers } from '../modules/reports/reports.resolvers.js';
import { notificationsTypeDefs } from '../modules/notifications/notifications.typeDefs.js';
import { notificationsResolvers } from '../modules/notifications/notifications.resolvers.js';

const rootTypeDefs = `#graphql
  type Query {
    _version: String!
  }

  type Mutation {
    _version: String!
  }
`;

const rootResolvers = {
  Query: {
    _version: () => '1.0.0',
  },
  Mutation: {
    _version: () => '1.0.0',
  },
};

export const typeDefs = [
  rootTypeDefs,
  healthTypeDefs,
  authTypeDefs,
  listingsTypeDefs,
  roommateTypeDefs,
  chatTypeDefs,
  favoritesTypeDefs,
  reportsTypeDefs,
  notificationsTypeDefs,
];

export const resolvers = [
  rootResolvers,
  healthResolvers,
  authResolvers,
  listingsResolvers,
  roommateResolvers,
  chatResolvers,
  favoritesResolvers,
  reportsResolvers,
  notificationsResolvers,
];
