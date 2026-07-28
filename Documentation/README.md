# Merchant Pro — Enterprise FinTech Platform

**Release:** v1.0.0 Release Candidate 1 (RC1)  
**Product name:** Merchant Pro — Merchant Management Portal  
**Repository package version:** `0.1.0`

---

## Project Overview

Merchant Pro is an enterprise-grade Merchant Management Portal for payment gateway operations. It provides a unified web application for managing merchants, transactions, settlements, refunds, chargebacks, payouts, support tickets, and operational monitoring — with role-based access control, audit logging, analytics, and AI-assisted insights.

The platform is delivered as an npm monorepo with three primary components:

| Component | Path | Purpose |
| --------- | ---- | ------- |
| Frontend | `Frontend_Fintech/` | Angular 19 SPA |
| Backend | `Backend_Fintech/` | Node.js / Express REST API |
| Database | `Database_Fintech/` | MySQL 8 schema, seeds, and scripts |

Additional supporting assets:

| Path | Purpose |
| ---- | ------- |
| `deploy/nginx/` | Host Nginx reverse-proxy configuration |
| `Postman/` | API collections and environments |
| `Design/` | Module design specifications |
| `Documentation/` | Enterprise release and handover documentation (this folder) |

---

## Technology Stack

| Layer | Technology | Version / Notes |
| ----- | ---------- | --------------- |
| Frontend | Angular, Angular Material, TypeScript, SCSS, RxJS | Angular **19.2.19** |
| Backend | Node.js, Express.js, TypeScript | Node **≥ 20**, Express **4.21** |
| Database | MySQL | **8.0** |
| Auth | JWT access tokens + httpOnly refresh cookie, MFA (OTP) | bcryptjs, otplib |
| Validation | Zod | Request/response validation |
| API docs | Swagger / OpenAPI | `/api/docs` |
| AI | Google Gemini (default provider) | `gemini-flash-latest` |
| Containers | Docker, Docker Compose | Multi-service stack |
| Process manager | PM2 | Backend production host deployment |
| Web server | Nginx | SPA + API reverse proxy |

---

## Folder Structure

```
fintech_application/
├── Documentation/              # Enterprise release documentation (Sprint 11)
├── Frontend_Fintech/
│   ├── src/app/
│   │   ├── core/               # Auth, guards, interceptors, services
│   │   ├── features/           # Feature modules (dashboard, merchants, etc.)
│   │   ├── routing/            # App routes
│   │   └── shared/             # Shared UI components
│   ├── src/environments/       # Dev/prod API URLs
│   ├── Dockerfile
│   ├── nginx.conf              # Container Nginx config
│   └── angular.json
├── Backend_Fintech/
│   ├── src/app/
│   │   ├── modules/            # Domain modules (auth, merchants, ai, system, etc.)
│   │   ├── config/             # Environment, security, validation
│   │   ├── shared/             # Logger, RBAC, middleware
│   │   └── database/           # MySQL pool and connection
│   ├── src/server.ts           # Entry point, graceful shutdown
│   ├── uploads/exports/        # Generated export files
│   ├── logs/                   # Application and PM2 logs
│   └── Dockerfile
├── Database_Fintech/
│   ├── master_database.sql     # Single executable schema + seed
│   ├── structure_queries/      # Modular SQL source files
│   ├── scripts/                # build-master.ps1, setup-database.ps1/.sh
│   └── rollback_scripts/
├── deploy/nginx/fintech.conf     # Host Nginx config
├── docker-compose.yml
├── ecosystem.config.cjs          # PM2 configuration
├── package.json                  # npm workspaces root
├── .env.example                  # Docker / root environment template
└── .env.production.example       # Production environment template
```

---

## Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** ≥ 9.0.0
- **MySQL 8** (local install or Docker)
- **Docker & Docker Compose 2.x** (optional, for container deployment)
- **PM2** and **Nginx** (optional, for host production deployment)

---

## Local Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd fintech_application
npm install
```

### 2. Configure backend environment

```bash
cp Backend_Fintech/.env.example Backend_Fintech/.env
```

Edit `Backend_Fintech/.env` with MySQL credentials, JWT secrets, and optional AI keys. See [Environment Variables](#environment-variables).

### 3. Initialize database

```bash
# Windows PowerShell
$env:MYSQL_PASSWORD="your_mysql_password"
npm run db:setup

# macOS / Linux
MYSQL_PASSWORD=your_mysql_password npm run db:setup:unix
```

Alternatively:

```bash
mysql -u root -p < Database_Fintech/master_database.sql
```

### 4. Start development servers

```bash
npm run dev
```

This starts the frontend (`http://localhost:4200`) and backend (`http://localhost:3000`) concurrently.

