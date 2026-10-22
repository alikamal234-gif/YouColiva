# YouColiva

> Housing and roommate-finding platform for the **YouCode** community (campuses: **Youssoufia**, **Safi**, **Nador**).

---

## 🏛️ Monorepo Architecture

This project is organized as a high-performance monorepo managed with **pnpm workspaces** and **Turborepo**:

```text
YouColiva/
├── apps/
│   └── api/                  # Express + Apollo GraphQL API + MongoDB
├── packages/                 # Shared configurations and packages (types, validation)
├── package.json              # Monorepo root scripts & dev tools
├── pnpm-workspace.yaml       # Workspace definition
├── turbo.json                # Turborepo task pipelines
├── tsconfig.base.json        # Shared TypeScript strict configuration
├── .env.example              # Environment variables template
└── SKILL.md                  # Project master specification
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 20.x (Recommended: v22.x or v24.x)
- **pnpm**: >= 9.x or 10.x / 11.x
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or cloud MongoDB Atlas URI. _(For automated tests, `mongodb-memory-server` runs automatically without external dependencies)._

### Installation

```bash
# Install all dependencies across the monorepo
pnpm install
```

### Environment Setup

```bash
# Copy root env example or configure apps/api/.env
cp .env.example apps/api/.env
```

### Available Monorepo Scripts

Run from the root directory:

- `pnpm dev` — Start all applications in watch/development mode.
- `pnpm build` — Build all packages and applications via Turbo pipeline.
- `pnpm test` — Run all test suites across the monorepo.
- `pnpm typecheck` — Run TypeScript type checking (`tsc --noEmit`) in all workspaces.
- `pnpm lint` — Run ESLint checks across the monorepo.
- `pnpm format` — Format all code using Prettier.

---

## 📡 API Milestone A Status

- **Status**: Implemented & verified.
- **Components**:
  - Express HTTP server with security headers (`helmet`), CORS allowlist, request ID tracking, and structured logging.
  - Apollo Server v4 mounted at `/graphql`.
  - MongoDB connection lifecycle with auto-reconnect, status indicators, and clean disconnect.
  - Health check endpoint: `GET /health` (REST).
  - Health check query: `query { health { status uptime timestamp database { status latencyMs } } }` (GraphQL).
  - Zod-based environment validation on startup.
  - Graceful shutdown on `SIGINT` and `SIGTERM`.
