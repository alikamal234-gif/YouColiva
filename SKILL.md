# YouColiva — Project Skill

## Mission

Build **YouColiva**, a housing and roommate-finding platform for the YouCode community. It serves current and prospective learners connected to the Youssoufia, Safi, and Nador campuses. Users can find rental houses/rooms, find roommates, contact landlords or real-estate agents, and manage housing listings.

Work in this order:
1. **API first** — Express, Node.js, TypeScript, MongoDB/Mongoose, GraphQL/Apollo, authentication, authorization, validation, tests.
2. **Web second** — Next.js, TypeScript, Tailwind CSS, responsive and accessible UX; consume the API.
3. **Mobile third** — React Native with Expo and TypeScript; consume the same API. Do not duplicate backend business logic in the mobile app.

Do not skip ahead to web or mobile until the API foundations and documented API contract are working.

## Product principles

- The product is specifically for the YouCode community and the three campuses: Youssoufia, Safi, Nador.
- Support four roles: `STUDENT`, `LANDLORD`, `AGENT`, `ADMIN`.
- Students can be current learners or prospective learners. Do not claim that an email alone proves YouCode affiliation unless an official domain and verification policy have been confirmed.
- Make it clear which profiles and listings have been verified. Never represent an unverified user or listing as verified.
- Housing listings and roommate-search posts are distinct concepts: a user can seek a roommate without owning a property.
- Never expose a home's exact address publicly by default. Store coordinates securely and display an approximate location to visitors; disclose exact details only through an explicitly authorized flow.
- No payment processing is required for the initial MVP unless explicitly requested.
- Never invent API keys, credentials, real listings, phone numbers, or verification status. Use clearly labeled development seed data only.

## Required technology

### Monorepo
- `pnpm` workspaces
- Turborepo
- TypeScript throughout
- ESLint and Prettier
- Shared packages for types, validation, and GraphQL operations where practical

### API
- Node.js, Express, TypeScript
- Apollo Server with GraphQL
- MongoDB and Mongoose
- Zod for environment and input validation
- Argon2 or bcrypt for password hashing
- Short-lived access JWTs and a secure refresh-session strategy
- Email verification and password-reset flows using a provider configured through environment variables
- Google OAuth, implemented after basic email/password authentication is stable
- Socket.IO for real-time chat, authenticated with the same session system
- Vitest or Jest and Supertest for tests
- Structured logging, request IDs, central error handling, rate limits, security headers, CORS allowlist, and graceful shutdown

### Web
- Next.js App Router, TypeScript
- Tailwind CSS
- Accessible component primitives where needed; avoid adding a large UI library without a reason
- Apollo Client or another consistent GraphQL client
- Leaflet + OpenStreetMap for maps, subject to tile-provider usage policies
- Responsive layouts and semantic HTML

### Mobile
- React Native with Expo and TypeScript
- Expo Router
- Apollo Client (or the same chosen GraphQL client with a well-defined setup)
- Socket.IO client for chat
- Expo-compatible authentication and secure token/session storage
- Reuse shared TypeScript types and validation when compatible; do not import web-only code into mobile

## Visual design and UX

### Brand
Product name: **YouColiva**.

Use a clean, confident, student-friendly visual identity inspired by the blue accents and simplicity of the YouCode website. Do not copy YouCode's logo, assets, or exact design system unless permission is available.

### Web design rules
- Default page background: **white** (`#FFFFFF`).
- Primary blue: use a restrained, accessible blue such as `#2563EB`; dark blue for headings/hover states as appropriate.
- Use dark neutral text (`#111827`) and muted neutral text (`#6B7280`).
- Use thin, subtle neutral separators only when they improve structure (`#E5E7EB`).
- Blue should be used for primary actions, links, focus indicators, selected states, and small accents—not as a giant colored background.
- Avoid repeated bordered panels, nested cards, colored background blocks, gradients, glassmorphism, oversized rounded cards, and generic AI-generated landing-page patterns.
- Do not use emojis in the product UI. Use a consistent icon library (e.g. Lucide) only when an icon improves clarity.
- Avoid unnecessary decoration. Use whitespace, typography, alignment, and clear hierarchy to establish structure.
- Keep content widths readable and align sections consistently.
- Prefer plain page sections and restrained dividers over wrapping every element in a card.
- Use natural, specific copy. Avoid generic phrases such as “Revolutionize your experience.”
- Avoid fake testimonials, invented metrics, placeholder social proof, or fake availability counts.
- Respect reduced-motion preferences. Animation should be minimal and functional.
- Ensure keyboard navigation, visible focus, labels, contrast, error messages, and screen-reader-friendly semantics.
- Mobile UX must use native conventions: touch targets, safe areas, keyboard-aware forms, accessible labels, and clear loading/error states.

