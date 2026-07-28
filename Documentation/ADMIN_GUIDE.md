# Admin Guide — Merchant Pro v1.0.0 RC1

Administrator guide for platform configuration, security, and user management.

**Primary admin account (UAT):** `admin@merchantpro.com` / `Password123!`

---

## Managing Users

Navigate to **Users** (`/users`).

### Permissions required

| Action | Permission |
| ------ | ---------- |
| View users | `users:read` |
| Create/edit users | `users:write` |
| Delete users | `users:delete` |

### User operations

1. **Create user** — Provide email, name, password, and assign roles.
2. **Edit user** — Update profile, status (active/inactive), and role assignments.
3. **Deactivate user** — Set status to inactive; existing sessions remain until revoked.
4. **Assign roles** — Link user to organization roles via the user detail view.

### API reference

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/v1/users` | List users |
| POST | `/api/v1/users` | Create user |
| GET | `/api/v1/users/:id` | Get user |
| PUT | `/api/v1/users/:id` | Update user |
| DELETE | `/api/v1/users/:id` | Delete user |

---

## Managing Roles

Navigate to **Roles** (`/roles`).

### Permissions required

| Action | Permission |
| ------ | ---------- |
| View roles | `roles:read` |
| Create/edit roles | `roles:write` |
| Delete roles | `roles:delete` |
| Manage permissions | `permissions:manage` |

### Role operations

1. **Create role** — Define name, code, and description.
2. **Assign permissions** — Select from 69 available permissions.
3. **Edit role** — Modify permission set (changes apply immediately to users with that role).
4. **Delete role** — Remove role if no users are assigned.

### Built-in roles

| Role | Description |
| ---- | ----------- |
| Super Admin | Full access (`*` permission bypass) |
| Admin | Organization administrator |
| Finance Manager | Financial operations access |
| Support Agent | Support ticket management |
| Read Only | View-only access |

### API reference

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/v1/roles` | List roles |
| POST | `/api/v1/roles` | Create role |
| PUT | `/api/v1/roles/:id/permissions` | Update role permissions |
| GET | `/api/v1/permissions` | List all permissions |

---

## RBAC

Role-Based Access Control is enforced at both the API and UI layers.

### Permission format

`{resource}:{action}` — e.g., `merchants:read`, `refunds:approve`, `system:view`

### Organization role caps

When a user belongs to an organization, their effective permissions may be capped by organization membership role:

| Org role | Capabilities |
| -------- | ------------ |
| `owner` / `admin` | Full global permissions |
| `viewer` | Read and export only |
| `member` | Read/export; no write/approve/resolve/delete/manage |

### Super admin bypass

Users with the `super_admin` role bypass all permission checks regardless of assigned permissions.

### Verifying permissions

1. Log in as the target user.
2. Attempt the restricted action — UI elements are hidden by permission guards.
3. Check API response — `403 Forbidden` if permission is missing.

---

## Feature Flags

Navigate to **Settings → Feature Flags** (`/settings/feature-flags`).

### Permissions required

- `settings:read` — view flags
- `settings:write` — create/update/delete flags

### Operations

1. **View flags** — See all organization feature flags and their enabled/disabled state.
2. **Create flag** — Define key, description, and default state.
3. **Toggle flag** — Enable or disable a feature for the organization.
4. **Delete flag** — Remove a custom flag.

Public feature flags are also available without authentication at `GET /api/v1/settings/public/feature-flags` for frontend bootstrap.

---

## System Status

Navigate to **Settings → System Status** (`/settings/system-status`).

### Permission required

`system:view`

### What it shows

| Panel | Source endpoint | Indicators |
| ----- | ---------------- | ---------- |
| Health | `/api/v1/system/health` | Application, database, AI provider (green/yellow/red) |
| Readiness | `/api/v1/system/readiness` | Database, AI, storage, queues |
| Version | `/api/v1/system/version` | Version, build, commit, environment |

Health states:

- **Green (healthy/up):** Component operating normally
- **Yellow (degraded):** Partial functionality (e.g., AI key missing for non-Gemini provider)
- **Red (unhealthy/down):** Component failed

Public liveness probe (no auth): `GET /api/health`

---

## AI Configuration

AI is configured via backend environment variables. There is no UI for changing the AI provider or model at runtime.

### Environment variables

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `AI_PROVIDER` | `gemini` | Provider selection |
| `GEMINI_API_KEY` | — | Google Gemini API key (required for AI) |
| `GEMINI_MODEL` | `gemini-flash-latest` | Model name |
| `AI_TIMEOUT_MS` | `30000` | Provider timeout |
| `AI_MAX_OUTPUT_TOKENS` | `1024` | Max response tokens |
| `AI_TEMPERATURE` | `0.7` | Sampling temperature |
| `AI_RATE_LIMIT_PER_MINUTE` | `20` | Per-user rate limit |

