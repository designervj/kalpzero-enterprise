#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"
ENV_FILE="$ROOT_DIR/.env"
VENV_PY="$API_DIR/.venv/bin/python"

status=0
control_database_url=""
psql_database_url=""

check_bin() {
  local label="$1"
  local bin_name="$2"
  if command -v "$bin_name" >/dev/null 2>&1; then
    echo "[ok] $label: $(command -v "$bin_name")"
  else
    echo "[missing] $label: $bin_name"
    status=1
  fi
}

echo "KalpZero Enterprise local doctor"
echo "repo: $ROOT_DIR"
echo

if [[ -f "$ENV_FILE" ]]; then
  echo "[ok] env file: $ENV_FILE"
  control_database_url="$(grep '^KALPZERO_CONTROL_DATABASE_URL=' "$ENV_FILE" | head -n 1 | cut -d '=' -f 2-)"
  psql_database_url="${control_database_url/postgresql+psycopg:/postgresql:}"
  if grep -q '^KALPZERO_CONTROL_DATABASE_URL=postgresql://' "$ENV_FILE"; then
    echo "[warn] env file uses bare postgresql:// URL. The API now normalizes this, but postgresql+psycopg:// is preferred."
  fi
else
  echo "[missing] env file: $ENV_FILE"
  status=1
fi

check_bin "pnpm" "pnpm"
check_bin "python3" "python3"
check_bin "psql" "psql"
check_bin "redis-cli" "redis-cli"
check_bin "mongosh" "mongosh"

if [[ -x "$VENV_PY" ]]; then
  echo "[ok] api venv: $VENV_PY"
  "$VENV_PY" - <<'PY'
import importlib
for module_name in ("psycopg", "sqlalchemy", "fastapi", "redis", "pymongo"):
    try:
        importlib.import_module(module_name)
        print(f"[ok] python module: {module_name}")
    except Exception:
        print(f"[missing] python module: {module_name}")
PY
else
  echo "[missing] api venv: $VENV_PY"
  status=1
fi

if command -v psql >/dev/null 2>&1 && [[ -n "$psql_database_url" ]] && [[ "$psql_database_url" == postgresql* ]]; then
  if psql "$psql_database_url" -c "select 1;" >/dev/null 2>&1; then
    echo "[ok] postgres connection: $control_database_url"
  else
    echo "[missing] postgres connection: $control_database_url"
    status=1
  fi
fi

if command -v redis-cli >/dev/null 2>&1; then
  if redis-cli ping >/dev/null 2>&1; then
    echo "[ok] redis connection"
  else
    echo "[missing] redis connection"
    status=1
  fi
fi

if command -v mongosh >/dev/null 2>&1; then
  if mongosh --quiet --eval 'db.runCommand({ ping: 1 })' >/dev/null 2>&1; then
    echo "[ok] mongo connection"
  else
    echo "[missing] mongo connection"
    status=1
  fi
fi

echo
echo "Local quick-start"
echo "1. Memory mode only: pnpm dev:api:local"
echo "2. Full infra mode: pnpm dev:api:infra"

exit "$status"
