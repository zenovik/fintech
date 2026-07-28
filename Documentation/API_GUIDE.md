# API Guide — Merchant Pro v1.0.0 RC1

Base URL: `http://localhost:3000/api` (development)  
Production: `https://<your-domain>/api` (via reverse proxy)

Interactive documentation: `GET /api/docs` (Swagger UI)

---

## Standard Response Envelope

All JSON endpoints return:

**Success:**

```json
{
  "success": true,
  "message": "optional message",
  "data": {}
}
```

**Error:**

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": {}
}
```

**Common headers (protected routes):**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `Authorization` | Yes | `Bearer <accessToken>` |
| `x-organization-id` | When JWT lacks org | Organization ID for scoping |
| `X-Request-Id` | Optional | Correlation ID (auto-generated if omitted) |

---

## Authentication

Prefix: `/api/auth`

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/login` | Public | Email/password login |
| POST | `/verify-otp` | Public | Complete MFA challenge |
| POST | `/resend-otp` | Public | Resend OTP |
| POST | `/forgot-password` | Public | Request password reset |
| POST | `/reset-password` | Public | Reset password with token |
| POST | `/refresh-token` | Public | Rotate access + refresh tokens |
| POST | `/select-organization` | JWT | Embed org in access token |
| POST | `/logout` | JWT | Revoke session |
| GET | `/me` | JWT | Current user profile |
| GET | `/sessions` | JWT | List active sessions |
| DELETE | `/sessions/others` | JWT | Revoke other sessions |
| DELETE | `/session/:id` | JWT | Revoke specific session |
| POST | `/change-password` | JWT | Change password |
| PUT | `/mfa-preferences` | JWT | Update MFA settings |
| GET | `/session-settings` | JWT | Global session policy (read-only) |

### Login

**Request:**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@merchantpro.com",
  "password": "Password123!",
  "rememberDevice": false
}
```

**Success (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "15m",
    "user": {
      "uuid": "a1b2c3d4-...",
      "email": "admin@merchantpro.com",
      "firstName": "Admin",
      "lastName": "User",
      "mfaEnabled": false
    },
    "organizations": [
      {
        "id": 1,
        "uuid": "...",
        "code": "merchantpro",
        "displayName": "Merchant Pro",
        "roleCode": "admin",
        "isDefault": true
      }
    ],
    "requiresOrganizationSelection": false
  }
}
```

Refresh token is set as an httpOnly cookie (`refreshToken`), not in the response body.

**MFA challenge (202):**

```json
{
  "success": true,
  "message": "MFA verification required",
  "data": {
    "challengeId": "uuid",
    "nextStep": "otp",
    "maskedDestination": "***1234",
    "expiresAt": "2026-07-27T12:00:00.000Z"
  }
}
```

### Refresh token

```http
POST /api/auth/refresh-token
Content-Type: application/json
Cookie: refreshToken=<token>

{
  "organizationId": 1
}
```

### Select organization

```http
POST /api/auth/select-organization
Authorization: Bearer <token>

{ "organizationId": 1 }
```

---

## Dashboard APIs

Prefix: `/api/v1/dashboard/executive`  
Permission: `dashboard:read` (export: `dashboard:export`, AI: `ai:chat`)

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/summary` | Executive KPI summary |
| GET | `/charts/revenue` | Revenue chart data |
| GET | `/charts/payment-methods` | Payment method breakdown |
| GET | `/charts/regional-distribution` | Regional distribution |
| GET | `/transactions/high-value` | High-value transactions |
| GET | `/activities` | Recent activity feed |
| GET | `/fraud-alerts` | Fraud alert list |
| POST | `/export` | Export dashboard report |
| GET | `/preferences` | User dashboard preferences |
| PUT | `/preferences` | Update preferences |
| POST | `/ai/chat` | Dashboard-scoped AI chat |

**Query parameters:** `period` (`daily`, `weekly`, `monthly`), `from`, `to`

**Example — summary:**

```http
GET /api/v1/dashboard/executive/summary?period=monthly
Authorization: Bearer <token>
x-organization-id: 1
```

**Example — dashboard AI:**

```http
POST /api/v1/dashboard/executive/ai/chat
Authorization: Bearer <token>
x-organization-id: 1

