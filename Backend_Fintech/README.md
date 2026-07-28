# Backend API — Merchant Management Portal

Node.js / Express / TypeScript backend for the Payment Gateway Merchant Management Portal.

## Prerequisites

- Node.js >= 20
- MySQL 8 with `fintech_db` created from `Database_Fintech/master_database.sql`

## Setup

### 1. Database

From the project root:

```bash
$env:MYSQL_PASSWORD="your_mysql_password"
npm run db:setup
```

See [Database README](../Database_Fintech/README.md) for other options.

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` with your values. **Required** variables (no defaults in code):

- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

For local MySQL with the `root` user:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fintech_db
DB_USER=root
DB_PASSWORD=your_mysql_password
```

For Docker Compose, use `DB_USER=fintech_user` and match `MYSQL_PASSWORD` from the root `.env`.

### 3. Install and run

```bash
npm install
npm run dev
```

| Endpoint | URL |
| -------- | --- |
| Health check | `GET http://localhost:3000/api/health` |
| Swagger docs | `http://localhost:3000/api/docs` |
| Login | `POST http://localhost:3000/api/auth/login` |

## Scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check without emit |

## API Modules

| Prefix | Module |
| ------ | ------ |
| `/api/auth` | Authentication |
| `/api/v1/dashboard/executive` | Executive dashboard |
| `/api/v1/merchants` | Merchants |
| `/api/v1/transactions` | Transactions |
| `/api/v1/settlements` | Settlements |
| `/api/v1/users` | Users |
| `/api/v1/roles` | Roles |
| `/api/v1/permissions` | Permissions |
| `/api/v1/reports` | Reports |
| `/api/v1/analytics` | Analytics |

## Docker

```bash
docker build -t fintech-backend .
docker run -p 3000:3000 --env-file .env fintech-backend
```

Or use Docker Compose from the project root: `npm run docker:up`.

## Demo Login

```
Email:    admin@merchantpro.com
Password: Password123!
```
