# Frontend Developer Handbook

> **Enterprise Delivery — Phase 8** · v1.0.0-rc1 · Section 5 · 2026-08-03

> Evidence-based handover documentation. Unsupported claims marked **NOT VERIFIED**.

---


## Angular Architecture
Standalone components, feature modules under src/app/features/

## Components
153 components — lazy-loaded pages via loadComponent

## Routing
app.routes.ts + feature *.routes.ts; 161 lazy routes

## Signals
State services use signal() + computed() — merchant-state.service.ts pattern

## RxJS
HTTP pipes: map, catchError, switchMap — frontend-analysis httpclient-calls.json

## Guards
authGuard, permissionGuard, guestGuard — guard-map.json (163 mappings)

## Interceptors
authInterceptor — JWT refresh, CSRF, org/merchant headers

## API Communication
*-api.service.ts → HttpClient; 1742 verified FE→API chains

## State Management
Feature *-state.service.ts wrapping *-api.service.ts

## Accessibility
NOT VERIFIED WCAG audit in repository