{
  "message": "Summarize revenue trends",
  "period": "monthly",
  "quickAction": "summarize_revenue"
}
```

---

## Merchant APIs

Prefix: `/api/v1/merchants`  
Permissions: `merchants:read`, `merchants:write`, `merchants:delete`

| Method | Path | Permission | Description |
| ------ | ---- | ---------- | ----------- |
| GET | `/search` | read | Quick search |
| GET | `/statistics` | read | Merchant statistics |
| GET | `/` | read | Paginated list |
| POST | `/` | write | Create merchant |
| GET | `/:id` | read | Get by ID |
| PUT | `/:id` | write | Update merchant |
| PATCH | `/:id/status` | write | Update status |
| DELETE | `/:id` | delete | Soft delete |
| GET | `/:id/transactions` | read | Merchant transactions |
| GET | `/:id/settlements` | read | Merchant settlements |
| GET | `/:id/documents` | read | KYC documents |
| POST | `/:id/documents` | write | Upload document |
| DELETE | `/:id/documents/:documentId` | write | Delete document |

**Create merchant:**

```json
{
  "legalName": "Acme Payments LLC",
  "displayName": "Acme",
  "businessType": "ecommerce",
  "regionId": 1,
  "kycStatus": "pending",
  "riskLevel": "low",
  "status": "pending",
  "contacts": [
    { "firstName": "John", "lastName": "Doe", "email": "john@acme.com" }
  ],
  "addresses": [
    { "line1": "123 Main St", "city": "New York", "countryCode": "US" }
  ]
}
```

**List query:** `page`, `pageSize`, `search`, `status`, `kycStatus`, `riskLevel`, `sortBy`, `sortOrder`

---

## Transaction APIs

Prefix: `/api/v1/transactions`  
Permissions: `transactions:read`, `transactions:write`, `transactions:export`

| Method | Path | Permission | Description |
| ------ | ---- | ---------- | ----------- |
| GET | `/search` | read | Quick search |
| GET | `/statistics` | read | Transaction statistics |
| GET | `/export` | export | Export transactions |
| GET | `/disputes` | chargebacks:read | List disputes |
| POST | `/disputes` | chargebacks:write | Create dispute |
| GET | `/` | read | Paginated list |
| POST | `/` | write | Create transaction |
| GET | `/:id` | read | Get by ID |
| PATCH | `/:id/status` | write | Update status |
| POST | `/:id/refund` | refunds:write | Initiate refund |

**Create transaction:**

```json
{
  "merchantId": 1,
  "amount": 99.99,
  "currency": "USD",
  "paymentMethodTypeId": 1,
  "paymentMethodDetail": "Visa ****4242",
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "description": "Order #1234"
}
```

**Refund from transaction:**

```json
{
  "amount": 50.00,
  "reason": "Partial refund requested"
}
```

---

## Settlement APIs

Prefix: `/api/v1/settlements`  
Permissions: `settlements:read`, `settlements:write`, `settlements:export`

| Method | Path | Permission | Description |
| ------ | ---- | ---------- | ----------- |
| GET | `/search` | read | Quick search |
| GET | `/statistics` | read | Settlement statistics |
| GET | `/export` | export | Export settlements |
| GET | `/batches` | read | List batches |
| POST | `/batches` | write | Create batch |
| GET | `/batches/:id` | read | Batch detail |
| GET | `/` | read | Paginated list |
| POST | `/` | write | Create settlement |
| GET | `/:id` | read | Get by ID |
| PATCH | `/:id/status` | write | Update status |
| GET | `/:id/transactions` | read | Linked transactions |
| POST | `/:id/reversal` | write | Reverse settlement |

**Create settlement:**

```json
{
  "merchantId": 1,
  "grossAmount": 10000.00,
  "feeAmount": 250.00,
  "currency": "USD",
  "settlementCycle": "daily",
  "transactionIds": [101, 102, 103]
}
```

---

## Refund APIs

Prefix: `/api/v1/refunds`  
Permissions: `refunds:read`, `refunds:write`, `refunds:approve`

| Method | Path | Permission | Description |
| ------ | ---- | ---------- | ----------- |
| GET | `/statistics` | read | Refund statistics |
| GET | `/` | read | Paginated list |
| POST | `/` | write | Create refund |
| GET | `/:id` | read | Get by ID |
| GET | `/:id/history` | read | Status history |
| POST | `/:id/approve` | approve | Approve refund |
| POST | `/:id/reject` | approve | Reject refund |

**Create refund:**

```json
{
  "transactionId": 42,
  "amount": 25.00,
  "reason": "Customer return"
}
```

**Reject refund:**

```json
{ "reason": "Outside refund window" }
```

---

## Chargeback APIs

Prefix: `/api/v1/chargebacks`  
Permissions: `chargebacks:read`, `chargebacks:write`, `chargebacks:resolve`

| Method | Path | Permission | Description |
| ------ | ---- | ---------- | ----------- |
| GET | `/statistics` | read | Chargeback statistics |
| GET | `/` | read | Paginated list |
| POST | `/` | write | Create chargeback |
| GET | `/:id` | read | Get by ID |
| GET | `/:id/history` | read | Status history |
| GET | `/:id/evidence` | read | List evidence |
| POST | `/:id/evidence` | write | Add evidence |
| POST | `/:id/representment` | write | Submit representment |
| POST | `/:id/resolve` | resolve | Resolve chargeback |

**Create chargeback:**

```json
{
  "transactionId": 42,
  "reason": "Unauthorized transaction",
  "reasonCode": "fraud",
  "cardNetwork": "visa",
  "amount": 150.00
}
```

**Resolve:**

```json
{
  "outcome": "won",
  "notes": "Compelling evidence submitted"
}
```

---

## Reports

### Reports — `/api/v1/reports`

Permissions: `reports:read`, `reports:write`, `reports:export`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/templates` | Report templates |
| GET | `/categories` | Report categories |
| GET | `/history` | Execution history |
| GET | `/scheduled` | Scheduled reports |
| POST | `/scheduled` | Create schedule |
| PUT | `/scheduled/:id` | Update schedule |
| DELETE | `/scheduled/:id` | Delete schedule |
| POST | `/run` | Run report on demand |
| POST | `/export` | Export report |
| GET | `/` | Paginated saved reports |
| POST | `/` | Create saved report |
| GET | `/:id` | Get report |
| PUT | `/:id` | Update report |
| DELETE | `/:id` | Delete report |

