# RateQ

Bilingual (Arabic + English) review platform — Trustpilot-style MVP.

## Monorepo structure

```
apps/
  api/      NestJS + Prisma + PostgreSQL + Redis + BullMQ
  web/      Next.js 15 (App Router)
  mobile/   Expo React Native
packages/
  config/   Shared ESLint, TypeScript, Tailwind presets
  types/    Shared domain types and enums
  utils/    Shared utilities
  ui/       Shared UI components (web)
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+
- Redis 7+

## Quick start

```bash
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env

pnpm db:generate
pnpm db:migrate
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development |
| `pnpm --filter @rateq/web dev` | Web only (http://localhost:3000) |
| `pnpm --filter @rateq/api dev` | API only (http://localhost:4000) |
| `pnpm --filter @rateq/mobile dev` | Expo mobile (scan QR or simulator) |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint entire monorepo |
| `pnpm test` | Run all unit tests |
| `pnpm test:cov` | API test coverage report |
| `pnpm db:migrate` | Run Prisma migrations |

## Documentation

See `docs/ARCHITECTURE.md` for backend modular monolith design and migration path to microservices.