---

## Environment Variables

### Backend (`Backend_Fintech/.env`)

Copy from `Backend_Fintech/.env.example`. Key variables:

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `NODE_ENV` | No | `development` | Runtime environment |
| `PORT` | No | `3000` | Backend listen port |
| `DB_HOST` | No | `localhost` | MySQL host |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_NAME` | No | `fintech_db` | Database name |
| `DB_USER` | No | `fintech_user` | Database user |
| `DB_PASSWORD` | **Yes** | — | Database password |
| `JWT_SECRET` | **Yes** | — | Access token signing key |
| `JWT_REFRESH_SECRET` | **Yes** | — | Refresh token signing key |
| `JWT_EXPIRES_IN` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token TTL |
| `CORS_ORIGIN` | No | `http://localhost:4200` | Allowed frontend origin |
| `LOG_LEVEL` | No | `debug` (dev) / `info` (prod) | Log verbosity |
| `AI_PROVIDER` | No | `gemini` | AI provider (`gemini`, `openai`, `groq`) |
| `GEMINI_API_KEY` | For AI | — | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-flash-latest` | Gemini model name |
| `AI_RATE_LIMIT_PER_MINUTE` | No | `20` | Per-user AI rate limit |

See `Backend_Fintech/.env.example` for the full list including auth policy variables (`SESSION_IDLE_MINUTES`, `MAX_LOGIN_ATTEMPTS`, etc.).

### Docker / root (`.env`)

Copy from `.env.example` or `.env.production.example` for Docker Compose. Required in production:

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`

Production startup blocks placeholder secrets (`changeme`, `change-this`, `replace-with`) and requires secrets ≥ 32 characters.

---

## Running Backend

```bash
# Development (hot reload via tsx)
cd Backend_Fintech
npm run dev

# Production build + start
npm run build
npm start
```

From project root:

```bash
npm run dev:backend
npm run build:backend
npm run start:prod
```

API base URL: `http://localhost:3000/api`  
Swagger UI: `http://localhost:3000/api/docs`  
Public health: `http://localhost:3000/api/health`

---

## Running Frontend

```bash
cd Frontend_Fintech
npm start
```

From project root:

```bash
npm run dev:frontend
```

Development server: `http://localhost:4200`  
Dev proxy forwards `/api` to `http://localhost:3000` via `Frontend_Fintech/proxy.conf.json`.

Production build:

```bash
npm run build:frontend
# or
npm run build:prod   # backend + frontend production build
```

Output: `Frontend_Fintech/dist/frontend-fintech/browser`

---

## Running Database

### Fresh setup (recommended)

```bash
npm run db:setup          # Windows
npm run db:setup:unix     # macOS / Linux
```

### Rebuild master script from modular sources

After editing files in `Database_Fintech/structure_queries/`:

```bash
npm run db:build
npm run db:setup
```

### Demo credentials

| Email | Password | Role |
| ----- | -------- | ---- |
| `admin@merchantpro.com` | `Password123!` | Super Admin |

---

## Running Docker

```bash
cp .env.production.example .env
# Edit .env with production secrets

npm run docker:build
npm run docker:up
```

| Service | URL |
| ------- | --- |
| Frontend | http://localhost:4200 |
| Backend | http://localhost:3000/api/health |
| Swagger | http://localhost:3000/api/docs |
| MySQL | localhost:3306 |

```bash
npm run docker:logs    # tail all service logs
npm run docker:down    # stop stack
```

MySQL init runs `master_database.sql` only on first empty volume. Use `docker compose down -v` for a clean database reset.

---

## Running PM2

For host-based production deployment (without Docker for the backend):

```bash
npm run build:prod
mkdir -p Backend_Fintech/logs Backend_Fintech/uploads
npm run pm2:start
pm2 save
pm2 startup    # follow printed instructions for boot persistence
```

Management commands:

```bash
npm run pm2:reload
npm run pm2:stop
npm run pm2:logs
pm2 status
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for Nginx configuration and full production steps.

---

## Documentation Index

| Document | Purpose |
| -------- | ------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design and module boundaries |
| [API_GUIDE.md](./API_GUIDE.md) | REST API reference with examples |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Production deployment procedures |
| [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) | Administrator operations |
| [USER_GUIDE.md](./USER_GUIDE.md) | End-user feature guide |
| [RUNBOOK.md](./RUNBOOK.md) | Operations runbook |
| [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) | Known constraints and gaps |
| [RELEASE_NOTES_v1.0.0_RC1.md](./RELEASE_NOTES_v1.0.0_RC1.md) | Release candidate changelog |
