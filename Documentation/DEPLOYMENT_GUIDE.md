# Deployment Guide — Merchant Pro v1.0.0 RC1

Production deployment guide for DevOps engineers and release managers.

---

## Deployment Options

| Method | Best for | Section |
| ------ | -------- | ------- |
| Docker Compose | Staging, UAT, small production | [Docker Compose](#docker-compose) |
| PM2 + Nginx | Linux VM production | [PM2 + Nginx](#pm2--nginx) |
| Local development | Developer workstations | [README.md](./README.md) |

---

## Prerequisites

- Node.js ≥ 20.0.0
- npm ≥ 9.0.0
- MySQL 8 (or Docker)
- Docker & Docker Compose 2.x (container deployment)
- PM2 (`npm install -g pm2`) and Nginx (host deployment)
- TLS certificate for production (Let's Encrypt or corporate CA)

---

## Environment Variables

### Templates

| File | Purpose |
| ---- | ------- |
| `.env.production.example` | Root / Docker production template |
| `.env.example` | Root / Docker development template |
| `Backend_Fintech/.env.example` | Backend-only development template |

```bash
cp .env.production.example .env          # Docker
cp .env.production.example Backend_Fintech/.env   # PM2 host
```

### Required (production)

| Variable | Description |
| -------- | ----------- |
| `MYSQL_ROOT_PASSWORD` | MySQL root password (Docker) |
| `MYSQL_PASSWORD` / `DB_PASSWORD` | Application database password |
| `JWT_SECRET` | Access token signing key (≥ 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token signing key (≥ 32 chars) |
| `CORS_ORIGIN` | Exact frontend URL (e.g., `https://portal.example.com`) |

### Production validation

`Backend_Fintech/src/app/config/validate-env.ts` blocks startup when:

- `DB_PASSWORD`, `JWT_SECRET`, or `JWT_REFRESH_SECRET` contain placeholders (`changeme`, `change-this`, `replace-with`)
- Any secret is shorter than 32 characters
- `CORS_ORIGIN` is empty

A warning is logged if `LOG_LEVEL=debug` in production.

### Full backend variable list

See [README.md — Environment Variables](./README.md#environment-variables) and `Backend_Fintech/.env.example`.

Key production overrides:

| Variable | Production value |
| -------- | ---------------- |
| `NODE_ENV` | `production` |
| `LOG_LEVEL` | `info` |
| `APP_BUILD` | `production` or `docker` |
| `GEMINI_API_KEY` | Valid Google API key (for AI features) |

---

## Production Secrets

Generate strong secrets before deployment:

```bash
# Linux / macOS
openssl rand -base64 48

# PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

Store secrets in:

- `.env` file (Docker Compose — not committed to git)
- `Backend_Fintech/.env` (PM2 host deployment)
- Secret manager (recommended for enterprise)

Never commit `.env` files. `.env.production.example` is committed as a template only.

---

## Database Setup

### Fresh database (first deploy)

```bash
# npm script
MYSQL_PASSWORD=your_password npm run db:setup:unix

# MySQL CLI
mysql -u root -p < Database_Fintech/master_database.sql
```

Docker Compose auto-runs `master_database.sql` on first MySQL container start (empty volume only).

### Backup

```bash
mysqldump -u root -p fintech_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

Store backups in `Database_Fintech/backups/` (gitignored) or external storage.

### Restore

```bash
mysql -u root -p fintech_db < backup_YYYYMMDD_HHMMSS.sql
```

---

## Docker

### Dockerfile — Backend

Location: `Backend_Fintech/Dockerfile`

- Multi-stage build: `node:20-alpine`
- Non-root user `nodejs` (uid 1001)
- Creates `uploads/` and `logs/` directories
- `HEALTHCHECK` on `GET /api/health`
- Entry: `node dist/server.js`

### Dockerfile — Frontend

Location: `Frontend_Fintech/Dockerfile`

- Build: `npm run build -- --configuration=production`
- Serve: `nginx:1.27-alpine`
- Static output: `dist/frontend-fintech/browser` → `/usr/share/nginx/html`
- Proxies `/api/` to `http://backend:3000/api/`

### Build images

```bash
npm run docker:build
```

---

## Docker Compose

Location: `docker-compose.yml`

### Services

| Service | Container | Port | Image |
| ------- | --------- | ---- | ----- |
| mysql | fintech-mysql | 3306 | mysql:8.0 |
| backend | fintech-backend | 3000 | Built from Backend_Fintech |
| frontend | fintech-frontend | 80 (mapped to 4200) | Built from Frontend_Fintech |

### Volumes

| Volume | Mount | Purpose |
| ------ | ----- | ------- |
| `mysql_data` | MySQL data dir | Persistent database |
| `backend_uploads` | `/app/uploads` | Export files |
| `backend_logs` | `/app/logs` | Application logs |

### Start stack

```bash
cp .env.production.example .env
# Edit .env — set all secrets

npm run docker:build
npm run docker:up
```

### Verify

| Service | URL |
| ------- | --- |
| Frontend | http://localhost:4200 |
| Backend health | http://localhost:3000/api/health |
| Swagger | http://localhost:3000/api/docs |

```bash
curl http://localhost:3000/api/health
npm run docker:logs
```

### Stop

```bash
npm run docker:down           # stop containers
docker compose down -v        # stop + remove volumes (clean DB reset)
```

### Architecture

```
Browser → frontend (nginx:80) → /api/* proxied to backend:3000
                              → /* SPA static files
         backend → mysql:3306
```

---

## PM2

Location: `ecosystem.config.cjs`

| Setting | Value |
| ------- | ----- |
| App name | `fintech-backend` |
| Script | `dist/server.js` |
| CWD | `./Backend_Fintech` |
| Instances | 1 (fork) |
| Max memory restart | 512M |
| Kill timeout | 10s |
| `wait_ready` | true |
| Logs | `Backend_Fintech/logs/pm2-out.log`, `pm2-error.log` |

### Deploy steps

```bash
npm install
cp .env.production.example Backend_Fintech/.env
# Edit Backend_Fintech/.env

npm run build:prod
mkdir -p Backend_Fintech/logs Backend_Fintech/uploads

npm run pm2:start
pm2 save
pm2 startup    # follow printed instructions
```

### Management

```bash
npm run pm2:reload    # zero-downtime reload
npm run pm2:stop
npm run pm2:logs
pm2 status
```

---

## PM2 + Nginx

### Nginx configuration

Location: `deploy/nginx/fintech.conf`

```bash
sudo cp deploy/nginx/fintech.conf /etc/nginx/sites-available/fintech
# Edit server_name and root path
sudo ln -s /etc/nginx/sites-available/fintech /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Key settings:

- Upstream backend: `127.0.0.1:3000`
- SPA root: `/var/www/fintech/Frontend_Fintech/dist/frontend-fintech/browser`
- `/api/` and `/api/docs` proxied to backend
- `try_files $uri $uri/ /index.html` for SPA routing
- `client_max_body_size 10m`

### Deploy frontend static files

```bash
sudo mkdir -p /var/www/fintech
sudo cp -r Frontend_Fintech/dist/frontend-fintech/browser \
  /var/www/fintech/Frontend_Fintech/dist/frontend-fintech/
```

### TLS

Configure SSL in Nginx (Let's Encrypt recommended):

```bash
sudo certbot --nginx -d portal.example.com
```

Production requires HTTPS. Set `CORS_ORIGIN` to the HTTPS frontend URL.

---

## Health Endpoints

| Endpoint | Auth | Use case |
| -------- | ---- | -------- |
| `GET /api/health` | Public | Liveness probe (Docker, load balancer) |
| `GET /api/v1/system/health` | JWT + `system:view` | Detailed component health |
| `GET /api/v1/system/readiness` | JWT + `system:view` | Pre-traffic readiness check |
| `GET /api/v1/system/version` | JWT + `system:view` | Version verification |

### Public health check

```bash
curl -s http://localhost:3000/api/health | jq
```

Expected (healthy):

```json
{
  "status": "ok",
  "service": "backend-fintech",
  "environment": "production",
  "database": "connected"
}
```

Docker and PM2 deployments should monitor this endpoint.

### System health (authenticated)

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/system/health | jq
```

States: `healthy`, `degraded`, `unhealthy`.

---

## Readiness Endpoints

`GET /api/v1/system/readiness` checks:

| Component | Check |
| --------- | ----- |
| database | MySQL connection |
| ai | Gemini API key configured |
| storage | `uploads/exports` directory writable |
| queues | `retry_queue` and `background_jobs` tables accessible |

Returns `{ "ready": true/false, ... }`. Use before routing traffic after deploy.

---

## Version Endpoint

`GET /api/v1/system/version` returns:

```json
{
  "version": "0.1.0",
  "build": "production",
  "commit": "abc123",
  "environment": "production"
}
```

Set at deploy time via environment variables:

| Variable | Purpose |
| -------- | ------- |
| `APP_VERSION` | Override package version |
| `APP_BUILD` | Build identifier |
| `APP_COMMIT` | Git commit hash |

---

## Rollback Steps

### Docker Compose rollback

1. Stop current stack: `npm run docker:down`
2. Checkout previous release tag/commit: `git checkout <previous-tag>`
3. Rebuild: `npm run docker:build`
4. Start: `npm run docker:up`
5. Verify health: `curl http://localhost:3000/api/health`
6. If database migration was applied, restore from backup (see below)

### PM2 rollback

1. Checkout previous release: `git checkout <previous-tag>`
2. Rebuild: `npm run build:prod`
3. Reload: `npm run pm2:reload`
4. Verify: `curl http://localhost:3000/api/health && pm2 status`

### Database rollback

If schema changes were applied (not applicable for RC1 fresh install):

```bash
mysql -u root -p fintech_db < backup_YYYYMMDD_HHMMSS.sql
```

Modular rollback scripts are in `Database_Fintech/rollback_scripts/`.

### Frontend rollback

Redeploy previous static build:

```bash
git checkout <previous-tag>
npm run build:frontend -- --configuration=production
sudo cp -r Frontend_Fintech/dist/frontend-fintech/browser /var/www/fintech/...
```

---

## Production Build Verification

```bash
npm run build:prod
```

This runs:

1. Backend TypeScript compile (`tsc`)
2. Angular production build with `environment.prod.ts` (`apiUrl: '/api'`)

Individual builds:

```bash
npm run build --workspace=Backend_Fintech
npm run build --workspace=Frontend_Fintech -- --configuration=production
```

---

## Troubleshooting

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| Backend exits on start | Placeholder JWT/DB secrets | Update `.env` with real values ≥ 32 chars |
| `503` on `/api/health` | MySQL down or wrong credentials | Check `DB_*` vars and MySQL status |
| Frontend 404 on refresh | Missing SPA fallback | Ensure Nginx `try_files` directive |
| CORS errors | `CORS_ORIGIN` mismatch | Set to exact browser origin (with protocol) |
| Docker backend won't start | Missing required env vars | Copy `.env.production.example` → `.env` |
| Empty database | Init only on fresh volume | `docker compose down -v` then `docker compose up` |
| AI unavailable | Missing `GEMINI_API_KEY` | Set key in `.env`; check quota |
| PM2 not ready | Backend failed to bind | Check `pm2 logs fintech-backend` |

---

## Demo Users (UAT)

| Email | Password | Role |
| ----- | -------- | ---- |
| `admin@merchantpro.com` | `Password123!` | Super Admin |
| `finance@merchantpro.com` | `Password123!` | Finance Manager |
| `readonly@merchantpro.com` | `Password123!` | Read Only |

Change all demo passwords before production go-live.
