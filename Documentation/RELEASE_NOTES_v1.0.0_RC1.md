# Release Notes — Merchant Pro v1.0.0 RC1

**Release name:** v1.0.0 Release Candidate 1  
**Package version:** `0.1.0`  
**Release date:** July 2026  
**Status:** Release Candidate — ready for UAT and production handover

---

## Completed Features

### Core Platform

- Authentication with JWT access tokens and httpOnly refresh cookies
- Multi-factor authentication (TOTP OTP)
- Multi-organization support with organization selection
- Session management (idle timeout, concurrent session control, revocation)
- Password reset and change password flows
- Role-Based Access Control (69 permissions, super admin bypass)
- Organization-scoped data isolation

### Business Modules

| Module | Capabilities |
| ------ | ------------ |
| Executive Dashboard | KPIs, charts, activity feed, fraud alerts, export |
| Merchants | CRUD, KYC documents, status management, search |
| Transactions | CRUD, status updates, export, refund initiation |
| Settlements | CRUD, batches, reversals, export |
| Refunds | Create, approve/reject workflow, history |
| Chargebacks | Create, evidence, representment, resolve |
| Customers | CRUD, transaction history, search |
| Payouts | Bank accounts, payout lifecycle, approve/reject |
| Payment Links | Create, manage, public checkout |
| Invoices | Full lifecycle, PDF, email, payment links |
| QR Payments | Create, manage, public checkout |
| Subscriptions | Plans and subscription lifecycle |
| Reports | Templates, scheduled reports, on-demand execution |
| Analytics | 16 domain-specific analytics endpoints |
| Support | Ticket CRUD, assign, escalate, close, notes |
| Operations | Dashboard, alerts, incidents, retry queue, failed items |
| Notifications | User inbox, templates, broadcasts |
| Audit | Audit logs, API logs, webhook logs, export |

### Administration

- User management (CRUD, role assignment)
- Role and permission management
- Organization management (profile, members, domains, API keys, billing)
- Settings (branding, security, password policy, session, feature flags, SMTP, storage, API)
- System Status page (health, readiness, version)

---

## AI

### General AI Assistant

- Floating action button (FAB) chat drawer on all authenticated pages
- Google Gemini provider (`gemini-flash-latest` default)
- Business intent routing — detects questions about transactions, merchants, customers, refunds, chargebacks, settlements, reports, dashboard
- Backend analytics data injected into prompts (reuses `AnalyticsService`, no duplicate SQL)
- Business data prompt rules: never fabricate, never estimate, flag inconsistent data
- Rate limiting (20 requests/minute per user)
- Session history with clear option
- Client-side 35s timeout
- Friendly error messages for quota exhaustion (429)

### Dashboard AI

- Embedded AI panel on Executive Dashboard
- Dashboard period context (KPIs and charts)
- Quick actions (e.g., summarize revenue)
- Same Gemini provider and business data rules as General AI

### AI Configuration

- Environment-driven: `AI_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`
- Configurable timeout, tokens, temperature, rate limit
- AI health integrated into system observability

---

## Deployment

- Docker Compose stack (MySQL 8 + backend + frontend with Nginx)
- Multi-stage Dockerfiles with non-root backend user
- Docker healthchecks (Node fetch for backend, wget for frontend)
- PM2 ecosystem configuration with graceful shutdown and `wait_ready`
- Host Nginx reverse proxy configuration (`deploy/nginx/fintech.conf`)
- Production environment templates (`.env.production.example`)
- Production env validation (blocks placeholder secrets, enforces ≥ 32 char secrets)
- Single-command database setup (`master_database.sql`)
- npm workspace monorepo with unified build scripts

---

## Observability

- Public liveness endpoint: `GET /api/health`
- Authenticated system endpoints: health, readiness, version (`system:view` permission)
- System Status UI at Settings → System Status
- Structured JSON logging with correlation IDs (`X-Request-Id`)
- Request logging middleware (method, status, duration)
- Morgan HTTP access logs
- Graceful shutdown (SIGTERM/SIGINT, 10s timeout, PM2 compatible)
- Production Helmet, CORS, compression middleware

---

