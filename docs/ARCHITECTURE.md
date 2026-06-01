# RateQ Architecture

## Overview

RateQ is a **modular monolith** designed for a clean extraction path to microservices. Each NestJS feature module represents a bounded context with its own controllers, services, repositories, and DTOs.

```
┌─────────────────────────────────────────────────────────────┐
│                        RateQ API (NestJS)                    │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│    Auth     │   Users     │  Companies  │     Reviews       │
│  (identity) │  (profiles) │  (catalog)  │   (submissions)   │
├─────────────┴─────────────┴─────────────┴───────────────────┤
│                    Moderation (anti-abuse)                   │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure: Prisma · Redis · BullMQ · Throttler        │
└─────────────────────────────────────────────────────────────┘
```

## Layering (per module)

| Layer | Responsibility |
|-------|----------------|
| **Controller** | HTTP routing, Swagger docs, auth guards |
| **Service** | Business rules, orchestration |
| **Repository** | Data access via Prisma (no business logic) |
| **DTO** | Input validation (`class-validator`) |

## Shared packages

| Package | Purpose |
|---------|---------|
| `@rateq/types` | Domain enums and API contracts (frontend + backend) |
| `@rateq/utils` | Pure functions (slugify, Levenshtein similarity) |
| `@rateq/config` | ESLint, TypeScript, Tailwind presets |
| `@rateq/ui` | Shared React components (web) |

## Database

PostgreSQL via Prisma. Key design decisions:

- **Never store raw IPs** — `hashed_ip` uses `sha256(ip + IP_HASH_SECRET)`
- **Review status workflow** — `PENDING` → `APPROVED` / `REJECTED`
- **Denormalized company stats** — `rating_average`, `review_count` updated on approval
- **Auth support tables** — refresh tokens, email verification, password reset (phase 5)

## Async processing

Review submissions trigger a BullMQ job on `review-moderation` queue (phase 8–9):

1. Rate limit check (Redis)
2. Velocity / fingerprint / similarity scoring
3. Status assignment
4. Company rating recalculation
5. Moderation log persistence

## Future microservice boundaries

| Service | Extract from |
|---------|--------------|
| `identity-service` | `auth`, `users` |
| `company-service` | `companies` |
| `review-service` | `reviews` |
| `moderation-service` | `moderation` + BullMQ workers |

Shared `@rateq/types` becomes an npm package or protobuf contracts at extraction time.

## Authentication (phase 5)

| Endpoint | Access | Description |
|----------|--------|-------------|
| `POST /auth/register` | Public | Create account (USER or COMPANY role) |
| `POST /auth/login` | Public | Issue JWT + refresh token |
| `POST /auth/refresh` | Public | Rotate refresh token |
| `POST /auth/logout` | Bearer | Revoke session(s) |
| `GET /auth/me` | Bearer | Current user profile |
| `POST /auth/verify-email` | Public | Confirm email via token |
| `POST /auth/resend-verification` | Bearer | Resend verification email |
| `POST /auth/forgot-password` | Public | Request reset link (no email enumeration) |
| `POST /auth/reset-password` | Public | Set new password via token |

- Access tokens: JWT (`JWT_ACCESS_SECRET`), 15m default
- Refresh tokens: opaque, SHA-256 hashed in `refresh_tokens` table, rotated on refresh
- Verification/reset tokens: opaque, SHA-256 hashed, never stored raw
- Global `JwtAuthGuard` + `@Public()` decorator; `RolesGuard` for RBAC

## Users (phase 6)

| Endpoint | Access | Description |
|----------|--------|-------------|
| `GET /users/me/profile` | Bearer | Full profile (review count, timestamps) |
| `PATCH /users/me/password` | Bearer | Change password, revokes all sessions |
| `GET /users` | Admin | Paginated list (`role`, `isVerified`, `search`) |
| `GET /users/:id` | Admin | User detail |
| `PATCH /users/:id` | Admin | Update `role`, `isVerified` |
| `DELETE /users/:id` | Admin | Delete user (protects last admin) |

`GET /auth/me` remains a lightweight session check; use `/users/me/profile` for full profile data.

## Companies (phase 7)

| Endpoint | Access | Description |
|----------|--------|-------------|
| `GET /companies` | Public | Search with `query`, `country`, `city`, `minRating`, `sort` |
| `GET /companies/:slug` | Public | Public profile page data |
| `POST /companies` | Company (verified) | Register business (one per owner) |
| `GET /companies/me/profile` | Company | Owned company detail |
| `GET /companies/me/dashboard` | Company | Stats: reviews by status, rating |
| `PATCH /companies/me` | Company | Update owned profile (slug updates with name) |
| `PATCH /companies/:id` | Admin | Update any company |
| `DELETE /companies/:id` | Admin | Delete company |

Sort options: `rating` (default), `reviews`, `newest`, `name`.

## Reviews (phase 8)

| Endpoint | Access | Description |
|----------|--------|-------------|
| `POST /reviews` | Verified user | Submit review → BullMQ moderation |
| `GET /reviews/company/:companyId` | Public | Approved reviews only |
| `GET /reviews/company/:companyId/manage` | Company owner | All statuses + filter |
| `GET /reviews/me` | Bearer | Current user's reviews |
| `POST /reviews/:reviewId/reply` | Company owner | Reply to approved review (one per review) |

### Moderation flow

1. Review created as `PENDING`
2. Job `review-moderation` runs scoring (new account, velocity, fingerprint, similarity)
3. Score ≥ threshold → stays `PENDING`; else `AUTO_APPROVED`
4. On approve: recalculate `company.rating_average` / `review_count`, increment `user.review_count`

### Admin moderation

| Endpoint | Description |
|----------|-------------|
| `GET /moderation/reviews/pending` | Flagged queue |
| `PATCH /moderation/reviews/:id/approve` | Manual approve |
| `PATCH /moderation/reviews/:id/reject` | Manual reject |
| `GET /moderation/reviews/:id/logs` | Audit trail |

## Mobile (phase 12)

Expo app at `apps/mobile` — Expo Router, NativeWind, i18next (EN/AR + RTL).

| Screen | Route | Description |
|--------|-------|-------------|
| Companies | `(tabs)/` | Search & list |
| Profile | `(tabs)/profile` | Account, reviews, language toggle |
| Auth | `(auth)/login`, `(auth)/register` | JWT via SecureStore |
| Company | `company/[slug]` | Detail + reviews |
| Review | `review/[companyId]` | Submit review |

EAS: `cd apps/mobile && eas build --profile production --platform all`

## API conventions

- Base path: `/api/v1`
- Response envelope: `{ data: T }` via `TransformInterceptor`
- Errors: `{ statusCode, message, timestamp, path }`
- Swagger: `/docs` when `SWAGGER_ENABLED=true`

## Environment

Validated at boot via `validateEnv()` — misconfiguration fails fast before accepting traffic.
