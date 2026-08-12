# Implementation Guide

> **Enterprise Delivery — Phase 8** · v1.0.0-rc1 · Section 15 · 2026-08-03

> Evidence-based handover documentation. Unsupported claims marked **NOT VERIFIED**.

---


## Local Setup
1. Copy .env.example → .env
2. npm ci (root)
3. Database: npm run db:setup:unix or build-master.ps1
4. Backend: npm run dev --workspace=Backend_Fintech
5. Worker: npm run worker --workspace=Backend_Fintech
6. Frontend: npm run start --workspace=Frontend_Fintech

Evidence: Backend_Fintech/docs/development/README.md, WORKER.md

## Docker Setup
docker-compose.yml — CHANGELOG.md production stack

## Production Setup
Backend_Fintech/docs/deployment/README.md; .env.production.example

## Deployment Order
1. MySQL (schema via build-master)
2. Redis (optional but recommended multi-worker)
3. Backend API
4. Worker
5. Frontend (nginx/static)

## Health Verification
curl /api/live → 200; curl /api/ready → DB check
