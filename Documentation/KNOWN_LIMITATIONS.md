# Known Limitations — Merchant Pro v1.0.0 RC1

Documented constraints, gaps, and operational notes for Release Candidate 1.

---

## Gemini Quota Limitations

### API quota

Google Gemini API enforces per-project and per-model quotas. Common issues:

| Error | Cause | Resolution |
| ----- | ----- | ---------- |
| HTTP 429 `RESOURCE_EXHAUSTED` | Quota exceeded or model limit is 0 | Check Google Cloud Console → APIs → Gemini → Quotas |
| `AI_PROVIDER_UNAVAILABLE` (503) | Missing or invalid `GEMINI_API_KEY` | Set valid key in environment and restart backend |

### Model selection

- **Default model:** `gemini-flash-latest` (recommended, verified working)
- **Legacy models** (e.g., `gemini-2.0-flash`) may have quota limit 0 on free-tier projects
- Model is configured via `GEMINI_MODEL` environment variable

### Rate limiting

- Application-level rate limit: `AI_RATE_LIMIT_PER_MINUTE` (default 20 requests/minute per user)
- Separate from Google API quota — both limits apply

### Health impact

When `GEMINI_API_KEY` is missing:

- System health: AI provider shows `down`
- Readiness: `ai: false`
- AI chat returns friendly quota/unavailable message
- Other platform features remain operational

---

## Required Environment Variables

### Always required (all environments)

| Variable | Notes |
| -------- | ----- |
| `DB_PASSWORD` | No default; application will not start without it |
| `JWT_SECRET` | Access token signing |
| `JWT_REFRESH_SECRET` | Refresh token signing |

### Required in production (`NODE_ENV=production`)

| Variable | Validation |
| -------- | ---------- |
| `DB_PASSWORD` | ≥ 32 chars, no placeholders |
| `JWT_SECRET` | ≥ 32 chars, no placeholders |
| `JWT_REFRESH_SECRET` | ≥ 32 chars, no placeholders |
| `CORS_ORIGIN` | Non-empty, exact frontend URL |

Placeholder patterns blocked: `changeme`, `change-this`, `replace-with`

### Required for AI features

| Variable | Notes |
| -------- | ----- |
| `GEMINI_API_KEY` | Valid Google API key |
| `AI_PROVIDER` | Must be `gemini` (only implemented provider) |

### Required for Docker Compose

| Variable | Notes |
| -------- | ----- |
| `MYSQL_ROOT_PASSWORD` | Compose fails if missing |
| `MYSQL_PASSWORD` | Compose fails if missing |
| `JWT_SECRET` | Compose fails if missing |
| `JWT_REFRESH_SECRET` | Compose fails if missing |
| `CORS_ORIGIN` | Compose fails if missing |

---

## TLS Requirement

Production deployments must use HTTPS:

- Nginx terminates TLS and proxies to backend
- Set `CORS_ORIGIN` to the HTTPS frontend URL (e.g., `https://portal.example.com`)
- Refresh token cookie should use `Secure` flag in production (handled by backend when `NODE_ENV=production`)
- Do not expose backend port 3000 directly to the internet — route through Nginx

Development (`http://localhost:4200`) does not require TLS.

---

## Docker Verification Notes

### Local verification status

Docker Compose configuration is complete and healthchecks are defined. Full end-to-end Docker verification may require Docker CLI availability on the deployment host.

### MySQL init behavior

- `master_database.sql` runs only on **first container start** with an empty `mysql_data` volume
- Redeploying without removing the volume does **not** re-run schema/seed
- Clean reset: `docker compose down -v` then `docker compose up`

### Healthcheck endpoints

| Service | Check |
| ------- | ----- |
| mysql | `mysqladmin ping` |
| backend | Node `fetch` to `http://127.0.0.1:3000/api/health` |
| frontend | `wget` to `http://localhost:80/` |

### IPv6 rate limiter warning

At startup, `express-rate-limit` may log a non-fatal `ValidationError` related to IPv6 validation on AI/login rate limiters. This does not block application startup.

---

## AI Provider Limitations

| Provider | Status |
| -------- | ------ |
| Gemini | Fully implemented |
| OpenAI | Configured but not implemented — returns 503 |
| Groq | Configured but not implemented — returns 503 |

Selecting `AI_PROVIDER=openai` or `AI_PROVIDER=groq` will cause AI health to show `degraded` and chat to fail.

---

## Export Limitations

- Export downloads are **CSV format only**
- PDF and XLSX export buttons in the UI map to CSV output
- Export files are stored in `Backend_Fintech/uploads/exports/` and downloaded via `/api/v1/exports/:fileId`

---

## Analytics Filter Limitations

Advanced analytics filters are partially implemented:

- `dateFrom` / `dateTo` — supported on most analytics endpoints
- `merchantId` — supported on some endpoints; not all analytics views filter by merchant
- Custom date range UI may not expose all backend filter parameters

---

## UI Limitations

| Limitation | Details |
| ---------- | ------- |
| Column sorting | Not implemented on data tables |
| Mobile bottom navigation | Contains placeholder links for some modules |
| Developers nav item | Placeholder — not implemented |
| Some Settings nav items | Placeholder links in navigation (settings pages themselves are implemented at `/settings/*`) |

---

## Database Limitations

- No automated migration runner — schema changes require editing `structure_queries/`, running `npm run db:build`, and re-running `master_database.sql` (or manual ALTER)
- Binary logging not configured by default — no point-in-time recovery out of the box
- Rollback scripts in `Database_Fintech/rollback_scripts/` are manual drop utilities, not automated rollback

---

## Package Version vs Release Name

| Identifier | Value |
| ---------- | ----- |
| Release name | v1.0.0 RC1 |
| npm package version | `0.1.0` (root, backend, frontend) |
| `APP_VERSION` env | Overrides displayed version if set |

Version endpoint returns package version unless `APP_VERSION` is configured.

---

## Future Enhancements

The following are identified for post-RC1 development:

| Area | Enhancement |
| ---- | ----------- |
| AI | OpenAI and Groq provider implementation |
| AI | Additional intent routing for more business domains |
| Exports | Native PDF and XLSX generation |
| Analytics | Full merchant/date filter support across all views |
| UI | Column sorting on data tables |
| UI | Complete mobile navigation |
| UI | Developers portal |
| Database | Automated migration framework |
| Database | Point-in-time recovery (binary logging) |
| Observability | External metrics integration (Prometheus, Grafana) |
| Observability | Distributed tracing (OpenTelemetry) |
| Security | API key rotation automation |
| Operations | Automated backup scheduling |

---

## Demo Data Warning

UAT/demo environments ship with seeded users using password `Password123!`. **Change all passwords before production go-live.**

Primary demo account: `admin@merchantpro.com`

---

## Permission Note

`ai:view` permission is defined in the RBAC seed data but is not enforced on any route in RC1. AI access requires `ai:chat`.
