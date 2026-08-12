# Frontend Governance

> **Enterprise Governance** · v1.0.0-rc1 · Section 9 · Generated 2026-08-03

---


| Standard | Evidence | Verification |
| --- | --- | --- |
| Angular 19 standalone | 153 components | VERIFIED |
| Services + inject() | 67 services | VERIFIED |
| Lazy loading | 161 lazy routes | VERIFIED |
| Signals | AST-detected in components | frontend-analysis observable-flow.json | VERIFIED |
| RxJS | map/catchError/switchMap in HTTP chains | frontend-analysis httpclient-calls.json | VERIFIED |
| Guards | 163 guard mappings | VERIFIED |
| Accessibility | NOT VERIFIED WCAG audit in repo | NOT VERIFIED |
| i18n | NOT VERIFIED ngx-translate or similar | NOT VERIFIED |


