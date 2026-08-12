# Environment Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · From env.ts + docker-compose · 2026-07-29

---

## Application Environment Variables

Source: `Backend_Fintech/src/app/config/env.ts`

| Variable | Required | Default | Category |
|----------|----------|---------|----------|
| `NODE_ENV` | No | development | Runtime |
| `PORT` | No | 3000 | Server |
| `CORS_ORIGIN` | No | http://localhost:4200 | Security |
| `DB_HOST` | No | localhost | Database |
| `DB_PORT` | No | 3306 | Database |
| `DB_NAME` | No | fintech_db | Database |
| `DB_USER` | No | fintech_user | Database |
| `DB_PASSWORD` | **Yes** | — | Database |
| `JWT_SECRET` | **Yes** | — | Auth |
| `JWT_EXPIRES_IN` | No | 15m | Auth |
| `JWT_REFRESH_SECRET` | **Yes** | — | Auth |
| `JWT_REFRESH_EXPIRES_IN` | No | 7d | Auth |
| `LOG_LEVEL` | No | info/debug | Logging |
| `APP_VERSION` | No | '' | Metadata |
| `APP_BUILD` | No | local | Metadata |
| `APP_COMMIT` | No | unknown | Metadata |
| `SESSION_IDLE_MINUTES` | No | 15 | Auth |
| `TRUST_DEVICE_DAYS` | No | 30 | Auth |
| `OTP_EXPIRY_MINUTES` | No | 10 | Auth |
| `OTP_RESEND_COOLDOWN_SECONDS` | No | 59 | Auth |
| `RESET_TOKEN_EXPIRY_MINUTES` | No | 60 | Auth |
| `MAX_LOGIN_ATTEMPTS` | No | 5 | Auth |
| `LOCK_DURATION_MINUTES` | No | 30 | Auth |
| `BCRYPT_ROUNDS` | No | 12 | Auth |
| `REFRESH_TOKEN_COOKIE_NAME` | No | refreshToken | Auth |
| `ACCESS_TOKEN_COOKIE_NAME` | No | accessToken | Auth |
| `CSP_ENABLED` | No | true | Security |
| `CSP_DEV_MODE` | No | relaxed | Security |
| `CSP_CONNECT_SRC_EXTRA` | No | '' | Security |
| `CSP_REPORT_URI` | No | '' | Security |
| `AI_PROVIDER` | No | gemini | AI |
| `AI_TIMEOUT_MS` | No | 30000 | AI |
| `AI_MAX_OUTPUT_TOKENS` | No | 1024 | AI |
| `AI_TEMPERATURE` | No | 0.7 | AI |
| `AI_TOP_P` | No | 0.95 | AI |
| `AI_MAX_PROMPT_LENGTH` | No | 4000 | AI |
| `AI_RATE_LIMIT_PER_MINUTE` | No | 20 | AI |
| `GEMINI_API_KEY` | No | '' | AI |
| `GEMINI_MODEL` | No | gemini-flash-latest | AI |
| `OPENAI_API_KEY` | No | '' | AI |
| `OPENAI_MODEL` | No | gpt-4o-mini | AI |
| `GROQ_API_KEY` | No | '' | AI |
| `GROQ_MODEL` | No | llama-3.3-70b-versatile | AI |
| `REDIS_ENABLED` | No | true | Cache |
| `REDIS_URL` | No | redis://localhost:6379 | Cache |
| `CONFIG_ENCRYPTION_KEY` | Prod | JWT fallback | Security |
| `WORKER_POLL_INTERVAL_MS` | No | 3000 | Worker |
| `WORKER_CONCURRENCY` | No | 5 | Worker |
| `WORKER_BATCH_SIZE` | No | 10 | Worker |
| `WORKER_LOCK_TTL_SECONDS` | No | 120 | Worker |
| `WEBHOOK_TIMEOUT_MS` | No | 15000 | Webhooks |
| `WEBHOOK_RETRY_BASE_SECONDS` | No | 30 | Webhooks |
| `WEBHOOK_RETRY_MAX_SECONDS` | No | 3600 | Webhooks |

## Docker Compose Variables

| Variable | Default | Service |
|----------|---------|---------|
| `MYSQL_PORT` | 3306 | mysql |
| `REDIS_PORT` | 6379 | redis |
| `BACKEND_PORT` | 3000 | backend |
| `FRONTEND_PORT` | 4200 | frontend |
| `MYSQL_ROOT_PASSWORD` | — | mysql |
| `DB_*` | passed to backend/worker | backend, worker |

## Frontend Environment

| File | Keys |
|------|------|
| `environment.ts` | `apiUrl`, `production: false` |
| `environment.prod.ts` | `apiUrl`, `production: true` |

**Exact keys:** **NOT VERIFIED** — read environment files for full list.

## Test-Only Variables

| Variable | File |
|----------|------|
| `MYSQL_PWD` | integration test schema helper |

## Cross References

- `.env.example` at repository root
- [Configuration_Inventory.md](./Configuration_Inventory.md)
