# Runbook — Merchant Pro v1.0.0 RC1

Operations runbook for daily monitoring, incident response, and maintenance.

---

## Daily Operations

### Morning checklist

| Step | Command / Action | Expected result |
| ---- | ---------------- | --------------- |
| 1. Health check | `curl -s http://localhost:3000/api/health` | `"status": "ok"`, `"database": "connected"` |
| 2. PM2 status | `pm2 status` | `fintech-backend` online |
| 3. Docker status | `docker compose ps` | All services `healthy` |
| 4. Disk space | `df -h` | Sufficient space on uploads/logs volumes |
| 5. Error logs | Review last 24h error logs | No recurring critical errors |
| 6. System Status UI | Settings → System Status | All indicators green |

### Weekly checklist

| Step | Action |
| ---- | ------ |
| Database backup | Run mysqldump (see [Backup](#backup)) |
| Log rotation | Archive or rotate PM2/application logs |
| Certificate expiry | Verify TLS certificate validity (Nginx) |
| AI quota | Check Gemini API usage in Google Cloud Console |
| Review audit logs | Check for anomalous access patterns |

---

## Monitoring

### Health endpoints

| Endpoint | Auth | Frequency | Alert on |
| -------- | ---- | --------- | -------- |
| `GET /api/health` | Public | Every 30s | Non-200 or DB disconnected |
| `GET /api/v1/system/health` | JWT + system:view | Every 5m | `unhealthy` status |
| `GET /api/v1/system/readiness` | JWT + system:view | Before deploy/traffic shift | `ready: false` |

### Component monitoring

| Component | What to monitor |
| --------- | --------------- |
| MySQL | Connection count, slow queries, disk usage |
| Backend | Response time, error rate, memory (PM2: 512M limit) |
| Frontend (Nginx) | 5xx rate, static asset 404s |
| AI (Gemini) | 429 rate limit errors, 503 unavailable |

### System Status UI

Navigate to **Settings → System Status** (`/settings/system-status`) for visual health indicators:

- Application: green/yellow/red
- Database: green/red
- AI Provider: green/yellow/red
- Readiness: database, AI, storage, queues

---

## Log Locations

| Deployment | Log type | Location |
| ---------- | -------- | -------- |
| Development | stdout | Terminal running `npm run dev` |
| PM2 | stdout/stderr | `Backend_Fintech/logs/pm2-out.log`, `pm2-error.log` |
| PM2 | PM2 process log | `pm2 logs fintech-backend` |
| Docker | All services | `npm run docker:logs` or `docker compose logs -f backend` |
| Docker | Backend app | Volume `backend_logs` → `/app/logs` |
| Nginx | Access/error | `/var/log/nginx/access.log`, `error.log` |

### Log format

Structured JSON logs include:

```json
{
  "timestamp": "2026-07-27T17:00:00.000Z",
  "level": "info",
  "message": "Request completed",
  "requestId": "uuid",
  "userId": 1,
  "organizationId": 1,
  "route": "GET /api/v1/merchants"
}
```

### Correlation ID tracing

1. Get `X-Request-Id` from the API response header or browser network tab.
2. Search logs: `grep "<request-id>" Backend_Fintech/logs/pm2-out.log`
3. Cross-reference with audit logs (`correlation_id` field).

---

## Health Verification

### Quick liveness (public)

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health
# Expected: 200
```

### Detailed health (authenticated)

```bash
TOKEN="<access-token>"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/system/health | jq .
```

### Readiness before traffic shift

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/system/readiness | jq .
# Expected: "ready": true
```

### Docker healthcheck status

```bash
docker inspect --format='{{.State.Health.Status}}' fintech-backend
docker inspect --format='{{.State.Health.Status}}' fintech-mysql
docker inspect --format='{{.State.Health.Status}}' fintech-frontend
```

---

## Restart Procedures

### PM2 restart

```bash
# Graceful reload (zero-downtime)
npm run pm2:reload

# Hard restart
pm2 restart fintech-backend

# Verify
pm2 status
curl http://localhost:3000/api/health
```

Backend supports graceful shutdown on SIGTERM (10s timeout). PM2 `kill_timeout` is set to 10s.

### Docker restart

```bash
# Restart single service
docker compose restart backend

# Full stack restart
docker compose down && docker compose up -d

# Verify
docker compose ps
curl http://localhost:3000/api/health
```

### Nginx reload (frontend config change)

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### MySQL restart

```bash
# Docker
docker compose restart mysql
# Wait for healthcheck, then verify backend reconnects

# Host
sudo systemctl restart mysql
curl http://localhost:3000/api/health
```

---

## Incident Handling

### Severity levels

| Level | Description | Response time |
| ----- | ----------- | ------------- |
| P1 | Platform down, no login, DB unreachable | Immediate |
| P2 | Degraded (AI down, exports failing) | 1 hour |
| P3 | Non-critical feature issue | Next business day |

### P1 — Platform down

1. Check `/api/health` — identify DB vs application failure
2. Check PM2/Docker process status
3. Review error logs for startup failures
4. Common causes:
   - MySQL not running → restart MySQL
   - Placeholder secrets in production → fix `.env`
   - Port conflict → check `PORT` binding
5. Restart backend after fix
6. Verify health and notify stakeholders

### P2 — Database disconnected

1. `curl http://localhost:3000/api/health` → `"database": "disconnected"`
2. Check MySQL: `docker compose ps mysql` or `systemctl status mysql`
3. Verify credentials in `.env` (`DB_HOST`, `DB_USER`, `DB_PASSWORD`)
4. Check MySQL error log
5. Restart MySQL, then backend
6. Verify: `"database": "connected"`

### P2 — AI unavailable

1. System Status shows AI provider red/down
2. Check `GEMINI_API_KEY` in environment
3. Check Gemini quota in Google Cloud Console (429 errors)
4. Review logs for `RESOURCE_EXHAUSTED` or `AI_PROVIDER_UNAVAILABLE`
5. If quota exceeded, wait for reset or upgrade quota
6. Restart backend after key change

### P2 — CORS errors

1. Verify `CORS_ORIGIN` matches exact browser URL (protocol + domain + port)
2. Update `.env` and restart backend
3. Clear browser cache and retry

### Post-incident

1. Document timeline and root cause
2. Check audit logs for affected period
3. Verify data integrity (spot-check transactions/settlements)
4. Update runbook if new failure mode discovered

---

## Backup

### Database backup (daily recommended)

```bash
mysqldump -u root -p \
  --single-transaction \
  --routines \
  --triggers \
  fintech_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

Store in `Database_Fintech/backups/` or external storage (S3, Azure Blob, etc.).

### Docker volume backup

```bash
docker run --rm \
  -v fintech_application_mysql_data:/data \
  -v $(pwd)/Database_Fintech/backups:/backup \
  alpine tar czf /backup/mysql_data_$(date +%Y%m%d).tar.gz /data
```

### Uploads backup

```bash
tar czf uploads_$(date +%Y%m%d).tar.gz Backend_Fintech/uploads/
# Docker: copy from backend_logs/backend_uploads volume
```

### Backup verification

Periodically restore to a test environment and verify:

```bash
mysql -u root -p fintech_db_test < backup_YYYYMMDD_HHMMSS.sql
curl http://localhost:3000/api/health
```

---

## Restore

### Database restore

```bash
# Stop backend to prevent writes
npm run pm2:stop
# or: docker compose stop backend

# Restore
mysql -u root -p fintech_db < backup_YYYYMMDD_HHMMSS.sql

# Restart backend
npm run pm2:start
curl http://localhost:3000/api/health
```

### Full environment restore (Docker)

```bash
docker compose down -v
# Restore mysql_data volume from backup tar
docker compose up -d
# Wait for healthchecks
curl http://localhost:3000/api/health
```

### Point-in-time recovery

MySQL binary logging is not configured by default in RC1. For production, enable binary logging and maintain a regular backup schedule with off-site storage.

---

## Escalation Contacts

Configure for your organization:

| Role | Responsibility |
| ---- | -------------- |
| On-call engineer | First responder for P1/P2 |
| DBA | Database restore and performance |
| Security team | Audit log review, credential rotation |
| Product owner | Business impact assessment |

---

## Useful Commands Reference

```bash
# Health
curl http://localhost:3000/api/health

# PM2
pm2 status
pm2 logs fintech-backend --lines 100
npm run pm2:reload

# Docker
docker compose ps
docker compose logs -f backend --tail 100
npm run docker:down && npm run docker:up

# Database
mysql -u root -p -e "SELECT 1"
mysqldump -u root -p fintech_db > backup.sql

# Build
npm run build:prod
```
