# Third Party Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · 2026-07-29

---

## External Integrations

| Integration | Protocol | Direction | Config | Module |
|-------------|----------|-----------|--------|--------|
| **MySQL 8** | TCP 3306 | Inbound to DB | DB_* env | All repositories |
| **Redis 7** | TCP 6379 | Inbound to cache | REDIS_* env | locks, cache, heartbeat |
| **SMTP** | TLS | Outbound | settings SMTP / env | email.service.ts |
| **Google Gemini** | HTTPS REST | Outbound | GEMINI_* | ai module |
| **OpenAI** | HTTPS REST | Outbound | OPENAI_* | ai module |
| **Groq** | HTTPS REST | Outbound | GROQ_* | ai module |
| **Merchant webhooks** | HTTPS POST + HMAC | Outbound | webhook endpoints | webhooks module |
| **Payment gateway** | HTTPS REST | Outbound | payment-config | payments module |

## SMTP

| Aspect | Evidence |
|--------|----------|
| Library | nodemailer |
| Configuration | `/api/v1/settings/smtp` + DB |
| Failure handling | retry_queue email_retry, emailService.retryFailedEmails |
| Retries | Worker idle + retry queue |

## AI Providers

| Provider | Auth | Failure handling |
|----------|------|------------------|
| Gemini | API key header | AI_TIMEOUT_MS, rate limit middleware |
| OpenAI | Bearer API key | Same |
| Groq | Bearer API key | Same |

**Fallback between providers:** **NOT VERIFIED**

## Outbound Webhooks

| Aspect | Evidence |
|--------|----------|
| Signing | HMAC — webhook-delivery.engine.ts |
| Timeout | WEBHOOK_TIMEOUT_MS |
| Retry | WEBHOOK_RETRY_* + retry_queue |
| Delivery tables | webhook_delivery_queue, payment_webhook_deliveries |

## Payment Gateway

| Aspect | Status |
|--------|--------|
| Abstraction layer | payment-engine.service.ts |
| External PSP credentials | payment-config / merchant settings |
| Actual PSP vendor name | **NOT VERIFIED** from code without reading gateway adapter |

## NOT FOUND

| Service | Status |
|---------|--------|
| Stripe SDK | **NOT in package.json** |
| Razorpay SDK | **NOT in package.json** |
| AWS S3 SDK | **NOT in package.json** — storage settings exist, adapter **NOT VERIFIED** |
| SendGrid SDK | **NOT FOUND** — uses nodemailer |

## Cross References

- [02_Architecture/Integration_Architecture.md](../02_Architecture/Integration_Architecture.md)
- [Configuration_Inventory.md](./Configuration_Inventory.md)
