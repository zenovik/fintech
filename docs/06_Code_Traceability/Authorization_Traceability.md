# Authorization Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

## RBAC Chain (FR-RBAC-001)

| Step | Artifact |
|------|----------|
| Permission definitions | `Backend_Fintech/src/app/shared/rbac/permissions.ts` (144 entries) |
| Route guard | `authorize('resource:action', ...)` in *.routes.ts |
| Middleware | authorize.middleware.ts |
| JWT payload | roles/permissions embedded at login |
| Org cap | organization.middleware.ts filters effective permissions |
| Merchant cap | merchant.middleware.ts outlet scope |
| Super admin | BR-RBAC-001 bypass in authorize.middleware |
| FE guard | permission.guard.ts |
| Test | authorization.integration.test.ts, rbac.spec.ts |

## Roles API

`/api/v1/roles/*` → role.controller → role.service → role.repository → roles, role_permissions

## Permissions API

`/api/v1/permissions/` → permission.controller → permission.repository

## Per-endpoint permission list

**NOT VERIFIED** exhaustive — requires grep all `authorize(` calls (estimated 400+ usages).

## Cross References

- [01_Product/Modules/Authorization.md](../01_Product/Modules/Authorization.md)
- [02_Architecture/Authorization_Architecture.md](../02_Architecture/Authorization_Architecture.md)
