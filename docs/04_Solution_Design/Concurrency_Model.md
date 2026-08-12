# Concurrency Model

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [API](#api)
3. [Worker](#worker)
4. [Locks](#locks)

---

## Purpose

Parallel execution model.

## API

Node.js single-threaded event loop; concurrent requests via async I/O; pool connections bounded.

## Worker

WORKER_CONCURRENCY parallel tasks per tick; queue claims serialized per table via FOR UPDATE transactions.

## Locks

Redis distributed locks for cross-instance duplicate prevention.
