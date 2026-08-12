# Non-Functional Requirements — Merchant Pro

Requirements use prefix **NFR-**.

## Performance

| ID | Requirement | Target | Verification |
|----|-------------|--------|--------------|
| NFR-PERF-001 | API p95 response time under normal load | < 500 ms | k6 smoke/load thresholds |
| NFR-PERF-002 | API p99 response time | < 1000 ms | k6 thresholds |
| NFR-PERF-003 | Error rate under smoke load | < 1% | k6 `http_req_failed` |
| NFR-PERF-004 | Payment create p95 | < 800 ms | k6 custom metric |
| NFR-PERF-005 | Public checkout pay p95 | < 1000 ms | k6 custom metric |
| NFR-PERF-006 | JSON body size limit | 10 MB max | Express config |
| NFR-PERF-007 | Worker poll interval | 3 s default | Env config |

## Availability

| ID | Requirement | Target | Verification |
|----|-------------|--------|--------------|
| NFR-AVAIL-001 | Liveness probe | `/api/live` always 200 when process up | Docker healthcheck |
| NFR-AVAIL-002 | Readiness probe | `/api/ready` 200 when DB connected | Docker healthcheck |
| NFR-AVAIL-003 | Target uptime (production) | 99.9% monthly | Monitoring SLA |
| NFR-AVAIL-004 | Graceful shutdown | Complete within 10 s | SIGTERM handler |

## Scalability

| ID | Requirement | Target | Verification |
|----|-------------|--------|--------------|
| NFR-SCALE-001 | Stateless API instances | Horizontal scale behind load balancer | Architecture |
| NFR-SCALE-002 | Redis for distributed locks | Enabled in Docker Compose prod | Config |
| NFR-SCALE-003 | Worker concurrency configurable | Default 5; env override | WORKER_CONCURRENCY |
| NFR-SCALE-004 | Connection pooling | MySQL pool per instance | Database module |

## Reliability

| ID | Requirement | Target | Verification |
|----|-------------|--------|--------------|
| NFR-REL-001 | Webhook retry with backoff | 3 attempts default | Delivery engine |
| NFR-REL-002 | Queue claim transactional | FOR UPDATE | Integration test |
| NFR-REL-003 | Redis fallback to in-memory | Auto-fallback on connection failure | Redis client |
| NFR-REL-004 | Idempotent payment create | Same key → same result | Integration test |

## Security

| ID | Requirement | Target | Verification |
|----|-------------|--------|--------------|
| NFR-SEC-001 | OWASP ASVS Level 2 alignment | Documented gaps only | Security sprint |
| NFR-SEC-002 | JWT algorithm pinning | HS256 only | Unit test |
| NFR-SEC-003 | HttpOnly Secure SameSite cookies | Production Secure flag | Cookie helper |
| NFR-SEC-004 | CSRF on cookie auth | Double-submit token | Middleware |
| NFR-SEC-005 | Rate limiting on auth endpoints | Login 20/15min | Auth routes |
| NFR-SEC-006 | PII masking in logs | No passwords/tokens/PAN | PII helper |
| NFR-SEC-007 | Production secret validation | Min 32 chars; no placeholders | validateProductionEnv |
| NFR-SEC-008 | Helmet security headers | CSP, HSTS, nosniff, frame deny | http-security |
| NFR-SEC-009 | Tenant isolation | Cross-org access blocked | Integration test |
| NFR-SEC-010 | Backend runtime critical CVEs | 0 at RC1 | npm audit |

## Maintainability

| ID | Requirement | Target | Verification |
|----|-------------|--------|--------------|
| NFR-MAINT-001 | TypeScript strict mode | Backend + frontend | tsconfig |
| NFR-MAINT-002 | Zod input validation | Auth + critical modules | Validators |
| NFR-MAINT-003 | Modular domain structure | 46 backend modules | Code layout |
| NFR-MAINT-004 | OpenAPI documentation | `/api/docs` | Swagger setup |
| NFR-MAINT-005 | Structured JSON logging | Request ID correlation | Logger |

## Logging & Monitoring

| ID | Requirement | Target | Verification |
|----|-------------|--------|--------------|
| NFR-LOG-001 | Request ID on all responses | X-Request-Id header | Middleware |
| NFR-LOG-002 | HTTP access logging | Morgan combined (prod) | App config |
| NFR-LOG-003 | Worker heartbeat | Redis key worker:heartbeat | Worker runner |
| NFR-LOG-004 | Webhook delivery metrics | success/failure/duration | Metrics registry |
| NFR-LOG-005 | Error responses never expose stack | Generic 500 message | Error handler |

## Audit & Compliance

| ID | Requirement | Target | Verification |
|----|-------------|--------|--------------|
| NFR-AUD-001 | All state-changing admin actions logged | Audit repository | Audit module |
| NFR-AUD-002 | Audit org-scoped reads | Filter by organization_id | Repository |
| NFR-AUD-003 | API request logging | api_logs table | Audit module |
| NFR-AUD-004 | Webhook delivery logging | webhook logs | Audit module |
| NFR-AUD-005 | Password history enforcement | Last 5 passwords (configurable) | Auth service |

## Backup & Recovery

| ID | Requirement | Target | Verification |
|----|-------------|--------|--------------|
| NFR-BAK-001 | MySQL persistent volume | Docker volume mysql_data | docker-compose |
| NFR-BAK-002 | Database backup scripts | Database_Fintech/backups/ | Folder structure |
| NFR-BAK-003 | RPO target (production) | ≤ 24 hours | Ops runbook |
| NFR-BAK-004 | RTO target (production) | ≤ 4 hours | Ops runbook |

## Deployment

| ID | Requirement | Target | Verification |
|----|-------------|--------|--------------|
| NFR-DEP-001 | Docker Compose full stack | mysql, redis, backend, worker, frontend | docker-compose.yml |
| NFR-DEP-002 | Environment variable documentation | .env.example | Repo root |
| NFR-DEP-003 | CI pipeline | Build, integration, E2E | .github/workflows/ci.yml |
| NFR-DEP-004 | PM2 production option | ecosystem.config.cjs | Repo root |
| NFR-DEP-005 | nginx reverse proxy | Frontend nginx.conf | Static + API proxy |

**Total non-functional requirements:** 42
