# API Conventions

## Response Envelope

All endpoints return:

```json
{
  "success": true,
  "data": { },
  "message": "optional"
}
```

Errors:

```json
{
  "success": false,
  "message": "Human-readable message",
  "code": "ERROR_CODE",
  "errors": []
}
```

## Pagination

Use `page` (1-based) and `pageSize` query parameters.

Standard helper: `shared/helpers/pagination.helper.ts`

```typescript
const { page, pageSize, offset } = normalizePagination(query, { defaultPageSize: 20, maxPageSize: 100 });
```

Response shape:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

Defaults: `page=1`, `pageSize=20`, max `pageSize=100` (module-specific caps may apply).

## Filtering & Sorting

- Date filters: use `dateFrom` / `dateTo` (ISO date strings)
- Prefer range predicates (`created_at >= ?`) over `DATE(created_at)`
- Sort: `sortBy` + `sortOrder` (`asc` | `desc`)

## Rate Limits

- Global: 2000 req / 15 min / IP on `/api/v1`
- API burst: 300 req / min / IP
- Auth routes: stricter per-route limits

## Health Endpoints (no auth)

| Path | Purpose |
|------|---------|
| `GET /api/live` | Liveness |
| `GET /api/ready` | Readiness (Docker) |
| `GET /api/health` | Dependency health |

## Swagger

Available at `/api/docs` in non-production environments.
