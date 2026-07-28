# Performance — v1.0.0-rc1

Load testing and production SLO targets for the Merchant Management Portal.

## Tooling

- **Engine:** Grafana k6
- **Location:** `performance/`
- **Entry:** `performance/tests/main.js`
- **Profiles:** smoke, load, stress, spike, soak

## Commands

```bash
npm run perf:smoke    # 10 VU, 2 minutes
npm run perf:load     # ramp to 100 VU, 10 minutes
npm run perf:stress   # ramp to 400 VU
npm run perf:spike    # sudden spike pattern
npm run perf:soak     # 4-hour endurance (configurable)
```

Requires [k6](https://k6.io/) installed locally or use `.github/workflows/performance.yml` (manual dispatch).

## SLO Thresholds

Defined in `performance/config/thresholds.js`:

| Metric | Target |
|--------|--------|
| Error rate | < 1% |
| p95 latency | < 500 ms |
| p99 latency | < 1000 ms |
| Check pass rate | > 95% |

### Stress Profile (relaxed)

- Error rate < 5%
- p95 < 2000 ms, p99 < 5000 ms

## Scenarios (17 weighted)

Auth, merchants, payments (create/authorize/capture), public checkout, payment links, QR, webhooks, audit search, dashboard, subscriptions, refunds, reports.

## Certification (29 Jul 2026)

| Profile | Executed Locally | Notes |
|---------|------------------|-------|
| Smoke | **No** | k6 not installed on certification workstation |
| Load | **No** | CI workflow_dispatch available |

**Expected smoke profile:** 10 VU × 2 min, mixed API scenarios against `http://localhost:3000/api`.

Reports written to `performance/reports/` (JSON, HTML, TXT) when k6 runs.

## Production Tuning

| Variable | Default | Purpose |
|----------|---------|---------|
| `WORKER_CONCURRENCY` | 5 | Background job parallelism |
| `WORKER_POLL_INTERVAL_MS` | 3000 | Queue poll interval |
| `AI_RATE_LIMIT_PER_MINUTE` | 20 | AI endpoint cap |
| Redis | enabled in Docker | Distributed locks, rate limit scale-out |
