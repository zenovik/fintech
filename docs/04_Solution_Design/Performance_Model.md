# Performance Model

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [API](#api)
3. [Worker](#worker)
4. [Frontend](#frontend)
5. [NFR Link](#nfr-link)

---

## Purpose

Throughput and latency considerations.

## API

compression middleware; connection pool sizing; index-backed list queries.

## Worker

Batch claim (WORKER_BATCH_SIZE); concurrent handlers (WORKER_CONCURRENCY); poll interval tuning.

## Frontend

Angular production build served by nginx; lazy-loaded feature modules.

## NFR Link

[01_Product/Non_Functional_Requirements.md](../01_Product/Non_Functional_Requirements.md)
