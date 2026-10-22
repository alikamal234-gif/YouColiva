export const roommateTypeDefs = `#graphql
  enum RoommateGenderPreference {
    ANY
    MALE
    FEMALE
  }

  enum RoommatePostStatus {
    OPEN
    CLOSED
  }

  type RoommatePost {
    id: ID!
    author: User!
    title: String!
    description: String!
    campus: Campus!
    budgetMax: Float!
    targetMoveInDate: String!
    preferredRoommateGender: RoommateGenderPreference!
    status: RoommatePostStatus!
    lifestyleHabits: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  type RoommatePostQueryResult {
    items: [RoommatePost!]!
    total: Int!
  }

  input CreateRoommatePostInput {
    title: String!
    description: String!
    campus: Campus!
    budgetMax: Float!
    targetMoveInDate: String!
    preferredRoommateGender: RoommateGenderPreference
    lifestyleHabits: [String!]
  }

  input UpdateRoommatePostInput {
    id: ID!
    title: String
    description: String
    campus: Campus
    budgetMax: Float
    targetMoveInDate: String
    preferredRoommateGender: RoommateGenderPreference
    lifestyleHabits: [String!]
    status: RoommatePostStatus
  }

  input RoommatePostFilterInput {
    campus: Campus
    budgetMax: Float
    preferredRoommateGender: RoommateGenderPreference
    status: RoommatePostStatus
    limit: Int
    offset: Int
  }

  extend type Query {
    roommatePost(id: ID!): RoommatePost
    roommatePosts(filter: RoommatePostFilterInput): RoommatePostQueryResult!
  }

  extend type Mutation {
    createRoommatePost(input: CreateRoommatePostInput!): RoommatePost!
    updateRoommatePost(input: UpdateRoommatePostInput!): RoommatePost!
    deleteRoommatePost(id: ID!): Boolean!
  }
`;
