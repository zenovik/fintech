# Operational View

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [Health](#health)
3. [Admin](#admin)
4. [Log Access](#log-access)

---

## Purpose

Operations, monitoring, and admin workflows.

## Health

GET /api/live, /api/ready, /api/health — see Observability_Model.

## Admin

System module: metrics, admin status, worker queue depths.

## Log Access

backend_logs volume; structured JSON with requestId correlation.
