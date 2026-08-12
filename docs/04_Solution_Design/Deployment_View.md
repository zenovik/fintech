# Deployment View

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [Stack](#stack)
3. [Environment](#environment)
4. [Artifacts](#artifacts)

---

## Purpose

Mapping of software to Docker Compose deployment.

## Stack

Five services on fintech-network; backend health gates worker and frontend startup.

## Environment

Secrets via .env: JWT_SECRET, MYSQL_PASSWORD, CONFIG_ENCRYPTION_KEY, CORS_ORIGIN.

## Artifacts

Backend/Frontend built via Dockerfiles; DB seeded from master_database.sql on first mysql start.
