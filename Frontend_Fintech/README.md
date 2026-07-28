# Frontend — Merchant Management Portal

Angular application for the Payment Gateway Merchant Management Portal.

## Tech Stack

- Angular 19 (standalone components)
- Angular Material
- TypeScript
- SCSS
- RxJS

## Prerequisites

- Node.js >= 20
- npm >= 9
- Backend API running on port 3000
- Database seeded via `master_database.sql`

## Setup

From the project root:

```bash
npm install
```

Ensure the backend is configured and running (see [Backend README](../Backend_Fintech/README.md)).

## Development

```bash
npm start
```

| URL | Description |
| --- | ----------- |
| `http://localhost:4200` | Application |
| `http://localhost:3000/api/docs` | API documentation |

API requests are proxied to `http://localhost:3000` via `proxy.conf.json` during development.

## Environment

| File | `apiUrl` | Purpose |
| ---- | -------- | ------- |
| `src/environments/environment.ts` | `http://localhost:3000/api` | Development |
| `src/environments/environment.prod.ts` | `/api` | Production (same-origin) |

No credentials are stored in the frontend. Authentication uses JWT tokens from the backend login API.

## Scripts

| Script | Description |
| ------ | ----------- |
| `npm start` | Dev server with live reload |
| `npm run build` | Production build |
| `npm run watch` | Development build with watch |
| `npm test` | Run unit tests |

From the project root you can also run `npm run dev` to start frontend and backend together.

## Demo Login

```
Email:    admin@merchantpro.com
Password: Password123!
```

See the [root README](../README.md#demo-users) for additional demo accounts.

## Docker

```bash
docker build -t fintech-frontend .
docker run -p 4200:80 fintech-frontend
```

Or use Docker Compose from the project root: `npm run docker:up`.
