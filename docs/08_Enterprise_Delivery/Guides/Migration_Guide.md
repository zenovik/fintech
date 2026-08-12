# Migration Guide

> **Enterprise Delivery — Phase 8** · v1.0.0-rc1 · Section 16 · 2026-08-03

> Evidence-based handover documentation. Unsupported claims marked **NOT VERIFIED**.

---


## Database Migration
Database_Fintech/scripts/build-master.ps1 → master_database.sql

## Upgrade Process
1. Pull release tag
2. Rebuild master SQL
3. Apply delta scripts if any in Database_Fintech/scripts/
4. Run integration tests

## Rollback
7 partial rollback scripts — full rollback **NOT VERIFIED** for all 223 tables

## Breaking Changes
Document in CHANGELOG.md per release

## Version Compatibility
v1.0.0-rc1 — Node 20, MySQL 8, Angular 19
