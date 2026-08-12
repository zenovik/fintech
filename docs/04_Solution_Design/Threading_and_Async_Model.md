# Threading and Async Model

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [Model](#model)
3. [Blocking Avoidance](#blocking-avoidance)
4. [Signal Handling](#signal-handling)

---

## Purpose

Node.js concurrency characteristics.

## Model

No worker threads for business logic; async/await throughout; Promise.all for independent health checks.

## Blocking Avoidance

No sync fs in hot path; PDF generation and email async.

## Signal Handling

Worker SIGTERM graceful shutdown completes current tick.
