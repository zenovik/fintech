# Assumptions and Constraints — Merchant Pro

## Technical Assumptions

| ID | Assumption |
|----|------------|
| TA-001 | MySQL 8.0+ is the primary relational database |
| TA-002 | Node.js 20+ runtime for backend and worker processes |
| TA-003 | Modern evergreen browsers (Chrome, Edge, Firefox, Safari) for SPA |
| TA-004 | HTTPS terminates at reverse proxy in production |
| TA-005 | Redis available in production for locks and optional rate limiting |
| TA-006 | SMTP server available for transactional email delivery |
| TA-007 | Google Gemini API available for AI features (optional API key) |
| TA-008 | Clock synchronization (NTP) across API and worker instances |
| TA-009 | Single primary MySQL writer; read replicas optional (not required V1) |

## Business Assumptions

| ID | Assumption |
|----|------------|
| BA-001 | Each organization represents a distinct business tenant |
| BA-002 | Merchants belong to exactly one organization |
| BA-003 | Platform staff users may belong to multiple organizations |
| BA-004 | Payment processing connects to external gateway (simulated in V1) |
| BA-005 | Settlement banking rails are external to the portal |
| BA-006 | End customers interact only via public checkout/QR/link pages |
| BA-007 | English is the primary UI language for V1 |
| BA-008 | USD is the default currency; multi-currency data model supported |

## Deployment Assumptions

| ID | Assumption |
|----|------------|
| DA-001 | Production secrets meet 32-character minimum |
| DA-002 | Database seeded via `master_database.sql` or setup scripts |
| DA-003 | Worker process runs separately from API (`node dist/worker.js`) |
| DA-004 | Frontend served as static SPA with `/api` proxy |
| DA-005 | CORS origin explicitly configured per environment |
| DA-006 | CI/CD runs integration and E2E before production promotion |

---

## Constraints

### Known Limitations (V1)

| ID | Constraint | Impact |
|----|------------|--------|
| KC-001 | In-memory rate limiting when Redis disabled | Single-node only |
| KC-002 | CSP allows `unsafe-inline` styles | Angular Material requirement |
| KC-003 | SSO buttons disabled (coming soon) | Email/password only |
| KC-004 | API key request enforcement partial | Developer keys stored, not all routes gated |
| KC-005 | Scheduled job types in DB without handlers | settlement_processing etc. seed-only |
| KC-006 | File upload MIME validation metadata-level | No deep binary inspection |
| KC-007 | Geo/IP restriction settings not enforced on requests | Stored for V2 |

### Infrastructure Limits

| ID | Limit | Value |
|----|-------|-------|
| IL-001 | JSON request body | 10 MB |
| IL-002 | Worker batch size | 10 (default) |
| IL-003 | Webhook timeout | 15 s (default) |
| IL-004 | AI rate limit | 20 req/min/user |
| IL-005 | Concurrent sessions | 5 (default) |
| IL-006 | Webhook max attempts | 3 (default) |

### Deployment Constraints

| ID | Constraint |
|----|------------|
| DC-001 | Docker Compose requires `.env` with mandatory secrets |
| DC-002 | MySQL init requires `master_database.sql` mount for fresh install |
| DC-003 | k6 and OWASP ZAP require separate tooling (CI workflows provided) |
| DC-004 | Windows development requires local MySQL or Docker for full E2E |

---

## Accepted V2 Items

| Item | Rationale for deferral |
|------|------------------------|
| Redis-backed rate limiting | V1 single-node deployment sufficient for RC |
| Nonce-based CSP | Requires frontend build pipeline changes |
| SSO (Google/GitHub) | UI placeholders exist; OAuth flow not implemented |
| API key middleware on all routes | Developer portal foundation in place |
| Inbound webhook verification | Platform is outbound-webhook only |
| HSTS preload | Awaiting production domain confirmation |
| Horizontal worker autoscaling | Queue architecture supports; ops config V2 |
| Real-time fraud ML | AI fraud flag seeded; model integration V2 |
| Multi-language UI | English-only sufficient for RC |
| Mobile native apps | Responsive web covers V1 |

See [KNOWN_LIMITATIONS.md](../../KNOWN_LIMITATIONS.md) for release-level summary.
