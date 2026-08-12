# Physical View

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [Single Host](#single-host)
3. [Ports](#ports)
4. [Storage](#storage)

---

## Purpose

Hardware and container mapping.

## Single Host

All compose services on one VM for UAT; production may split MySQL to managed service.

## Ports

Frontend 4200, Backend 3000, MySQL 3306, Redis 6379 (host-mapped in dev).

## Storage

Persistent volumes for mysql_data, uploads, logs.