### UX expectations for every page
Every page must define:
1. Purpose and primary user task.
2. Loading state.
3. Empty state with a useful next step.
4. Error state with retry or recovery where possible.
5. Validation and success feedback for forms.
6. Responsive behavior.
7. Authentication and role restrictions, where applicable.
8. Accessibility requirements.
9. Relevant navigation back to the user's task.

Do not build pages that look polished but have nonfunctional controls. Every visible button, filter, link, form, map marker, and menu item must have a real behavior or be clearly marked as unavailable during development.

## Core user flows and pages

### Public / discovery
- Home page with selected campus, search, featured/recent listings only when backed by real data, and a map/list toggle.
- Campus selector for Youssoufia, Safi, and Nador. Persist a chosen campus in the user profile when signed in and locally when signed out.
- Rental search with filters: campus/city, neighborhood, price range (MAD), property type, room count, furnished status, available places, and approximate distance to campus.
- Map with listing markers and a corresponding result list. Selecting a marker opens the matching listing preview.
- Listings page with pagination or cursor-based loading, sorting, and filter reset.
- Listing detail page: image gallery, price/month, description, facilities, property type, room/bathroom count where applicable, maximum capacity, available places, availability date, approximate location, owner/agent profile, and contact actions.
- Roommate search page with separate filters: campus/city, budget, desired move-in date, and short description.
- Roommate post detail page.
- Public user/agent profile with only privacy-approved information.
- Sign up, sign in, verify email, request password reset, reset password, and OAuth callback pages.
- Legal pages: terms, privacy policy, and community/safety guidance. Mark legal text for review before launch.

### Signed-in student
- Edit profile and campus.
- Save/remove favorites.
- Create/edit/close a roommate-search post.
- Start a conversation about a listing or roommate post.
- Manage conversations and messages.
- Report a listing or user and block a user.

### Landlord / agent
- Create, edit, preview, publish/submit for review, mark rented, archive, and delete own listings.
- Upload, reorder, and remove listing photos through a safe upload service.
- Set price in MAD, capacity, available places, amenities, neighborhood, approximate/public coordinates, and private exact address.
- See status and moderation feedback for each listing.
- Agent profile can disclose agency name and any fees transparently.
- Enforce server-side ownership checks for every write operation.

### Admin
- Dashboard with meaningful metrics calculated from actual data.
- Review users, listings, and reports.
- Approve, reject, hide, or suspend with an audit trail and reason.
- Manage campus configuration and moderation states.
- Apply role and status changes only through protected server-side operations.

### Contact
- In-app chat.
- Optional WhatsApp deep link and telephone link when the user explicitly provides and permits the contact details.
- Never fabricate contact details. Use safe URL construction and user confirmation before external actions where appropriate.

## API-first implementation plan

Complete the following milestones in order. For each milestone, implement the code, explain important files, run available checks/tests, and summarize what works and what remains. Do not claim a test passed unless it was actually run and passed.

### API milestone A — foundation
1. Create the monorepo root, `pnpm-workspace.yaml`, `turbo.json`, root scripts, TypeScript base config, ESLint/Prettier config, `.gitignore`, `.env.example`, and README.
2. Create `apps/api` with Express, Apollo Server, MongoDB connection, configuration validation, `/health` endpoint, GraphQL health query, structured error handling, and graceful shutdown.
3. Add scripts for `dev`, `build`, `start`, `lint`, `typecheck`, and `test`.
4. Document local setup and safe environment-variable handling.

### API milestone B — domain models
Implement Mongoose models and indexes for:
- User
- Listing
- RoommatePost
- Conversation
- Message
- Favorite
- Report
- RefreshSession or equivalent session store
- EmailVerificationToken and PasswordResetToken (store hashed tokens and expire them)

Use enums for roles, campus, listing type, listing status, verification status, and moderation status. Add timestamps. Validate all external input. Use indexes for frequent filters and a `2dsphere` index where geo-search is implemented.

### API milestone C — authentication and authorization
- Register and login with email/password.
- Normalize email and enforce uniqueness.
- Hash passwords; never store plaintext passwords.
- Verify email and resend verification with rate limits.
- Forgot/reset password with single-use, expiring tokens.
- Logout and revoke refresh sessions.
- Google OAuth only after the basic flow is tested.
- Use secure, HttpOnly, SameSite cookies for browser sessions where appropriate; use a mobile-compatible secure session strategy for Expo.
- Do not put long-lived bearer tokens in localStorage.
- Add role-based and ownership authorization in resolvers/services, not only in the UI.
- Avoid user enumeration in authentication responses.
- Add rate limiting and security tests.

