# Testing Governance

> **Enterprise Governance** · v1.0.0-rc1 · Section 11 · Generated 2026-08-03

---


| Layer | Evidence | Verification | Owner |
| --- | --- | --- | --- |
| Unit | test:unit — smoke + security + remediation | Backend_Fintech/package.json | VERIFIED | Backend |
| Integration | 101/101 per CHANGELOG; 17 test files | CHANGELOG.md; Backend_Fintech/scripts/run-integration-tests.mjs | VERIFIED | QA |
| Playwright E2E | 75 tests per CHANGELOG; CI e2e job | .github/workflows/ci.yml | VERIFIED | QA |
| Performance | k6 suite; performance.yml non-blocking | .github/workflows/performance.yml | PARTIAL | DevOps |
| Security | security-hardening.test.ts + security.yml | Backend_Fintech/src/__tests__/ | PARTIAL | Security |
| Coverage | NOT VERIFIED coverage thresholds in CI | NOT VERIFIED | NOT VERIFIED | QA |
| Traceability | docs/06_Code_Traceability/ | 24% full-chain per Phase 2 | PARTIAL | Engineering |


