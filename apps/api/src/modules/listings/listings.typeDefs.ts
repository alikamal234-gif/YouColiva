export const listingsTypeDefs = `#graphql
  enum PropertyType {
    ROOM
    STUDIO
    APARTMENT
    HOUSE
  }

  enum ListingStatus {
    DRAFT
    PENDING_REVIEW
    PUBLISHED
    RENTED
    ARCHIVED
  }

  enum ModerationStatus {
    PENDING
    APPROVED
    REJECTED
    FLAGGED
  }

  type Coordinates {
    longitude: Float!
    latitude: Float!
  }

  type Listing {
    id: ID!
    owner: User!
    title: String!
    description: String!
    campus: Campus!
    neighborhood: String!
    location: Coordinates!
    exactAddress: String
    pricePerMonth: Float!
    propertyType: PropertyType!
    roomCount: Int!
    bathroomCount: Int!
    maxCapacity: Int!
    availablePlaces: Int!
    furnished: Boolean!
    amenities: [String!]!
    images: [String!]!
    status: ListingStatus!
    moderationStatus: ModerationStatus!
    moderationReason: String
    availableFrom: String!
    createdAt: String!
    updatedAt: String!
  }

  type ListingQueryResult {
    items: [Listing!]!
    total: Int!
  }

  input CoordinatesInput {
    longitude: Float!
    latitude: Float!
    maxDistanceMeters: Float
  }

  input CreateListingInput {
    title: String!
    description: String!
    campus: Campus!
    neighborhood: String!
    longitude: Float!
    latitude: Float!
    exactAddress: String!
    pricePerMonth: Float!
    propertyType: PropertyType!
    roomCount: Int
    bathroomCount: Int
    maxCapacity: Int
    availablePlaces: Int
    furnished: Boolean
    amenities: [String!]
    images: [String!]
    availableFrom: String
  }

  input UpdateListingInput {
    id: ID!
    title: String
    description: String
    campus: Campus
    neighborhood: String
    longitude: Float
    latitude: Float
    exactAddress: String
    pricePerMonth: Float
    propertyType: PropertyType
    roomCount: Int
    bathroomCount: Int
    maxCapacity: Int
    availablePlaces: Int
    furnished: Boolean
    amenities: [String!]
    images: [String!]
    status: ListingStatus
    availableFrom: String
  }

  input ListingFilterInput {
    campus: Campus
    neighborhood: String
    priceMin: Float
    priceMax: Float
    propertyType: PropertyType
    roomCountMin: Int
    furnished: Boolean
    availablePlacesMin: Int
    status: ListingStatus
    near: CoordinatesInput
    limit: Int
    offset: Int
  }

  extend type Query {
    listing(id: ID!): Listing
    listings(filter: ListingFilterInput): ListingQueryResult!
  }

  extend type Mutation {
    createListing(input: CreateListingInput!): Listing!
    updateListing(input: UpdateListingInput!): Listing!
    deleteListing(id: ID!): Boolean!
    moderateListing(id: ID!, status: ModerationStatus!, reason: String): Listing!
  }
`;
