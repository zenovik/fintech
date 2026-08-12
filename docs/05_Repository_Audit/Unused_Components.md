# Unused Components

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · 2026-07-29

---

## Method

153 components — usage verified by route `loadComponent` / template references. **Full import graph NOT VERIFIED.**

## No Route / No Feature Folder

| Item | Status | Confidence |
|------|--------|------------|
| `features/merchants/` folder | Empty — no components | **High** |
| `features/permissions/` | No components — service only | **High** |

## All Routed Components

138+ components are reachable via `app.routes.ts` lazy loading chains — **verified** route files exist for 38 features.

## Shared Components (usage)

| Component | Referenced by |
|-----------|---------------|
| shared/ui/* (3) | **NOT VERIFIED** per-component import count |
| shared/ai/* (6) | Dashboard / executive routes likely |

## Potentially Underused

| Component area | Notes | Confidence |
|----------------|-------|------------|
| checkout feature (9 components) | Public routes only — admin uses checkout-admin | **Medium** |
| merchant-portal (1) | Single page — niche use | **Low** |

## Cross References

- [Frontend_Inventory.md](./Frontend_Inventory.md)
- [Unused_Files.md](./Unused_Files.md)
