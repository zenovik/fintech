# Integration Model

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [REST](#rest)
3. [Webhooks](#webhooks)
4. [Email](#email)
5. [Gateway](#gateway)

---

## Purpose

External integration patterns.

## REST

Inbound developer API with API keys and JWT.

## Webhooks

Outbound HMAC-signed POST with retry.

## Email

SMTP via Nodemailer for invoices, password reset, notifications.

## Gateway

Payment gateway abstraction in payment-engine for authorize/capture.