## Security

- JWT + refresh token rotation
- MFA (TOTP)
- bcrypt password hashing (configurable rounds)
- Login lockout (configurable attempts and duration)
- RBAC with 69 granular permissions
- Organization role caps (owner/admin/viewer/member)
- Rate limiting on login, OTP, and AI endpoints
- Zod input validation on all request bodies
- Helmet security headers (CSP, HSTS in production)
- CORS origin whitelist
- Production secret validation at startup
- Audit logging with correlation IDs
- Session revocation (individual and bulk)

---

## Known Issues

| Issue | Severity | Workaround |
| ----- | -------- | ---------- |
| Gemini quota 429 on some models | Medium | Use `gemini-flash-latest`; check Google Cloud quotas |
| Export format CSV only | Low | Use CSV; PDF/XLSX planned for future release |
| Analytics merchant filter partial | Low | Use backend query params directly |
| Column sorting not on tables | Low | Use search/filter controls |
| Mobile nav placeholder links | Low | Use desktop navigation |
| IPv6 rate limiter startup warning | Info | Non-fatal; does not affect operation |
| `ai:view` permission unused | Info | Use `ai:chat` for AI access |
| OpenAI/Groq providers not implemented | Info | Keep `AI_PROVIDER=gemini` |

See [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) for full details.

---

## Breaking Changes

No breaking changes from prior internal releases. This is the first formal Release Candidate.

For fresh installs:

- Run `master_database.sql` only — no manual SQL required
- Copy `.env.production.example` to `.env` and set all secrets
- Set `CORS_ORIGIN` to exact production frontend URL

---

## Upgrade Notes

### Fresh install

1. Clone repository
2. `npm install`
3. Configure environment (see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md))
4. Run database setup: `npm run db:setup:unix`
5. Build: `npm run build:prod`
6. Deploy via Docker Compose or PM2 + Nginx
7. Verify: `curl http://localhost:3000/api/health`
8. Change demo passwords before go-live

### Docker redeploy

- Database persists in `mysql_data` volume
- Use `docker compose down -v` only for clean database reset
- Rebuild images after code changes: `npm run docker:build && npm run docker:up`

### PM2 redeploy

```bash
git pull
npm run build:prod
npm run pm2:reload
curl http://localhost:3000/api/health
```

### Environment changes

After changing any environment variable (especially AI keys, JWT secrets, or CORS):

```bash
npm run pm2:reload          # PM2
docker compose restart backend   # Docker
```

---

## Demo Credentials

| Email | Password | Role |
| ----- | -------- | ---- |
| `admin@merchantpro.com` | `Password123!` | Super Admin |
| `finance@merchantpro.com` | `Password123!` | Finance Manager |
| `readonly@merchantpro.com` | `Password123!` | Read Only |

---

## Documentation

| Document | Location |
| -------- | -------- |
| Project README | [Documentation/README.md](./README.md) |
| Architecture | [Documentation/ARCHITECTURE.md](./ARCHITECTURE.md) |
| API Guide | [Documentation/API_GUIDE.md](./API_GUIDE.md) |
| Deployment Guide | [Documentation/DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) |
| Admin Guide | [Documentation/ADMIN_GUIDE.md](./ADMIN_GUIDE.md) |
| User Guide | [Documentation/USER_GUIDE.md](./USER_GUIDE.md) |
| Runbook | [Documentation/RUNBOOK.md](./RUNBOOK.md) |
| Known Limitations | [Documentation/KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) |

Legacy docs at project root (`README.md`, `DEPLOYMENT.md`, `RELEASE_NOTES.md`) remain for backward compatibility.

---

## Sprint History (Release Candidate)

| Sprint | Deliverable |
| ------ | ----------- |
| 08 | Production observability (health, readiness, version, system status UI) |
| 09 | Production deployment (graceful shutdown, Helmet, Docker, PM2, env validation) |
| 10 | Enterprise regression QA (RBAC alignment, Docker healthchecks) |
| 10.5–10.7 | AI UI fixes, Gemini configuration, quota error handling |
| 10.8 | General AI business intent routing |
| 11 | Enterprise release documentation and production handover |
