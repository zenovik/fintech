# Deployment Guide — Merchant Management Portal

Production deployment guide for DevOps engineers and release managers.

## Deployment Options

| Method | Best for | Guide section |
| ------ | -------- | ------------- |
| Docker Compose | Staging / UAT / small production | [Docker deployment](#docker-deployment) |
| PM2 + Nginx | Linux VM production | [PM2 + Nginx deployment](#pm2--nginx-deployment) |
| Local development | Developer workstations | [README.md](./README.md) |

---

## Prerequisites

- Node.js >= 20
- npm >= 9
- MySQL 8 (or Docker)
- Docker & Docker Compose 2.x (for container deployment)
- PM2 (`npm install -g pm2`) and Nginx (for host deployment)

---

## Environment Variables

Copy the appropriate template:

```bash
# Docker / production
cp .env.production.example .env

# Local backend development
cp Backend_Fintech/.env.example Backend_Fintech/.env
```

### Required (production)

| Variable | Description |
| -------- | ----------- |
| `MYSQL_ROOT_PASSWORD` | MySQL root password (Docker) |
| `MYSQL_PASSWORD` / `DB_PASSWORD` | Application DB user password |
| `JWT_SECRET` | Access token signing key |
| `JWT_REFRESH_SECRET` | Refresh token signing key |
| `CORS_ORIGIN` | Frontend URL (e.g. `https://portal.example.com`) |

The backend **blocks production startup** if JWT or DB credentials use placeholder values (`changeme`, `change-this`).

See [.env.production.example](./.env.production.example) for the full list.

---

## Database Setup

### Fresh database (required on first deploy)

```bash
# Windows
$env:MYSQL_PASSWORD="your_password"
npm run db:setup

# Linux / macOS
MYSQL_PASSWORD=your_password npm run db:setup:unix

# Or MySQL CLI
mysql -u root -p < Database_Fintech/master_database.sql
```

Docker Compose runs `master_database.sql` automatically on **first** MySQL container start (empty volume).

### Backup

```bash
mysqldump -u root -p fintech_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore

```bash
mysql -u root -p fintech_db < backup_YYYYMMDD_HHMMSS.sql
```

---

## Docker Deployment

### 1. Configure environment

```bash
cp .env.production.example .env
# Edit .env — set all passwords and JWT secrets
```

### 2. Build and start

```bash
npm run docker:build
npm run docker:up
```

### 3. Verify

| Service | URL |
| ------- | --- |
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3000/api/health |
| Swagger | http://localhost:3000/api/docs |

```bash
curl http://localhost:3000/api/health
npm run docker:logs
```

### 4. Stop

```bash
npm run docker:down
```

### Architecture

```
Browser → frontend (nginx:80) → /api/* proxied to backend:3000
                              → /* SPA static files
         backend → mysql:3306
```

---

## PM2 + Nginx Deployment

### 1. Install dependencies and build

```bash
npm install
cp .env.production.example Backend_Fintech/.env
# Edit Backend_Fintech/.env with production values

npm run build:prod
```

### 2. Initialize database

```bash
MYSQL_PASSWORD=your_password npm run db:setup:unix
```

### 3. Start backend with PM2

```bash
mkdir -p Backend_Fintech/logs Backend_Fintech/uploads
npm run pm2:start
pm2 save
pm2 startup   # follow printed instructions for boot persistence
```

### 4. Configure Nginx

```bash
sudo cp deploy/nginx/fintech.conf /etc/nginx/sites-available/fintech
# Edit root path and server_name in the config file
sudo ln -s /etc/nginx/sites-available/fintech /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Deploy frontend static files:

```bash
sudo mkdir -p /var/www/fintech
sudo cp -r Frontend_Fintech/dist/frontend-fintech/browser /var/www/fintech/Frontend_Fintech/dist/frontend-fintech/
```

### 5. Verify

```bash
curl http://localhost/api/health
pm2 status
pm2 logs fintech-backend
```

---

## Production Build Verification

```bash
npm run build:prod          # Backend TypeScript + Angular production build
npm run build --workspace=Backend_Fintech
npm run build --workspace=Frontend_Fintech -- --configuration=production
```

Frontend production build uses `environment.prod.ts` (`apiUrl: '/api'`) — requires reverse proxy to route `/api` to the backend.

---

## Health Checks

| Endpoint | Expected |
| -------- | -------- |
| `GET /api/health` | `200` with `"database": "connected"` |
| `GET /api/health` (DB down) | `503` with `"database": "disconnected"` |

Backend supports graceful shutdown on `SIGTERM` / `SIGINT` (closes HTTP server and MySQL pool).

---

## Database Seed (Sprint 17+)

After pulling production-readiness changes, rebuild and apply the master schema:

```bash
cd Database_Fintech
npm run db:build
mysql -u root -p fintech_db < master_database.sql
```

Sprint 17 adds `071_enterprise_production_readiness.sql` (report center, platform config, feature-flag routes, background jobs) and `47_dummy_data_production_readiness.sql` (catalog, permissions 114–117, demo config).

Migration `079_verified_remediation.sql` adds foreign keys on `email_delivery_log` (`organization_id`, `job_id`). Rebuild master SQL after pulling verified remediation changes.

---

## Background Worker (Required)

Password reset emails, webhook delivery, notification email, and retry processing require the worker process:

```bash
npm run worker --workspace=Backend_Fintech
# or Docker Compose worker service
```

Set `CORS_ORIGIN` to the frontend URL so password reset links resolve correctly. See [Backend_Fintech/docs/PASSWORD_RESET.md](./Backend_Fintech/docs/PASSWORD_RESET.md) and [Backend_Fintech/docs/WORKER.md](./Backend_Fintech/docs/WORKER.md).

Configure SMTP in platform settings (`smtp_settings`) before expecting outbound email in production.

### Security Hardening

- Access tokens are issued as HttpOnly cookies (not stored in browser `localStorage`)
- CSP enabled on API (Helmet) and frontend (nginx) — see [Backend_Fintech/docs/SECURITY.md](./Backend_Fintech/docs/SECURITY.md)
- Set `CSP_CONNECT_SRC_EXTRA` if the frontend calls external APIs

---

## Demo Users

All password-based accounts use **`Password123!`** unless noted.

| Email | Role |
| ----- | ---- |
| `admin@merchantpro.com` | Super Admin |
| `finance@merchantpro.com` | Finance Manager |
| `readonly@merchantpro.com` | Read Only |

See [README.md](./README.md#demo-users) for the full list.

---

## Troubleshooting

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| Backend exits on start in production | Placeholder JWT/DB secrets | Update `.env` with real values |
| `503` on `/api/health` | MySQL not running or wrong credentials | Check `DB_*` vars and MySQL status |
| Frontend 404 on route refresh | Nginx missing SPA fallback | Ensure `try_files $uri $uri/ /index.html` |
| CORS errors | `CORS_ORIGIN` mismatch | Set to exact browser origin |
| Password reset email not received | Worker not running or SMTP unset | Start worker; configure `smtp_settings` |
| Webhooks stuck pending | Worker not running | Start worker service |
| Docker backend won't start | Missing `JWT_SECRET` in `.env` | Copy `.env.production.example` → `.env` |
| Empty database | Init script only runs on fresh volume | `docker compose down -v` then `docker compose up` |

---

## Release Notes

See [RELEASE_NOTES.md](./RELEASE_NOTES.md) for RC changelog.
