# Governance Overview

> **Enterprise Governance** · v1.0.0-rc1 · Section 1 · Generated 2026-08-03

---


## Purpose

Enterprise governance layer certifying Merchant Pro v1.0.0-rc1 across engineering, security, architecture, compliance, operations, quality, risk, and deployment dimensions. All statements derive from repository evidence or are marked **NOT VERIFIED**.

## Scope

Monorepo: `Frontend_Fintech/`, `Backend_Fintech/`, `Database_Fintech/`, `e2e/`, `docs/`, `engineering-intelligence/`, `engineering-knowledge/`, `frontend-analysis/`, `backend-analysis/`, `security/`.

## Repository Version

| Attribute | Value | Evidence |
|-----------|-------|----------|
| Product version | 1.0.0-rc1 | CHANGELOG.md |
| Backend package | 0.1.0 | Backend_Fintech/package.json |
| Architecture version | 1.0.0-rc1 | docs/02_Architecture/README.md |

## Supported Platforms

| Platform | Version | Evidence | Verification |
| --- | --- | --- | --- |
| Node.js | 20 | .github/workflows/ci.yml | VERIFIED |
| MySQL | 8.0 | .github/workflows/ci.yml services | VERIFIED |
| Angular | 19 | CHANGELOG.md | VERIFIED |
| Redis | 7 (optional) | Backend_Fintech/docs/REDIS.md | VERIFIED |
| Docker Compose | Production stack | CHANGELOG.md | VERIFIED |



## Deployment Models

| Model | Evidence | Verification |
| --- | --- | --- |
| Docker Compose (mysql, redis, backend, worker, frontend) | CHANGELOG.md | VERIFIED |
| Kubernetes / Helm | NOT VERIFIED in repository | NOT VERIFIED |
| Multi-region | docs/02_Architecture/Disaster_Recovery.md — single region rc1 | PARTIAL |



## Document Ownership

| Domain | Owner | Review Cycle |
|--------|-------|--------------|
| Engineering Standards | Engineering Lead | Quarterly |
| Security Governance | Security Lead | Quarterly |
| Architecture Governance | Solution Architect | Per release |
| Operations | DevOps Lead | Quarterly |
| Compliance | Compliance Officer | Annual — **NOT VERIFIED** role assignment |

## Review Process

1. Evidence refresh from `frontend-analysis/`, `backend-analysis/`, `engineering-knowledge/` runs
2. Cross-check against `docs/01_Product/` through `docs/06_Code_Traceability/`
3. Update `07_Governance/` via `docs/_scripts/generate-governance.mjs`
4. Mark unsupported claims **NOT VERIFIED**

## Approval Workflow

Draft → Engineering Review → Security Review → Architecture Review → Executive Sign-off (**NOT VERIFIED** — no signed approval artifact in repository)

## Document Lifecycle

| State | Description |
|-------|-------------|
| Active | Evidence-backed, current release |
| Partial | Some controls NOT VERIFIED |
| Deprecated | Superseded by newer governance run |

## Cross References

- [Engineering_Standards.md](./Engineering_Standards.md)
- [Security_Standards.md](./Security_Standards.md)
- [Compliance_Matrix.md](./Compliance_Matrix.md)
- [Final_Enterprise_Certification.md](./Final_Enterprise_Certification.md)
