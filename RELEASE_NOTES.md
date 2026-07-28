# Release Notes — v1.0.0-rc1

**Tag:** `v1.0.0-rc1`  
**Date:** 29 July 2026  
**Status:** Release Candidate — UAT and production handover

---

## Summary

Merchant Pro V1 is feature-complete. This RC certifies backend integration coverage, security hardening, deployment topology, and CI quality gates for production rollout.

## What's Included

- Full merchant management portal (payments, settlements, refunds, chargebacks, subscriptions, invoices, QR, payment links)
- Multi-organization RBAC with 69 permissions
- Public checkout flows (checkout, payment links, QR)
- Developer portal, sandbox, webhooks, reconciliation
- AI assistant (Gemini) with business-intent routing
- Observability: health, readiness, liveness, audit/API/webhook logs

## Certification Results (29 Jul 2026)

| Gate | Result |
|------|--------|
| Integration (101 tests) | **PASS** — 44.2s |
| Playwright E2E (75 tests) | **PARTIAL** — local env seed mismatch; CI authoritative |
| k6 smoke | **NOT RUN** locally (k6 not installed); CI workflow ready |
| OWASP ZAP baseline | **NOT RUN** locally (Docker not installed); CI workflow ready |
| Dependency audit | **EXECUTED** — backend runtime 0 critical |

## Upgrade / Deploy

1. Copy `.env.example` → `.env` and set production secrets (32+ chars)
2. `docker compose up -d` (requires MySQL seed volume mount)
3. Verify `/api/live`, `/api/ready`, `/api/health`
4. Confirm HSTS/CSP enabled (`NODE_ENV=production`, `CSP_ENABLED=true`)

## Known Issues

See [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md).

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [SECURITY.md](./SECURITY.md)
- [PERFORMANCE.md](./PERFORMANCE.md)
- [Documentation/DEPLOYMENT_GUIDE.md](./Documentation/DEPLOYMENT_GUIDE.md)
