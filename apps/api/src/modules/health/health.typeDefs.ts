export const healthTypeDefs = `#graphql
  type DatabaseHealth {
    status: String!
    readyState: Int!
    latencyMs: Float
  }

  type HealthStatus {
    status: String!
    uptime: Float!
    timestamp: String!
    environment: String!
    database: DatabaseHealth!
  }

  extend type Query {
    health: HealthStatus!
  }
`;
