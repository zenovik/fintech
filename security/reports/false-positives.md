# OWASP ZAP False Positives

Documented false positives and accepted scan noise for DAST baseline runs.

| Alert | Reason | Action |
|-------|--------|--------|
| Content Security Policy (CSP) Header Not Set (dev) | CSP disabled via `CSP_ENABLED=false` in CI/security scans | Expected in scan environment; production enables Helmet CSP |
| Strict-Transport-Security Header Not Set (local) | HSTS only enabled when `NODE_ENV=production` | Accepted for local HTTP scans; enforced in production |
| Cross-Domain Misconfiguration | Angular dev server + API on different ports | CORS explicitly configured; not exploitable with credentials without origin allowlist |
| X-Content-Type-Options Header Missing (static assets) | Some static paths served without API middleware | nginx adds nosniff for SPA; API uses Helmet |
| Cookie Without Secure Flag (local) | Secure cookies only in production | Accepted for local HTTP; production sets Secure |
| User Agent Fuzzer | Informational scanner noise | Ignored |
| Modern Web Application | Informational — SPA detected | Ignored |
| Authentication Request Identified | Informational — login endpoint discovered | Ignored; rate limiting + lockout in place |

Re-evaluate after each release if scan targets or deployment topology change.
