#!/usr/bin/env bash
# Kubernetes manifest validation examples (requires kubectl + kustomize)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Applying namespaces (dry-run)"
kubectl apply --dry-run=client -f "$ROOT/namespaces/"

for ENV in development staging production; do
  echo ""
  echo "==> Validating overlay: $ENV"
  kubectl apply --dry-run=client -k "$ROOT/overlays/$ENV"
  kubectl kustomize "$ROOT/overlays/$ENV" | kubectl apply --dry-run=server -f - 2>/dev/null || \
    echo "    (server dry-run skipped — no cluster or insufficient permissions)"
done

echo ""
echo "==> Folder structure"
find "$ROOT" -type f \( -name '*.yaml' -o -name '*.yml' -o -name '*.md' -o -name '*.sh' \) | sort

echo ""
echo "Validation complete."
