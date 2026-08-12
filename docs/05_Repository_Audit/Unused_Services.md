# Unused Services

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · 2026-07-29

---

## Frontend Services (67)

| Service | Location | Status |
|---------|----------|--------|
| permission-api.service | features/permissions/services/ | **Medium** — no feature UI; may be used by roles |
| All other feature *-api.service | features/*/services/ | Wired to routed components — **Low** dead risk |

**Full import analysis:** **NOT VERIFIED**

## Backend Services (67)

All 67 services map to modules with controllers — **Low** dead code risk.

| Service | Notes |
|---------|-------|
| export-file.service | Used by exports/reports |
| dashboard-ai.service | Dashboard AI chat |
| go-live-promotion.service | Onboarding approval |
| status-sync.service | Onboarding approval |

## Shared Services

| Service | Consumers |
|---------|-----------|
| background-job.service | auth, invoices, notifications |
| email.service | worker, auth |
| cache.service | settings, platform-config |
| export-file.service | exports module |

**None identified as unused with high confidence.**

## Cross References

- [Backend_Inventory.md](./Backend_Inventory.md)
- [Dead_Code_Inventory.md](./Dead_Code_Inventory.md)
