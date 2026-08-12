# Technology Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · Evidence from manifests and source · 2026-07-29

---

## Verified Technology Stack

| Category | Technology | Version | Evidence |
|----------|------------|---------|----------|
| **Frontend framework** | Angular | 19.2.19 | `Frontend_Fintech/package.json` |
| **UI library** | Angular Material + CDK | 19.2.19 | dependencies |
| **Backend framework** | Express | ^4.21.2 | `Backend_Fintech/package.json` |
| **Language** | TypeScript | BE ^5.8.3 / FE ~5.7.2 | package.json |
| **Runtime** | Node.js | >=20.0.0 | engines in all package.json |
| **Database** | MySQL | 8.0 | docker-compose, mysql2 driver |
| **DB driver** | mysql2 | ^3.23.1 | Backend dependencies (raw SQL, no ORM) |
| **Cache / locks** | Redis + ioredis | redis:7-alpine, ^5.11.1 | docker-compose, Backend |
| **Queue** | Custom MySQL tables | — | `background_jobs`, worker polling — **NOT BullMQ** |
| **Auth** | JWT (jsonwebtoken) + bcryptjs | HS256 | `token.service.ts`, env JWT_* |
| **MFA/OTP** | otplib | ^13.4.1 | auth module |
| **Validation** | Zod | ^4.4.3 | route DTOs, middleware |
| **API docs** | swagger-jsdoc + swagger-ui-express | ^6.3 / ^5.0 | `src/app/swagger/` |
| **Email** | nodemailer | ^7.0.13 | `email.service.ts` |
| **PDF** | pdfkit | ^0.19.1 | invoice PDF |
| **QR** | qrcode | ^1.5.4 | qr-payments module |
| **Security headers** | helmet | ^8.1.0 | http-security.ts |
| **Rate limiting** | express-rate-limit | ^8.6.0 | global + API limiters |
| **Compression** | compression | ^1.8.0 | app.ts |
| **Logging** | morgan + custom logger | ^1.10.0 | request-logging.middleware |
| **Containerization** | Docker + Compose | — | 2 Dockerfiles, docker-compose.yml |
| **Reverse proxy (FE prod)** | nginx | 1.27-alpine | Frontend Dockerfile |
| **E2E testing** | Playwright | ^1.51.0 | root devDependencies |
| **Unit/integration (BE)** | tsx + custom tests | — | Backend test scripts |
| **FE unit test runner** | Karma + Jasmine | ~6.4 / ~5.6 | Frontend devDependencies |
| **Performance testing** | k6 | — | performance/ (installed in CI) |
| **Security scanning** | OWASP ZAP + npm audit | — | security/scripts/ |
| **Process manager (optional)** | PM2 | — | ecosystem.config.cjs |
| **Formatting** | Prettier | ^3.5.3 | root + workspace |
| **Linting (BE)** | ESLint + typescript-eslint | ^9.25 | Backend devDependencies |

## NOT VERIFIED / Not Found in Repository

| Item | Status |
|------|--------|
| ORM (TypeORM, Prisma, Sequelize) | **NOT USED** — mysql2 raw queries only |
| BullMQ / Bull | **NOT USED** — custom MySQL queue |
| GraphQL | **NOT FOUND** |
| WebSocket / Socket.io | **NOT FOUND** in Backend dependencies |
| Prometheus client | **NOT FOUND** — custom metrics registry |
| OpenTelemetry | **NOT FOUND** |
| node-cron | **NOT FOUND** — schedules via `background_job_schedules` + worker tick |
| NgRx / Akita | **NOT FOUND** — Angular services + signals (partial) |

## AI Provider Integration (Optional)

**Evidence:** `Backend_Fintech/src/app/config/env.ts`

| Provider | Env keys | Default |
|----------|----------|---------|
| Google Gemini | `GEMINI_API_KEY`, `GEMINI_MODEL` | gemini-flash-latest |
| OpenAI | `OPENAI_API_KEY`, `OPENAI_MODEL` | gpt-4o-mini |
| Groq | `GROQ_API_KEY`, `GROQ_MODEL` | llama-3.3-70b-versatile |

Default provider: `AI_PROVIDER=gemini`

## Frontend Architecture Pattern

| Pattern | Evidence |
|---------|----------|
| Standalone components | All 153 `*.component.ts` — no NgModules |
| Lazy loading | 37 `loadChildren` + 4 `loadComponent` in `app.routes.ts` |
| Route-based features | 38 `*.routes.ts` under `features/` |
| Core auth layer | `core/auth/` guards, interceptor, services |
| Material Design | `@angular/material` throughout |

## Backend Architecture Pattern

| Pattern | Evidence |
|---------|----------|
| Modular monolith | 46 folders under `modules/` |
| Layered | routes → controllers → services → repositories |
| Shared cross-cutting | `shared/middleware`, `shared/workers` |
| Multi-tenancy | `organization.middleware.ts`, `organization_id` scoping |
| RBAC | 144 permissions in `permissions.ts`, `authorize()` middleware |
