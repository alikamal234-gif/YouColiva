export const chatTypeDefs = `#graphql
  type Message {
    id: ID!
    conversationId: ID!
    sender: User!
    content: String!
    createdAt: String!
    updatedAt: String!
  }

  type Conversation {
    id: ID!
    participants: [User!]!
    listingId: ID
    roommatePostId: ID
    lastMessage: String
    lastMessageAt: String!
    createdAt: String!
    updatedAt: String!
  }

  type MessageQueryResult {
    items: [Message!]!
    total: Int!
  }

  extend type Query {
    myConversations: [Conversation!]!
    conversationMessages(
      conversationId: ID!
      limit: Int
      offset: Int
    ): MessageQueryResult!
  }

  extend type Mutation {
    getOrCreateConversation(
      recipientId: ID!
      listingId: ID
      roommatePostId: ID
    ): Conversation!
    sendMessage(conversationId: ID!, content: String!): Message!
  }
`;
