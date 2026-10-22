export const favoritesTypeDefs = `#graphql
  type Favorite {
    id: ID!
    listing: Listing!
    createdAt: String!
  }

  type ToggleFavoriteResult {
    favorited: Boolean!
  }

  extend type Query {
    myFavorites: [Favorite!]!
    isListingFavorited(listingId: ID!): Boolean!
  }

  extend type Mutation {
    toggleFavorite(listingId: ID!): ToggleFavoriteResult!
  }
`;
