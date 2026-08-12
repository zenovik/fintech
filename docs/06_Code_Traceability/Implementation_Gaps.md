# Implementation Gaps

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

## Top 100 Gaps (evidence-based)

| # | Gap | Type | Evidence |
|---|-----|------|----------|
| 1 | Full API→FE caller mapping for 562 endpoints | Traceability | No static call graph run |
| 2 | Per-endpoint authorize() permission matrix | Security | **NOT VERIFIED** grep exhaustive |
| 3 | 209+ tables without per-table traceability | Database | Only ~25 major in dictionary |
| 4 | accounting API — no frontend feature | Dead/partial | accounting.routes.ts; no FE folder |
| 5 | pricing API — no frontend feature | Dead/partial | pricing.routes.ts |
| 6 | permissions — no dedicated FE routes | Dead UI | permission-api.service only |
| 7 | settlements — no integration test file | Test | 17 files; no settlements.integration |
| 8 | payouts — no integration test file | Test | same |
| 9 | reconciliation — no integration test file | Test | same |
| 10 | support — no integration test file | Test | same |
| 11 | operations — no integration test file | Test | same |
| 12 | activity — no integration test file | Test | same |
| 13 | search — no integration test file | Test | same |
| 14 | fraud — no integration test file | Test | same |
| 15 | smart-collect — no integration test file | Test | same |
| 16 | invoices — no dedicated integration file | Test | may be in subscriptions-invoices |
| 17 | ai — no integration test file | Test | |
| 18 | customers — no integration test file | Test | |
| 19 | devices — no integration test file | Test | |
| 20 | payment-config — no integration test file | Test | |
| 21 | risk-rules — no integration test file | Test | |
| 22 | acceptance — no integration test file | Test | |
| 23 | accounting — no integration test file | Test | |
| 24 | pricing — no integration test file | Test | |
| 25 | onboarding-approval — no dedicated E2E | Test | |
| 26 | refunds — no dedicated E2E spec | Test | chargebacks-refunds int only |
| 27 | invoices — no E2E spec | Test | |
| 28 | notifications — no E2E spec | Test | |
| 29 | settlements — no E2E spec | Test | |
| 30 | payouts — no E2E spec | Test | |
| 31 | sandbox — no E2E spec | Test | |
| 32 | operations — no E2E spec | Test | |
| 33 | Merchant Onboarding product module doc | Documentation | missing deep dive |
| 34 | Transactions product module doc | Documentation | missing |
| 35 | Settlements product module doc | Documentation | missing |
| 36 | Payouts product module doc | Documentation | missing |
| 37 | Customers product module doc | Documentation | missing |
| 38 | Fraud product module doc | Documentation | missing |
| 39 | Smart Collect product module doc | Documentation | missing |
| 40 | Reconciliation product module doc | Documentation | missing |
| 41 | Support product module doc | Documentation | missing |
| 42 | AI product module doc | Documentation | missing |
| 43 | CI/CD architecture document | Documentation | not in docs/ |
| 44 | Test architecture document | Documentation | not in docs/ |
| 45 | OpenAPI static export artifact | Documentation | runtime /api/docs.json only |
| 46 | PCI-DSS traceability | Compliance | **NOT FOUND** |
| 47 | Payment gateway vendor identity | Integration | no Stripe/Razorpay SDK |
| 48 | FR→line-level code for 70 FRs | Traceability | module-level only |
| 49 | BR→line-level code for 52 BRs | Traceability | **NOT VERIFIED** |
| 50 | Karma FE unit test existence | Test | **NOT VERIFIED** *.spec.ts |
| 51 | scheduled report execution path | Worker | reports scheduled API vs worker **NOT VERIFIED** |
| 52 | Empty features/merchants folder | Hygiene | Phase 1 |
| 53 | Empty layouts/ folder | Hygiene | Phase 1 |
| 54 | Excluded seed SQL 23–25 | Database | not in build-master.ps1 |
| 55 | Soft delete table count doc drift | Documentation | 50 vs 76 refs |
| 56 | security.yml non-blocking | CI | continue-on-error |
| 57 | performance.yml non-blocking | CI | continue-on-error |
| 58 | TypeScript version FE/BE mismatch | Dependency | 5.7 vs 5.8 |
| 59 | Prometheus monitoring | Observability | **NOT FOUND** |
| 60 | OpenTelemetry tracing | Observability | **NOT FOUND** |
| 61 | S3 SDK for storage settings | Integration | **NOT FOUND** |
| 62 | WebSocket realtime notifications | Frontend | **NOT VERIFIED** transport |
| 63 | GraphQL API | Architecture | correctly absent |
| 64 | BullMQ | Architecture | correctly absent |
| 65 | Database views | Schema | 0 views |
| 66 | Full rollback for all 223 tables | Database | 7 partial rollback scripts |
| 67 | validation-scripts usage | Tooling | **NOT VERIFIED** |
| 68 | Duplicate audit.repository modules | Code | auth + audit |
| 69 | NFR performance SLO verification | Test | k6 manual only |
| 70 | NFR security ZAP in merge gate | Test | manual workflow |
| 71 | Multi-region DR implementation | Infrastructure | single region rc1 |
| 72 | Read replica implementation | Database | not in code |
| 73 | Event outbox pattern | Architecture | future only |
| 74 | Idempotency beyond payments | API | payment_idempotency_keys only **NOT VERIFIED** others |
| 75 | Global search index backend | Search | search module **NOT VERIFIED** engine |
| 76 | AI provider fallback chain | AI | **NOT VERIFIED** |
| 77 | Email template XSS audit | Security | **NOT VERIFIED** |
| 78 | Org archive vs soft delete semantics | Database | **NOT VERIFIED** all tables |
| 79 | PII field-level map all tables | Compliance | partial dictionary |
| 80 | Worker horizontal scale coordination | Ops | Redis locks — multi-worker **NOT VERIFIED** tested |
| 81 | Feature flag cache TTL | Performance | **NOT VERIFIED** |
| 82 | Rate limit Redis vs memory store | Security | **NOT VERIFIED** |
| 83 | Export file retention policy | Data | export-registry **NOT VERIFIED** |
| 84 | Chargeback evidence file storage | Storage | uploads volume **NOT VERIFIED** path |
| 85 | Merchant document upload limits | Validation | **NOT VERIFIED** |
| 86 | OAuth app secret rotation | Developer | **NOT VERIFIED** |
| 87 | API key hashing algorithm | Security | **NOT VERIFIED** without reading code |
| 88 | Sandbox vs production data isolation | Sandbox | **NOT VERIFIED** env flag |
| 89 | Concurrent session limit enforcement | Auth | BR-AUTH-014 session repository |
| 90 | Password history check | Auth | password-history.repository exists |
| 91 | Geo login restrictions | Settings | settings security geo route exists |
| 92 | IP restriction enforcement | Settings | api-ip-restrictions routes exist — middleware **NOT VERIFIED** |
| 93 | Maintenance mode operations API | Operations | PUT maintenance exists |
| 94 | Dead letter queue auto-replay | Worker | manual retry API only |
| 95 | Webhook signature algorithm version | Webhooks | **NOT VERIFIED** |
| 96 | Checkout theme versioning | Checkout | themes API exists |
| 97 | Subscription dunning automation | Subscriptions | dunning API — worker link **NOT VERIFIED** |
| 98 | Settlement batch auto-generation | Settlements | **NOT VERIFIED** |
| 99 | Payout bank verification | Payouts | **NOT VERIFIED** |
| 100 | Reconciliation auto-match ML/rules | Reconciliation | match endpoint exists — rules **NOT VERIFIED** |

## Cross References

- [Traceability_Metrics.md](./Traceability_Metrics.md)
- [Repository_Certification.md](./Repository_Certification.md)
