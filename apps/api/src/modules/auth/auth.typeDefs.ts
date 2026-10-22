export const authTypeDefs = `#graphql
  enum UserRole {
    STUDENT
    LANDLORD
    AGENT
    ADMIN
  }

  enum Campus {
    YOUSSOUFIA
    SAFI
    NADOR
  }

  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    role: UserRole!
    campus: Campus!
    phone: String
    avatarUrl: String
    bio: String
    isEmailVerified: Boolean!
    isVerified: Boolean!
    agencyName: String
    agencyFeeDetails: String
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    user: User!
    accessToken: String!
    refreshToken: String!
  }

  type RefreshTokenPayload {
    accessToken: String!
  }

  type GenericResponse {
    success: Boolean!
    message: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    role: UserRole
    campus: Campus!
    phone: String
    agencyName: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateProfileInput {
    firstName: String
    lastName: String
    campus: Campus
    phone: String
    bio: String
    agencyName: String
    agencyFeeDetails: String
  }

  extend type Query {
    me: User
  }

  extend type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refreshToken(refreshToken: String!): RefreshTokenPayload!
    logout(refreshToken: String!): Boolean!
    verifyEmail(token: String!): Boolean!
    requestPasswordReset(email: String!): GenericResponse!
    resetPassword(token: String!, newPassword: String!): Boolean!
    updateProfile(input: UpdateProfileInput!): User!
  }
`;
