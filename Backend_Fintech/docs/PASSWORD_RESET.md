# Password Reset Flow

## API Contract

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/api/v1/auth/forgot-password` | POST | Request reset link (always returns generic success message) |
| `/api/v1/auth/reset-password` | POST | Set new password with token |

## Forgot Password Flow

1. User submits email to `forgot-password`.
2. If account exists:
   - Secure token generated and hashed (SHA-256) in `password_reset_tokens`.
   - Audit event `password_reset_requested` recorded (email only — **token never logged**).
   - Background job `password_reset_email` enqueued with:
     - `recipient`: user email
     - `resetUrl`: `{CORS_ORIGIN}/auth/reset-password?token=<raw-token>`
3. Worker processes job and sends email via `EmailService` (SMTP).
4. Email delivery logged in `email_delivery_log`.

## Reset URL

Built by `buildPasswordResetUrl()` using `CORS_ORIGIN` from environment. The frontend route is `/auth/reset-password?token=`.

**Production requirement:** Set `CORS_ORIGIN` to the exact frontend URL (e.g. `https://portal.example.com`).

## Reset Password Flow

1. Frontend submits token + new password to `reset-password`.
2. Token hash looked up; expired/used tokens rejected.
3. Password policy validated; history checked for reuse.
4. Password updated; token marked used; sessions revoked.
5. Audit event `password_reset_completed` recorded.

## Email Queue

Password reset emails use the same background job queue as invoice emails. Ensure:

- SMTP configured in `smtp_settings`
- Worker running (`npm run worker` or Docker `worker` service)

## Security Notes

- Raw tokens exist only in the email URL and are never written to logs or audit metadata.
- Reset tokens expire per `RESET_TOKEN_EXPIRY_MINUTES`.
- Generic response prevents email enumeration.
