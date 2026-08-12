# Runbook: Key Rotation

> **Enterprise Delivery — Phase 8** · v1.0.0-rc1 · Section 18 · 2026-08-03

> Evidence-based handover documentation. Unsupported claims marked **NOT VERIFIED**.

---



## Purpose

Operational runbook for **Key Rotation** incidents in Merchant Pro v1.0.0-rc1.

## Evidence

| Source | Location |
|--------|----------|
| Primary | JWT_SECRET env |
| Secondary | NOT VERIFIED zero-downtime rotation procedure |

## Severity

Refer to [Operations_Matrices.md](../Operations_Matrices.md) — Severity Matrix.

## Detection

| Signal | Evidence | Verification |
|--------|----------|--------------|
| Health endpoints failing | /api/ready, /api/health | VERIFIED |
| Automated alerting | NOT VERIFIED PagerDuty/Opsgenie | NOT VERIFIED |

## Response Steps

1. Confirm incident scope via health endpoints and application logs (**log aggregation NOT VERIFIED**).
2. Identify affected component using evidence sources above.
3. Execute component-specific recovery (see linked docs).
4. Validate recovery via smoke tests (CHANGELOG: 101 integration, 75 E2E).
5. Document incident — formal ticketing integration **NOT VERIFIED**.

## Escalation

See [Operations_Matrices.md](../Operations_Matrices.md) — Escalation Matrix.

## Post-Incident

Update [docs/07_Governance/Risk_Register.md](../../07_Governance/Risk_Register.md) if new risk identified.

## Verification Status

Procedure derived from repository documentation. Production-specific steps (on-call contacts, SLAs) are **NOT VERIFIED** unless listed in evidence sources.
