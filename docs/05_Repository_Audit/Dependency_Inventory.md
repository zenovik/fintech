# Dependency Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · From package.json manifests · 2026-07-29

---

## Root (`package.json`)

### Runtime
*None* — monorepo orchestrator only.

### DevDependencies (3)

| Package | Version | Used by |
|---------|---------|---------|
| `@playwright/test` | ^1.51.0 | `e2e/`, `playwright.config.ts` |
| `concurrently` | ^9.1.2 | `npm run dev` |
| `prettier` | ^3.5.3 | format scripts |

## Backend_Fintech — Runtime (20)

| Package | Version | Purpose |
|---------|---------|---------|
| bcryptjs | ^3.0.3 | Password hashing |
| compression | ^1.8.0 | Response compression |
| cookie-parser | ^1.4.7 | Cookie parsing (JWT refresh) |
| cors | ^2.8.5 | CORS |
| dotenv | ^16.5.0 | Env loading |
| express | ^4.21.2 | HTTP server |
| express-rate-limit | ^8.6.0 | Rate limiting |
| helmet | ^8.1.0 | Security headers |
| ioredis | ^5.11.1 | Redis client |
| jsonwebtoken | ^9.0.3 | JWT |
| morgan | ^1.10.0 | HTTP logging |
| mysql2 | ^3.23.1 | MySQL driver |
| nodemailer | ^7.0.13 | SMTP email |
| otplib | ^13.4.1 | OTP/MFA |
| pdfkit | ^0.19.1 | Invoice PDF |
| qrcode | ^1.5.4 | QR generation |
| swagger-jsdoc | ^6.3.0 | OpenAPI generation |
| swagger-ui-express | ^5.0.1 | Swagger UI |
| uuid | ^14.0.1 | UUID generation |
| zod | ^4.4.3 | Validation |

## Backend_Fintech — Dev (20)

@types/* (14 packages), eslint, typescript-eslint, tsx, typescript

## Frontend_Fintech — Runtime (13)

All `@angular/*` 19.2.19, rxjs ~7.8.0, tslib ^2.3.0, zone.js ~0.15.0

## Frontend_Fintech — Dev (11)

@angular-devkit/build-angular, @angular/cli, @angular/compiler-cli, karma*, jasmine*, typescript ~5.7.2

---

## Unused Dependencies Analysis

| Package | Finding | Confidence |
|---------|---------|------------|
| All Backend runtime deps | Referenced in imports across src/ | **NOT VERIFIED** per-package — spot checks only |
| Karma/Jasmine (FE) | `npm run test` configured; **NOT VERIFIED** if spec files exist | Medium |
| morgan | Used in app.ts | High |

**Note:** Full unused-dependency analysis requires `depcheck` run — **NOT VERIFIED** in this audit (no depcheck output in repo).

## Duplicate Dependencies

| Package | Locations | Notes |
|---------|-----------|-------|
| typescript | Backend ^5.8.3, Frontend ~5.7.2 | Version mismatch across workspaces |
| prettier | Root ^3.5.3 | Shared formatter |

## High-Risk / Security-Relevant

| Package | Risk area | Mitigation in repo |
|---------|-----------|-------------------|
| jsonwebtoken | Token forgery | HS256 pinning, secret from env |
| bcryptjs | Password storage | Configurable rounds |
| nodemailer | Email injection | Template validation **NOT VERIFIED** |
| ioredis | Cache poisoning | REDIS_ENABLED flag |

## Deprecated

**NOT VERIFIED** — no `npm audit` output embedded in this audit. Run `npm run security:audit`.

## Optional Dependencies

| Feature | Packages | Toggle |
|---------|----------|--------|
| Redis | ioredis | `REDIS_ENABLED=false` degrades to in-memory/no locks |
| AI | env AI_* keys | Works without keys (errors on use) **NOT VERIFIED** |
