# Risk Register

> **Enterprise Governance** · v1.0.0-rc1 · Section 14 · Generated 2026-08-03

---


| ID | Risk | Severity | Probability | Impact | Owner | Mitigation | Evidence | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-01 | API surface exceeds integration test module coverage | Medium | Low | High | Engineering | Expand integration tests per module | docs/05_Repository_Audit/Repository_Risk_Register.md | VERIFIED |
| R-02 | Security/performance CI workflows non-blocking | Medium | Medium | Medium | DevOps | Remove continue-on-error or add merge gate | .github/workflows/security.yml | VERIFIED |
| R-03 | Raw SQL maintenance without ORM | Low | High | Low | Backend Lead | Repository pattern + AST SQL map | backend-analysis/output/json/repository-sql-map.json | VERIFIED |
| R-04 | TypeScript version mismatch FE/BE | Low | Medium | Low | Engineering | Align TS versions | docs/06_Code_Traceability/Implementation_Gaps.md#58 | VERIFIED |
| R-05 | Redis optional — lock degradation path | Medium | Medium | Medium | Operations | Document REDIS_ENABLED=false behavior | Backend_Fintech/docs/REDIS.md | VERIFIED |
| R-06 | Single master SQL migration model | Medium | Medium | Medium | DBA | build-master.ps1 discipline | Database_Fintech/scripts/build-master.ps1 | VERIFIED |
| R-07 | Worker polling bottleneck at scale | Medium | Medium | Medium | Operations | Horizontal worker replicas | Backend_Fintech/docs/WORKER.md | VERIFIED |
| R-08 | 97 unresolved FE HttpClient→endpoint mappings | Medium | Medium | Medium | Frontend Lead | Resolve remaining URLs in AST analyzer | frontend-analysis/output/json/run-summary.json | VERIFIED |
| R-09 | 183 backend architecture violations (DI graph) | Low | High | Low | Backend Lead | Review repository_without_service flags | backend-analysis/output/validation/validation-report.json | VERIFIED |
| R-10 | PCI-DSS traceability not in repository | High | Medium | High | Compliance | External PCI assessment — NOT VERIFIED in repo | docs/06_Code_Traceability/Implementation_Gaps.md#46 | NOT VERIFIED |
| R-11 | SOC2 / ISO27001 certification not in repository | High | Low | High | Compliance | External audit required | NOT VERIFIED | NOT VERIFIED |
| R-12 | Live OWASP ZAP DAST reports absent | Medium | Medium | Medium | Security | Run security/scripts/run-zap.mjs with Docker | security/reports/risk-summary.md | NOT VERIFIED |
| R-13 | Payment gateway vendor SDK not evidenced | Medium | Medium | Medium | Payments | Custom gateway layer — vendor NOT VERIFIED | docs/05_Repository_Audit/Repository_Risk_Register.md#R-13 | NOT VERIFIED |
| R-14 | Prometheus / OpenTelemetry not in codebase | Low | Medium | Low | DevOps | Add observability stack | docs/06_Code_Traceability/Implementation_Gaps.md#59 | NOT VERIFIED |
| R-15 | Multi-region DR not implemented | Medium | Low | High | Operations | Single-region rc1 per architecture docs | docs/02_Architecture/Disaster_Recovery.md | PARTIAL |


