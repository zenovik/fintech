# API Design

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [Versioning](#versioning)
3. [Format](#format)
4. [Auth](#auth)
5. [Documentation](#documentation)
6. [Idempotency](#idempotency)

---

## Purpose

REST API conventions.

## Versioning

Prefix `/api/v1` for business routes; `/api/live|ready|health` unversioned.

## Format

JSON request/response; `{ success, data }` or error envelope.

## Auth

Bearer JWT in Authorization header; refresh via cookie or body.

## Documentation

Swagger UI on API process; 46 modules tagged by domain.

## Idempotency

Idempotency-Key header on payment and checkout create.
