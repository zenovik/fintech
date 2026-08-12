# Validation Model

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [Zod](#zod)
3. [Sanitization](#sanitization)
4. [CSRF](#csrf)

---

## Purpose

Input validation at API boundary.

## Zod

Module dto/*.ts schemas; parse in controllers or middleware.

## Sanitization

Email normalization, amount precision DECIMAL(18,2), enum validation against DB enums.

## CSRF

Mutating requests require valid CSRF token except exempt paths (health, public checkout).
