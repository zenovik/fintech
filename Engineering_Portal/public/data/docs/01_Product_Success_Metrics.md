# Success Metrics — Merchant Pro

Measurable KPIs for product and operations success. Targets are **recommended** for production; baseline measurement begins at GA.

## Merchant Operations

| KPI | Definition | Target | Measurement Source |
|-----|------------|--------|-------------------|
| Merchant onboarding time | Days from application submit to go-live | ≤ 5 business days | onboarding_workflow timestamps |
| Onboarding approval rate | Approved / total submitted | ≥ 85% | onboarding-approval module |
| Active merchant count | Merchants with status active | Growth MoM | merchants table |
| Outlet coverage | Outlets per active merchant (avg) | ≥ 1.5 | outlets module |

## Payment Performance

| KPI | Definition | Target | Measurement Source |
|-----|------------|--------|-------------------|
| Payment success rate | Successful captures / total attempts | ≥ 98% | payment_intents status |
| Authorization success rate | Authorized / created | ≥ 99% | payment timeline |
| Checkout conversion | Completed sessions / opened sessions | ≥ 70% | checkout analytics |
| Public pay completion | Successful public pays / attempts | ≥ 95% | public checkout logs |
| Payment API p95 latency | 95th percentile create+capture | < 500 ms | k6 / APM |

## Financial Operations

| KPI | Definition | Target | Measurement Source |
|-----|------------|--------|-------------------|
| Refund completion time | Request to processed (hours) | ≤ 24 h | refunds module |
| Refund approval SLA | Pending to approved | ≤ 4 h | refunds workflow |
| Chargeback resolution time | Open to resolved (days) | ≤ 30 days | chargebacks module |
| Settlement batch success | Successful batches / total | ≥ 99.5% | settlements module |
| Reconciliation match rate | Matched / total records | ≥ 98% | reconciliation module |

## Integration & Webhooks

| KPI | Definition | Target | Measurement Source |
|-----|------------|--------|-------------------|
| Webhook delivery success | 2xx / total delivery attempts | ≥ 99% | webhook_delivery_queue |
| Webhook retry recovery | Succeeded on retry / failed first | ≥ 80% | replay history |
| Dead letter rate | Dead letter / total deliveries | < 0.5% | webhook logs |
| Sandbox adoption | Orgs with sandbox enabled | ≥ 50% of dev orgs | developer_profiles |
| API error rate | 5xx / total API requests | < 0.1% | api_logs / APM |

## Platform Reliability

| KPI | Definition | Target | Measurement Source |
|-----|------------|--------|-------------------|
| System availability | Uptime monthly | ≥ 99.9% | /api/ready monitoring |
| Worker reliability | Jobs completed / jobs queued | ≥ 99.5% | background_jobs status |
| Worker heartbeat freshness | Last tick within poll interval × 3 | 100% | worker:heartbeat |
| Mean time to recovery (MTTR) | Incident open to resolved | ≤ 2 h | operations incidents |
| Failed queue depth | Pending retry items | < 100 | retry_queue |

## Security & Compliance

| KPI | Definition | Target | Measurement Source |
|-----|------------|--------|-------------------|
| Failed login rate | Failed / total login attempts | < 5% | login_attempts |
| Account lockout incidents | Locked accounts / day | Monitor trend | users.locked_until |
| Audit coverage | State-changing actions logged | 100% | audit_logs sampling |
| Critical security findings | Open critical vulns | 0 | security scans |
| Cross-tenant access incidents | Unauthorized cross-org access | 0 | audit + integration tests |

## User Experience

| KPI | Definition | Target | Measurement Source |
|-----|------------|--------|-------------------|
| Login success rate | Successful logins / attempts | ≥ 95% | auth logs |
| MFA completion rate | OTP verified / challenged | ≥ 90% | MFA challenges |
| Support ticket resolution | Closed within SLA | ≥ 90% | support tickets |
| AI assistant satisfaction | Positive feedback ratio | ≥ 80% | AI session feedback (V2) |
| E2E test pass rate (CI) | Passed / total Playwright tests | 100% | CI artifacts |

## Documentation & Quality

| KPI | Definition | Target | Measurement Source |
|-----|------------|--------|-------------------|
| Integration test pass rate | Passed / 101 tests | 100% | CI integration job |
| Unit test pass rate | Backend unit tests | 100% | test:unit |
| Dependency critical CVEs (runtime) | Backend production deps | 0 | npm audit |

**Total KPIs defined:** 36