**Run report:**

```json
{
  "reportId": 5,
  "templateId": 2,
  "filters": {
    "merchantId": 1,
    "dateFrom": "2026-01-01"
  }
}
```

### Analytics — `/api/v1/analytics`

Permissions: `analytics:read`, `analytics:export`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/overview` | Analytics overview |
| GET | `/revenue` | Revenue analytics |
| GET | `/transactions` | Transaction analytics |
| GET | `/settlements` | Settlement analytics |
| GET | `/merchants` | Merchant analytics |
| GET | `/customers` | Customer analytics |
| GET | `/refunds` | Refund analytics |
| GET | `/chargebacks` | Chargeback analytics |
| GET | `/payouts` | Payout analytics |
| GET | `/payment-links` | Payment link analytics |
| GET | `/invoices` | Invoice analytics |
| GET | `/qr-payments` | QR payment analytics |
| GET | `/subscriptions` | Subscription analytics |
| GET | `/support` | Support analytics |
| GET | `/operations` | Operations analytics |
| GET | `/payment-methods` | Payment method analytics |
| GET | `/regional` | Regional analytics |
| GET | `/export` | Export analytics data |

**Query:** `period`, `dateFrom`, `dateTo`, `merchantId`, `status`

### Exports — `/api/v1/exports`

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/:fileId` | JWT + Org | Download generated export file |

