# Testing

RateQ uses **Vitest** for shared packages and web utilities, and **Jest** for the NestJS API.

## Run all tests

```bash
pnpm test
```

## Per package

| Package | Command | Framework |
|---------|---------|-----------|
| `@rateq/utils` | `pnpm --filter @rateq/utils test` | Vitest |
| `@rateq/api` | `pnpm --filter @rateq/api test` | Jest |
| `@rateq/web` | `pnpm --filter @rateq/web test` | Vitest |

## Coverage (API)

```bash
pnpm test:cov
```

## What's tested

### `@rateq/utils`
- `slugify` / `withSlugSuffix` — URL slug generation (Latin + Arabic)
- `textSimilarityRatio` / Levenshtein — anti-abuse text similarity

### `@rateq/api`
- **Pagination** — meta calculation, skip offset
- **IP hashing** — deterministic SHA-256, never stores raw IPs
- **Token hashing** — secure token generation
- **ModerationEngineService** — scoring rules (new account, velocity, fingerprint, similarity)
- **AuthService** — register conflict, login validation
- **HealthService** — degraded status when DB down

### `@rateq/web`
- `cn()` utility — Tailwind class merging

## Conventions

- API unit tests: `*.spec.ts` next to source in `apps/api/src`
- API integration-style tests: `apps/api/test/*.e2e-spec.ts`
- Package tests: `*.test.ts` in `packages/*/src`
- Mock external deps (Prisma, Redis, email) — no live DB required for unit tests

## CI

```yaml
- run: pnpm install
- run: pnpm --filter @rateq/types build
- run: pnpm test
```
