# Observability Model

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [Health](#health)
3. [Metrics](#metrics)
4. [Logging](#logging)

---

## Purpose

Logs, metrics, traces, health.

## Health

| Endpoint | Use |
|----------|-----|
| /api/live | Process alive |
| /api/ready | DB + Redis ready |
| /api/health | Full dependency matrix |

## Metrics

metrics.registry.ts counters/histograms; exposed at /api/v1/system/metrics.

## Logging

Structured logs with requestId, userId, organizationId on errors.
