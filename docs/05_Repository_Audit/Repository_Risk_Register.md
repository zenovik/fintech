# Repository Risk Register

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · 2026-07-29

---

| ID | Risk | Severity | Evidence | Mitigation in repo |
|----|------|----------|----------|-------------------|
| R-01 | API surface (562 endpoints) exceeds integration test coverage | Medium | 17 integration files vs 46 modules | CI integration job; expand tests |
| R-02 | Security/perf workflows do not block CI | Medium | continue-on-error: true | Manual workflow_dispatch |
| R-03 | No ORM — raw SQL maintenance burden | Low | mysql2 only | Repository pattern, 223-table docs |
| R-04 | TypeScript version mismatch FE/BE | Low | 5.7.2 vs 5.8.3 | Root overrides for Angular only |
| R-05 | Empty frontend directories | Low | merchants/, layouts/, pipes/ | Cleanup candidate |
| R-06 | Excluded seed SQL files | Low | 23–25 dummy data not in build | Document or remove |
| R-07 | Redis optional — lock degradation | Medium | REDIS_ENABLED=false path | Documented in REDIS.md |
| R-08 | Single master SQL migration model | Medium | No Flyway/Liquibase | build-master.ps1 discipline |
| R-09 | Duplicate documentation | Low | root + Documentation/ + docs/ | Cross-ref policy |
| R-10 | AI keys optional — runtime failures | Low | Empty GEMINI_API_KEY default | Feature isolated to AI routes |
| R-11 | Worker single-process polling bottleneck | Medium | MySQL queue polling | Horizontal worker replicas |
| R-12 | Frontend Karma configured, specs **NOT VERIFIED** | Low | jasmine in package.json | Confirm or remove |
| R-13 | Payment gateway vendor abstraction | Medium | No Stripe/Razorpay SDK | Custom gateway layer — **NOT VERIFIED** |
| R-14 | PII in logs | Medium | request-logging masks sensitive routes | Review mask list |
| R-15 | 76 deleted_at refs — soft delete consistency | Low | Partial table coverage | Soft delete strategy doc |

## Cross References

- [Repository_Findings.md](./Repository_Findings.md)
- [KNOWN_LIMITATIONS.md](../../KNOWN_LIMITATIONS.md)
