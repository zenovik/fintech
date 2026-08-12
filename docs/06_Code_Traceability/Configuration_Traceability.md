# Configuration Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

| Config type | Source | Reader | API |
|-------------|--------|--------|-----|
| Env vars | .env, env.ts | All processes | — |
| Feature flags DB | feature_flags table | feature-flag.middleware.ts | /api/v1/settings/feature-flags |
| Route flags | feature_flag_api_routes | feature-flag.middleware | settings API |
| Platform settings | platform_settings | platform-config.service | /api/v1/settings/configuration |
| Org settings | organization_settings | settings.service | /api/v1/settings/organization |
| SMTP | encrypted in DB | settings.service, email.service | /api/v1/settings/smtp |
| Rate limits | DB + env | rate limit middleware | /api/v1/settings/rate-limits |
| Cache config | system tables | system-config.service | /api/v1/system/cache-config |
| FE branding | branding.service | public settings API | /api/v1/settings/public/branding |
| FE feature flags | feature-flag.service | public API | /api/v1/settings/public/feature-flags |

## FR mapping

FR-SET-001–004, FR-SET-002 (feature flags)

## Cross References

- [05_Repository_Audit/Configuration_Inventory.md](../05_Repository_Audit/Configuration_Inventory.md)