---

## Settings

Prefix: `/api/v1/settings`

| Method | Path | Auth | Permission | Description |
| ------ | ---- | ---- | ---------- | ----------- |
| GET | `/public/branding` | Public | — | Public branding |
| GET | `/public/feature-flags` | Public | — | Public feature flags |
| GET | `/overview` | JWT + Org | settings:read | Settings overview |
| GET/PUT | `/organization` | JWT + Org | read/write | Organization profile |
| GET/PUT | `/branding` | JWT + Org | read/write | Branding |
| GET/PUT | `/security` | JWT + Org | read/write | Security settings |
| GET/PUT | `/password-policy` | JWT + Org | read/write | Password policy |
| GET/PUT | `/session` | JWT + Org | read/write | Session policy |
| GET/PUT | `/notifications/me` | JWT + Org | Authenticated | User notification prefs |
| GET/PUT | `/notifications/defaults` | JWT + Org | read/write | Org notification defaults |
| GET/POST | `/feature-flags` | JWT + Org | read/write | Feature flag CRUD |
| GET/PUT/DELETE | `/feature-flags/:id` | JWT + Org | read/write | Single feature flag |
| GET/PUT | `/api` | JWT + Org | read/write | API settings |
| GET/PUT | `/smtp` | JWT + Org | read/write | SMTP settings |
| GET/PUT | `/storage` | JWT + Org | read/write | Storage settings |

**Branding example:**

```json
{
  "companyName": "Merchant Pro",
  "primaryColor": "#0066CC",
  "secondaryColor": "#003366",
  "accentColor": "#FF6600",
  "logoInitials": "MP"
}
```

---

## Support

Prefix: `/api/v1/support`  
Permissions: `support:read`, `support:write`, `support:manage`

| Method | Path | Permission | Description |
| ------ | ---- | ---------- | ----------- |
| GET | `/statistics` | read | Ticket statistics |
| GET | `/` | read | Paginated ticket list |
| POST | `/` | write | Create ticket |
| GET | `/:id` | read | Get ticket |
| PUT | `/:id` | write | Update ticket |
| POST | `/:id/assign` | manage | Assign ticket |
| POST | `/:id/reassign` | manage | Reassign ticket |
| POST | `/:id/escalate` | manage | Escalate ticket |
| POST | `/:id/close` | manage | Close ticket |
| POST | `/:id/reopen` | manage | Reopen ticket |
| POST | `/:id/notes` | write | Add note |
| POST | `/:id/attachments` | write | Add attachment |

**Create ticket:**

```json
{
  "subject": "Settlement delay",
  "description": "Settlement batch #123 has not processed",
  "category": "settlements",
  "priority": "high",
  "merchantId": 1
}
```

**Paginated response:**

```json
{
  "success": true,
  "data": {
    "items": [],
    "statistics": { "total": 100, "open": 12 },
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

---

## Operations

Prefix: `/api/v1/operations`  
Permissions: `operations:read`, `operations:write`, `operations:manage`

| Method | Path | Permission | Description |
| ------ | ---- | ---------- | ----------- |
| GET | `/dashboard` | read | Ops dashboard summary |
| GET | `/health` | read | System health metrics |
| GET | `/alerts` | read | Active alerts |
| GET | `/incidents` | read | Incidents |
| GET | `/retry-queue` | read | Retry queue |
| GET | `/jobs` | read | Background jobs |
| GET | `/failed-payments` | read | Failed payments |
| GET | `/failed-payouts` | read | Failed payouts |
| GET | `/failed-webhooks` | read | Failed webhooks |
| POST | `/alerts/:id/acknowledge` | write | Acknowledge alert |
| POST | `/alerts/:id/resolve` | write | Resolve alert |
| POST | `/retry-queue/:id/retry` | manage | Retry queue item |
| POST | `/jobs/:id/retry` | manage | Retry job |

---

## AI APIs

Prefix: `/api/v1/ai`  
Permission: `ai:chat`  
Rate limited: `AI_RATE_LIMIT_PER_MINUTE` (default 20)

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/chat` | General AI assistant chat |

