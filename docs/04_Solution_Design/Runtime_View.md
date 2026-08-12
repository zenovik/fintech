# Runtime View

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [Processes](#processes)
3. [Request Lifecycle](#request-lifecycle)
4. [Worker Lifecycle](#worker-lifecycle)

---

## Purpose

Processes at runtime.

## Processes

| Process | Entry | Role |
|---------|-------|------|
| API Server | dist/server.js | HTTP request handling |
| Worker | dist/worker.js | Queue polling |
| MySQL | mysqld | Persistence |
| Redis | redis-server | Locks/cache |

## Request Lifecycle

Express middleware pipeline → route handler → service → DB → JSON response.

## Worker Lifecycle

Poll interval tick → parallel queue claims → handler execution → metrics update → heartbeat Redis key.
