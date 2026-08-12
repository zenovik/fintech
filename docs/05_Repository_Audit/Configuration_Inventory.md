# Configuration Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · 2026-07-29

---

## Configuration Sources

| Source | Path | Purpose |
|--------|------|---------|
| Environment variables | `.env` (local, gitignored) | Runtime secrets and toggles |
| Example env | `.env.example`, `.env.production.example` | Template |
| Central env parser | `Backend_Fintech/src/app/config/env.ts` | Typed config object |
| Production validation | `Backend_Fintech/src/app/config/validate-env.ts` | Startup checks |
| HTTP security | `Backend_Fintech/src/app/config/http-security.ts` | Helmet, CORS, CSP |
| Frontend environments | `Frontend_Fintech/src/environments/` | API URL, production flag |
| Angular proxy | `Frontend_Fintech/proxy.conf.json` | Dev API proxy |
| Docker Compose env | `docker-compose.yml` `${VAR:-default}` | Container config |
| PM2 | `ecosystem.config.cjs` | Process env for production |
| Database platform config | `platform_settings`, `feature_flags` tables | Runtime DB-backed config |
| Feature flag routes | `feature_flag_api_routes` table | Per-route API toggles |

## Database-Backed Configuration

| Table / area | Service | API |
|--------------|---------|-----|
| feature_flags | platform-config.service | `/api/v1/settings/feature-flags` |
| platform_settings | settings.service | `/api/v1/settings/configuration` |
| smtp settings | settings.service | `/api/v1/settings/smtp` |
| rate limits | settings.service | `/api/v1/settings/rate-limits` |
| cache config | system-config.service | `/api/v1/system/cache-config` |
| backup config | system-config.service | `/api/v1/system/backup-config` |

## Secrets References (not values)

| Secret | Env var | Required prod |
|--------|---------|---------------|
| DB password | `DB_PASSWORD` | Yes |
| JWT access | `JWT_SECRET` | Yes |
| JWT refresh | `JWT_REFRESH_SECRET` | Yes |
| Config encryption | `CONFIG_ENCRYPTION_KEY` | Yes (validate-env) |
| AI keys | `GEMINI_API_KEY`, etc. | Optional |
| Redis | `REDIS_URL` | Optional if REDIS_ENABLED=false |

## Static Config Files

| File | Purpose |
|------|---------|
| `permissions.ts` | 144 RBAC permission codes |
| `payment-status.ts` | Payment state constants |
| `tsconfig*.json` | TypeScript compiler options |
| `angular.json` | Angular build budgets |
| `playwright.config.ts` | E2E config |
| `performance/config/*.js` | k6 profiles |

## Feature Flags

**Implementation:** Database table + middleware — not LaunchDarkly/unleash.

**Evidence:** `feature-flag.middleware.ts`, settings routes.

## Cross References

- Full env list: [Environment_Inventory.md](./Environment_Inventory.md)
- Architecture: [02_Architecture/Configuration_Model](../04_Solution_Design/Configuration_Model.md) — **NOT VERIFIED** file name exact
