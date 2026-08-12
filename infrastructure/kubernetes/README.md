# Fintech Platform — Kubernetes Deployment

Production-ready Kubernetes manifests mirroring the existing `docker-compose.yml` stack.

## Architecture

```
                    ┌─────────────┐
                    │   Ingress   │  TLS (placeholder)
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  Frontend  │  │  Backend   │  │  Backend   │  (HPA 2–10)
    │  (nginx)   │──│  API :3000 │  │  replicas  │
    └────────────┘  └─────┬──────┘  └────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌─────────┐ ┌─────────┐ ┌─────────┐
        │  MySQL  │ │  Redis  │ │ Worker  │  (HPA 1–5)
        │StatefulSet│ │  PVC   │ │         │
        └─────────┘ └─────────┘ └─────────┘
```

Services match Docker Compose hostnames: `backend`, `mysql`, `redis` (required by `Frontend_Fintech/nginx.conf`).

## Folder Structure

```
infrastructure/kubernetes/
├── namespaces/          # development, staging, production
├── base/                # Shared manifests (Kustomize)
├── overlays/            # development, staging, production
├── examples/            # validate scripts, secrets guide
└── README.md
```

## Deployment Flow

1. `kubectl apply -f infrastructure/kubernetes/namespaces/`
2. Create secrets — see `examples/secrets.example.md` (never commit real values)
3. Build/push images from `Backend_Fintech/Dockerfile` and `Frontend_Fintech/Dockerfile`
4. `kubectl apply --dry-run=client -k infrastructure/kubernetes/overlays/production`
5. `kubectl apply -k infrastructure/kubernetes/overlays/production`
6. Verify: `curl /api/live`, `/api/ready`, `/api/health`

## Scaling

| Component | HPA Min | HPA Max | Metrics |
|-----------|---------|---------|---------|
| Backend   | 2       | 10      | CPU 70%, Memory 80%, custom placeholder |
| Worker    | 1       | 5       | CPU 75%, Memory 80%, custom placeholder |

## Secrets

| Secret | Keys |
|--------|------|
| `fintech-app-secrets` | JWT, DB, Redis URL, encryption key, SMTP, Stripe, Razorpay |
| `fintech-redis-secret` | REDIS_PASSWORD |

## Health Probes

| Service | Startup | Liveness | Readiness |
|---------|---------|----------|-----------|
| Backend | `/api/live` | `/api/live` | `/api/ready` |
| Frontend | `/` | `/` | `/` |
| Worker | `worker-healthcheck.js` | same | same |
| MySQL | `mysqladmin ping` | same | same |
| Redis | — | `redis-cli ping` | same |

## Troubleshooting

```bash
kubectl describe pod -l app.kubernetes.io/name=backend -n production
kubectl logs -l app.kubernetes.io/name=worker -n production --tail=100
```

- **Backend CrashLoopBackOff** — missing secrets (`JWT_SECRET`, `DB_PASSWORD`)
- **Worker not ready** — Redis `worker:heartbeat` key missing
- **MySQL pending** — PVC not bound; check StorageClass

## Rollback

```bash
kubectl rollout undo deployment/backend -n production
kubectl rollout undo deployment/frontend -n production
kubectl rollout undo deployment/worker -n production
```

## Validation

```bash
bash infrastructure/kubernetes/examples/validate.sh
powershell -File infrastructure/kubernetes/examples/validate.ps1
```

## Not Included (Later Sprints)

Terraform, Helm, cloud IaC, Grafana dashboards, Prometheus exporters.
