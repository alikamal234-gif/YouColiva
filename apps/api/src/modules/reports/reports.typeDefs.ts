export const reportsTypeDefs = `#graphql
  enum ReportTargetType {
    LISTING
    USER
    ROOMMATE_POST
  }

  enum ReportStatus {
    PENDING
    INVESTIGATING
    RESOLVED
    DISMISSED
  }

  type Report {
    id: ID!
    reporter: User!
    targetType: ReportTargetType!
    targetId: ID!
    reason: String!
    details: String
    status: ReportStatus!
    actionTaken: String
    createdAt: String!
    updatedAt: String!
  }

  input CreateReportInput {
    targetType: ReportTargetType!
    targetId: ID!
    reason: String!
    details: String
  }

  extend type Query {
    reports(status: ReportStatus): [Report!]!
  }

  extend type Mutation {
    createReport(input: CreateReportInput!): Report!
    resolveReport(id: ID!, status: ReportStatus!, actionTaken: String!): Report!
  }
`;