### API milestone D — listings and search
- Listing CRUD with ownership and admin overrides.
- Search filters, sort, pagination, and validation.
- Safe image-upload integration via signed uploads or a backend-approved upload flow; secrets remain server-side.
- Public approximate location; protected exact address.
- Status transitions and moderation.
- Unit/integration tests for permissions, filters, and edge cases.

### API milestone E — roommate posts
- Separate model and GraphQL operations.
- Create/update/close own post.
- Search by campus, budget, date, and status.
- Do not conflate a roommate post with a property listing.

### API milestone F — chat, favorites, reports
- Conversation membership authorization.
- Message pagination and real-time delivery through authenticated Socket.IO.
- Verify a user is a conversation participant before reading/sending messages.
- Favorite/unfavorite.
- Report listing/user, block user, and admin review.
- Prevent unauthorized access through guessed IDs.

### API milestone G — hardening
- Tests for authentication, authorization, validation, ownership, chat membership, and privacy.
- Request size limits, rate limiting, security headers, CORS allowlist, GraphQL query depth/complexity protections as appropriate.
- Production logging without passwords, tokens, private addresses, or message contents.
- Document backup/restore, deployment, migrations/index creation, and operational health checks.

## API design conventions

- Keep business logic in services, not directly in resolvers.
- Keep GraphQL schema/resolvers organized by domain module.
- Use a consistent error format; never expose stack traces or database internals in production.
- Validate input at boundaries.
- Return only fields appropriate for the current user and authorization context.
- Add pagination for listings, messages, and admin tables.
- Use explicit enum values and consistent naming.
- Use transactions only where supported and necessary; document MongoDB deployment requirements.
- Store times as UTC dates and display local time appropriately.
- Keep secrets in environment variables and document every required variable in `.env.example` with placeholder values only.

## Web implementation plan (after API foundation)

1. Create the Next.js app and shared packages.
2. Implement API client, auth/session integration, route protection, error handling, and typed operations.
3. Build the shared layout, header, campus selector, search form, footer, and responsive navigation.
4. Build home/discovery, search results, map/list, listing detail, and roommate search.
5. Build authentication and account pages.
6. Build dashboards and listing/roommate forms by role.
7. Build conversations and real-time chat.
8. Build favorites, reports, and admin moderation.
9. Add accessibility, loading/empty/error states, responsive testing, and end-to-end tests.

Use real API data. If backend work is incomplete, show a clear development state instead of silently substituting fake content.

## Mobile implementation plan (only after web and API contract are stable)

1. Create `apps/mobile` using Expo and React Native with TypeScript and Expo Router.
2. Configure API endpoint selection for local development, staging, and production.
3. Configure authentication securely for mobile; do not assume browser cookies work identically in native networking.
4. Build native screens for campus selection, discovery, search/filter, map/list, listing details, roommate posts, profile, favorites, chat, and listing management.
5. Reuse the same backend GraphQL API and authorized Socket.IO service.
6. Use native navigation, safe areas, keyboard-aware forms, accessible touch targets, pull-to-refresh where useful, and robust offline/error states.
7. Test on Android and iOS simulators/devices as available.
8. Never call the database directly from mobile.

## Quality gates

Before considering a milestone complete:
- Run lint, typecheck, tests, and build where scripts exist.
- Check environment validation and startup failure behavior.
- Verify authorization at the API, not just in the UI.
- Verify loading, empty, error, success, and validation states.
- Verify keyboard and mobile layouts.
- Verify no secrets or real personal data are committed.
- Update README and `.env.example`.
- State any unverified external configuration honestly.

## Collaboration protocol

- Work file by file and explain each important file in French or Moroccan Darija, matching the user's language.
- Keep answers practical and structured.
- Before writing a large batch, give the implementation plan and folder tree.
- Then implement in small, runnable milestones, starting with the API.
- Do not generate all layers in one giant untested dump.
- Do not import requirements or code from unrelated projects or other chats.
- Ask a question only when a missing decision blocks implementation; otherwise choose a sensible secure default and document it.
- When the user says “next”, continue from the next unfinished milestone without repeating completed work.
- Never claim deployment, tests, domain availability, OAuth, email delivery, or uploads work unless actually configured and verified.

## Initial task

Start now with **API milestone A**. Present the proposed monorepo structure and exact setup commands, then implement the root workspace configuration and the first runnable Express + Apollo GraphQL API backed by MongoDB. Include a health endpoint and a GraphQL health query, environment validation, clear error handling, and setup instructions. Keep web and mobile out of this first milestone.