**Request:**

```http
POST /api/v1/ai/chat
Authorization: Bearer <token>
x-organization-id: 1

{
  "message": "How many transactions today?",
  "clearHistory": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "reply": "You had 2 transactions today.",
    "sessionId": "uuid"
  }
}
```

When business intent is detected, the backend fetches analytics data and injects it into the prompt. The AI answers using backend data only.

---

## System APIs

Prefix: `/api/v1/system`  
Permission: `system:view` (no organization header required)

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/health` | Detailed system health |
| GET | `/readiness` | Readiness probe |
| GET | `/version` | Version and build info |

**Health response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "application": "up",
    "database": "up",
    "aiProvider": "up",
    "uptimeSeconds": 3600,
    "version": "0.1.0",
    "environment": "production",
    "timestamp": "2026-07-27T17:00:00.000Z"
  }
}
```

**Readiness response:**

```json
{
  "success": true,
  "data": {
    "ready": true,
    "database": true,
    "ai": true,
    "storage": true,
    "queues": true,
    "timestamp": "2026-07-27T17:00:00.000Z"
  }
}
```

**Version response:**

```json
{
  "success": true,
  "data": {
    "version": "0.1.0",
    "build": "production",
    "commit": "abc123",
    "environment": "production"
  }
}
```

### Public health (no auth)

```http
GET /api/health
```

```json
{
  "status": "ok",
  "service": "backend-fintech",
  "environment": "production",
  "timestamp": "2026-07-27T17:00:00.000Z",
  "database": "connected"
}
```

Returns `503` with `"database": "disconnected"` when MySQL is unavailable.

---

## Additional Modules

These modules are mounted but not listed in the primary API guide scope. See Swagger for full details.

| Prefix | Module |
| ------ | ------ |
| `/api/v1/users` | User management |
| `/api/v1/roles` | Role management |
| `/api/v1/permissions` | Permission listing |
| `/api/v1/organizations` | Organization management |
| `/api/v1/customers` | Customer management |
| `/api/v1/payouts` | Payout management |
| `/api/v1/payment-links` | Payment links |
| `/api/v1/public/payment-links` | Public payment link checkout |
| `/api/v1/invoices` | Invoice management |
| `/api/v1/qr-payments` | QR payments |
| `/api/v1/public/qr-payments` | Public QR checkout |
| `/api/v1/subscriptions` | Subscription management |
| `/api/v1/notifications` | Notification inbox |
| `/api/v1/audit` | Audit logs |

---

## RBAC Permission Reference

Full list of 69 permissions. Key examples:

| Permission | Used by |
| ---------- | ------- |
| `dashboard:read` | Dashboard endpoints |
| `merchants:read/write/delete` | Merchant CRUD |
| `transactions:read/write/export` | Transaction management |
| `settlements:read/write/export` | Settlement management |
| `refunds:read/write/approve` | Refund workflow |
| `chargebacks:read/write/resolve` | Chargeback workflow |
| `reports:read/write/export` | Reports |
| `analytics:read/export` | Analytics |
| `settings:read/write` | Settings |
| `support:read/write/manage` | Support tickets |
| `operations:read/write/manage` | Operations center |
| `ai:chat` | AI assistant |
| `system:view` | System status endpoints |
| `audit:read/export` | Audit logs |

Users with `super_admin` role bypass all permission checks.
