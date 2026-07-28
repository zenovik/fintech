#!/usr/bin/env bash
# Fresh database setup — runs ONLY master_database.sql (no manual steps).
# Usage: MYSQL_PASSWORD=secret npm run db:setup
# Or: ./Database_Fintech/scripts/setup-database.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MASTER_SQL="$ROOT/Database_Fintech/master_database.sql"

MYSQL_HOST="${MYSQL_HOST:-localhost}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-root}"

if [[ ! -f "$MASTER_SQL" ]]; then
  echo "master_database.sql not found at $MASTER_SQL" >&2
  exit 1
fi

MYSQL_ARGS=(-h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" --protocol=TCP)
if [[ -n "${MYSQL_PASSWORD:-}" ]]; then
  MYSQL_ARGS+=(-p"$MYSQL_PASSWORD")
fi

echo "Dropping database fintech_db (if exists)..."
mysql "${MYSQL_ARGS[@]}" -e "DROP DATABASE IF EXISTS fintech_db;"

echo "Running master_database.sql..."
mysql "${MYSQL_ARGS[@]}" < "$MASTER_SQL"

echo "Database setup complete."
