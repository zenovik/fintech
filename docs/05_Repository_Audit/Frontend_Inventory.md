# Frontend Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · Evidence from Frontend_Fintech source · 2026-07-29

---

## Summary

| Artifact | Count | Evidence |
|----------|------:|----------|
| Standalone components | 153 | `**/*.component.ts` |
| Services | 67 | `**/*.service.ts` |
| Guards | 3 | `core/auth/guards/` |
| Interceptors | 1 | `auth.interceptor.ts` |
| Pipes | 0 | `shared/pipes/` empty |
| Directives | 0 | `shared/directives/` empty |
| Resolvers | 0 | no `*.resolver.ts` |
| NgModules | 0 | no `*.module.ts` |
| Feature route files | 38 | `features/*/*.routes.ts` |
| Lazy `loadChildren` routes | 37 | `app.routes.ts` |
| Lazy `loadComponent` routes | 4 | public checkout/pay/qr, select-org |

## Guards

| Guard | File | Purpose |
|-------|------|---------|
| authGuard | `auth.guard.ts` | Requires authenticated session |
| guestGuard | `guest.guard.ts` | Redirects authenticated users away from login |
| permissionGuard | `permission.guard.ts` | RBAC route permission check |

## Interceptors

| Interceptor | File | Purpose |
|-------------|------|---------|
| authInterceptor | `auth.interceptor.ts` | Adds Bearer token, CSRF header, handles 401 refresh |

## Core Services (auth)

| Service | Path |
|---------|------|
| auth.service | `core/auth/services/` |
| csrf.service | `core/auth/services/` |
| token-storage (if present) | **NOT VERIFIED** — check auth services folder |

## Feature Areas (41 folders)

| Feature | Routes file | Components (approx) | Status |
|---------|-------------|----------------------:|--------|
| authentication | Yes | 11 | Active |
| dashboard | Yes | 8 | Active |
| merchant | Yes | 4 | Active |
| settings | Yes | 14 | Active |
| reports | Yes | 7 | Active |
| checkout (public) | No routes file | 9 | Public pages via loadComponent |
| checkout-admin | Yes | 5 | Active |
| permissions | **No** | 0 pages | Service-only (`permission-api.service.ts`) |
| merchants | **No** | 0 | **Empty folder** |
| *… 32 others* | Yes | 1–6 each | Active |

## Shell / Layout Components

| Component | Used by |
|-----------|---------|
| DashboardShellComponent | dashboard routes |
| SettingsShellComponent | settings routes |
| AuditShellComponent | audit routes |
| NotificationsShellComponent | notifications routes |

## Shared UI

| Component | Path |
|-----------|------|
| empty-state | `shared/ui/empty-state/` |
| icon-button | `shared/ui/icon-button/` |
| loading-state | `shared/ui/loading-state/` |
| AI chat widgets (6) | `shared/ai/components/` |

## Public (Unauthenticated) Routes

| Path | Component |
|------|-----------|
| `pay/checkout/:ref` | HostedCheckoutComponent |
| `pay/:token` | PublicPayComponent |
| `qr/:token` | PublicQrPayComponent |
| `auth/*` | Login, OTP, forgot password, etc. |

## State Management

| Approach | Evidence |
|----------|----------|
| Angular services + RxJS | Primary pattern in `*.service.ts` |
| Signals | **NOT VERIFIED** count — partial Angular 19 usage |
| NgRx | **NOT FOUND** |

## Cross References

- Unused: [Unused_Components.md](./Unused_Components.md)
- Architecture: [02_Architecture/Technology_Stack.md](../02_Architecture/Technology_Stack.md)
- Product modules: [01_Product/Modules/](../01_Product/Modules/)
