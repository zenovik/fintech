# Merchant Management Portal

Enterprise-grade Merchant Management Portal for a Payment Gateway.

## Project Structure

```
fintech_application/
├── Frontend_Fintech/    # Angular application
├── Backend_Fintech/     # Node.js / Express API
└── Database_Fintech/    # MySQL schema, seeds, and scripts
```

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | Angular, Angular Material, TypeScript, SCSS, RxJS |
| Backend  | Node.js, Express.js, TypeScript     |
| Database | MySQL 8                             |
| Auth     | JWT + Refresh Tokens                |
| API Docs | Swagger / OpenAPI                   |
| Infra    | Docker, Docker Compose              |

## Prerequisites

- Node.js >= 20
- npm >= 9
- MySQL 8 (local install or Docker)
- Docker & Docker Compose (optional)

## Clean Installation

Follow these steps on a fresh machine. No manual SQL or configuration fixes are required after setup.

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd fintech_application
npm install
```

### 2. Configure environment

**Backend** (required):

```bash
cp Backend_Fintech/.env.example Backend_Fintech/.env
```

Edit `Backend_Fintech/.env` with your MySQL credentials and JWT secrets. See [Environment Variables](#environment-variables).

**Docker** (optional — from project root):

```bash
cp .env.example .env
```

### 3. Create the database

Run **only** `master_database.sql`. This creates the database, all tables, roles, permissions, and seed data.

**Option A — npm script (recommended):**

```bash
# Windows PowerShell
$env:MYSQL_PASSWORD="your_mysql_password"
npm run db:setup

# macOS / Linux
MYSQL_PASSWORD=your_mysql_password npm run db:setup:unix
```

**Option B — MySQL CLI:**

```bash
mysql -u root -p < Database_Fintech/master_database.sql
```

**Option C — Docker Compose** (runs `master_database.sql` automatically on first start):

```bash
npm run docker:up
```

### 4. Start the application

```bash
# Frontend + Backend concurrently
npm run dev

# Or individually
npm run dev:backend   # http://localhost:3000
npm run dev:frontend  # http://localhost:4200
```

### 5. Log in

Open `http://localhost:4200` and sign in with a demo user (see [Demo Users](#demo-users)).

## Environment Variables

### Backend (`Backend_Fintech/.env`)

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | API server port | `3000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `fintech_db` |
| `DB_USER` | MySQL user | `root` or `fintech_user` |
| `DB_PASSWORD` | MySQL password | *(required — no default)* |
| `JWT_SECRET` | Access token signing key | *(required — use a long random string)* |
| `JWT_REFRESH_SECRET` | Refresh token signing key | *(required — use a long random string)* |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:4200` |
| `LOG_LEVEL` | Log verbosity | `debug` |
| `CONFIG_ENCRYPTION_KEY` | AES key for SMTP/webhook secrets | *(required in production)* |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `REDIS_ENABLED` | Enable Redis (fallback if false/unavailable) | `true` |

Copy from `Backend_Fintech/.env.example` — placeholders only, no real credentials are committed.

### Execution Layer (Worker + Redis)

```bash
# Start worker alongside API
npm run worker --workspace=Backend_Fintech
```

See [Backend Worker Guide](./Backend_Fintech/docs/WORKER.md) and [Redis Guide](./Backend_Fintech/docs/REDIS.md).

### Frontend

Development API URL is set in `Frontend_Fintech/src/environments/environment.ts` (`http://localhost:3000/api`). The dev server proxies `/api` to the backend via `proxy.conf.json`.

Production builds use `environment.prod.ts` (`apiUrl: '/api'`) for same-origin deployment behind a reverse proxy.

### Docker (root `.env`)

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `MYSQL_ROOT_PASSWORD` | MySQL root password | `changeme` |
| `MYSQL_DATABASE` | Database name | `fintech_db` |
| `MYSQL_USER` | Application MySQL user | `fintech_user` |
| `MYSQL_PASSWORD` | Application MySQL password | `changeme` |
| `BACKEND_PORT` | Exposed backend port | `3000` |
| `FRONTEND_PORT` | Exposed frontend port | `4200` |

When using Docker Compose, set `DB_USER` / `DB_PASSWORD` in the backend service to match `MYSQL_USER` / `MYSQL_PASSWORD`.

## Demo Users

All seeded users share the same password unless noted.

| Email | Role | Status | Password | Notes |
| ----- | ---- | ------ | -------- | ----- |
| `admin@merchantpro.com` | Super Admin | active | `Password123!` | Primary login for full access |
| `finance@merchantpro.com` | Finance Manager | active | `Password123!` | |
| `operations@merchantpro.com` | Operations Manager | active | `Password123!` | |
| `merchant.mgr@merchantpro.com` | Merchant Manager | active | `Password123!` | |
| `support@merchantpro.com` | Support Agent | active | `Password123!` | |
| `readonly@merchantpro.com` | Read Only | active | `Password123!` | |
| `mfa.totp@merchantpro.com` | — | active | `Password123!` | MFA (TOTP) enabled |
| `mfa.sms@merchantpro.com` | — | active | `Password123!` | MFA (SMS) enabled |
| `locked.user@merchantpro.com` | — | locked | `Password123!` | Account locked (demo) |
| `sso.google@merchantpro.com` | — | active | — | SSO only (no password login) |

## Production Deployment

For Docker, PM2, Nginx, backup/restore, and troubleshooting, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

Release notes: [RELEASE_NOTES.md](./RELEASE_NOTES.md)

## Available Scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Start frontend and backend concurrently |
| `npm run build` | Build both frontend and backend |
| `npm run build:prod` | Production build (backend + Angular production config) |
| `npm run lint` | Lint all workspaces |
| `npm run db:build` | Rebuild `master_database.sql` from `structure_queries/` |
| `npm run db:setup` | Drop and recreate `fintech_db` from `master_database.sql` (Windows) |
| `npm run db:setup:unix` | Same as `db:setup` for Linux/macOS |
| `npm run docker:up` | Start Docker Compose stack |
| `npm run docker:down` | Stop Docker Compose stack |
| `npm run docker:build` | Build Docker images |
| `npm run pm2:start` | Start backend with PM2 (production) |

## Implemented Modules

- Authentication (login, MFA, sessions, password reset)
- Executive Dashboard
- Merchants
- Transactions
- Settlements
- Users & Roles (RBAC)
- Reports & Analytics

API documentation: `http://localhost:3000/api/docs` (when backend is running).

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) — production deployment (Docker, PM2, Nginx)
- [RELEASE_NOTES.md](./RELEASE_NOTES.md) — RC release notes
- [Worker Guide](./Backend_Fintech/docs/WORKER.md) — background worker process
- [Redis Guide](./Backend_Fintech/docs/REDIS.md) — caching, locks, queues
- [Database Production](./Database_Fintech/docs/PRODUCTION.md) — indexes, retention, partitioning
- [API Conventions](./Backend_Fintech/docs/api/README.md) — pagination, errors, rate limits
- [Frontend README](./Frontend_Fintech/README.md)
- [Backend README](./Backend_Fintech/README.md)
- [Database README](./Database_Fintech/README.md)

## License

Proprietary — All rights reserved.