### Permissions

| Feature | Permission |
| ------- | ---------- |
| General AI chat | `ai:chat` |
| Dashboard AI | `ai:chat` + `dashboard:read` |

### Verifying AI status

1. Check **System Status** — AI provider should show green when `GEMINI_API_KEY` is set.
2. Test chat: ask a business question (e.g., "How many transactions today?").
3. Check readiness: `GET /api/v1/system/readiness` — `ai: true` when key is configured.

### Provider notes

- **Gemini:** Fully implemented (default)
- **OpenAI / Groq:** Configured but not implemented; selecting them returns `503`

After changing AI environment variables, restart the backend (PM2 reload or Docker restart).

---

## Audit Logs

Navigate to **Audit** (`/audit`).

### Permissions required

| Action | Permission |
| ------ | ---------- |
| View logs | `audit:read` |
| Export logs | `audit:export` |

### Log types

| Type | Description |
| ---- | ----------- |
| Audit logs | User actions (create, update, delete) with entity details |
| API logs | HTTP request/response metadata |
| Webhook logs | Inbound/outbound webhook events |

### Correlation

All log entries include `correlation_id` matching the `X-Request-Id` request header for cross-service tracing.

### API reference

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/v1/audit` | Audit log list |
| GET | `/api/v1/audit/:id` | Audit log detail |
| GET | `/api/v1/audit/export` | Export audit data |
| GET | `/api/v1/audit/categories` | Audit categories |
| GET | `/api/v1/audit/actions` | Audit action types |
| GET | `/api/v1/audit/api-logs` | API log list |
| GET | `/api/v1/audit/webhook-logs` | Webhook log list |

---

## Password Policy

Navigate to **Settings → Password Policy** (`/settings/password-policy`).

### Permissions required

- `settings:read` — view policy
- `settings:write` — update policy

### Configurable rules

| Setting | Description |
| ------- | ----------- |
| Minimum length | Minimum password character count |
| Require uppercase | At least one uppercase letter |
| Require lowercase | At least one lowercase letter |
| Require number | At least one digit |
| Require special character | At least one special character |
| Password history | Number of previous passwords blocked from reuse |
| Expiry days | Days before password must be changed (0 = no expiry) |

Changes apply to new passwords and password changes immediately.

### Backend enforcement

Password hashing uses bcrypt with rounds configured via `BCRYPT_ROUNDS` (default 12).

Login lockout is controlled by:

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `MAX_LOGIN_ATTEMPTS` | 5 | Failed attempts before lock |
| `LOCK_DURATION_MINUTES` | 30 | Account lock duration |

---

## Session Management

Navigate to **Settings → Session** (`/settings/session`).

### Permissions required

- `settings:read` — view session policy
- `settings:write` — update session policy

### Organization session policy

| Setting | Description |
| ------- | ----------- |
| Idle timeout | Minutes of inactivity before session expires |
| Max concurrent sessions | Maximum active sessions per user |
| Force single session | Only one active session allowed |

### Global session settings (read-only)

Available at `GET /api/auth/session-settings`. Controlled by backend environment:

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `SESSION_IDLE_MINUTES` | 15 | Idle timeout |
| `JWT_EXPIRES_IN` | 15m | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | 7d | Refresh token TTL |
| `TRUST_DEVICE_DAYS` | 30 | Remember-device duration |

### User session management

Users can manage their own sessions at **Settings → Account** (`/settings/account`):

- View active sessions (device, IP, last activity)
- Revoke individual sessions
- Revoke all other sessions

Admin API:

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/auth/sessions` | List user's sessions |
| DELETE | `/api/auth/sessions/others` | Revoke other sessions |
| DELETE | `/api/auth/session/:id` | Revoke specific session |

---

## Additional Admin Settings

| Setting page | Path | Permission |
| ------------ | ---- | ---------- |
| General | `/settings/general` | Authenticated |
| Business | `/settings/business` | `settings:read` |
| Branding | `/settings/branding` | `settings:read` |
| Security | `/settings/security` | `settings:read` |
| Notifications | `/settings/notifications` | Authenticated |
| API Settings | `/settings/api` | `settings:read` |
| Storage | `/settings/storage` | `settings:read` |
| Account Security | `/settings/account` | Authenticated |

See [API_GUIDE.md — Settings](./API_GUIDE.md#settings) for API details.
