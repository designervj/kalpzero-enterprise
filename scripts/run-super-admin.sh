# #!/usr/bin/env bash

# set -euo pipefail

# ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# RUN_DIR="$ROOT_DIR/.run"
# API_URL="http://127.0.0.1:8000"
# WEB_PORT="${KALPZERO_SUPER_ADMIN_PORT:-3000}"
# WEB_URL="http://127.0.0.1:${WEB_PORT}"
# API_LOG="$RUN_DIR/super-admin-api.log"
# WEB_LOG="$RUN_DIR/super-admin-web.log"
# STARTED_PIDS=()

# mkdir -p "$RUN_DIR"

# cleanup() {
#   if [[ "${#STARTED_PIDS[@]}" -eq 0 ]]; then
#     return
#   fi

#   echo
#   echo "Stopping Super Admin processes..."
#   for pid in "${STARTED_PIDS[@]}"; do
#     if kill -0 "$pid" >/dev/null 2>&1; then
#       kill "$pid" >/dev/null 2>&1 || true
#     fi
#   done
# }

# trap cleanup EXIT INT TERM

# wait_for_url() {
#   local url="$1"
#   local label="$2"
#   local attempts="${3:-60}"
#   local sleep_seconds="${4:-1}"

#   for ((i=1; i<=attempts; i++)); do
#     if curl -fsS "$url" >/dev/null 2>&1; then
#       return 0
#     fi
#     sleep "$sleep_seconds"
#   done

#   echo "Timed out waiting for $label at $url" >&2
#   return 1
# }

# ensure_js_deps() {
#   if [[ ! -d "$ROOT_DIR/node_modules" ]] || [[ ! -d "$ROOT_DIR/apps/web/node_modules" ]]; then
#     echo "Installing JavaScript workspace dependencies..."
#     (cd "$ROOT_DIR" && pnpm install --frozen-lockfile)
#   fi
# }

# ensure_api_venv() {
#   if [[ ! -x "$ROOT_DIR/apps/api/.venv/bin/uvicorn" ]]; then
#     echo "Creating API virtual environment..."
#     (
#       cd "$ROOT_DIR/apps/api"
#       python3 -m venv .venv
#       ./.venv/bin/pip install -e ".[dev]"
#     )
#   fi
# }

# ensure_local_infra() {
#   echo "Checking local infrastructure..."
#   (cd "$ROOT_DIR" && pnpm doctor:local)
# }

# port_in_use() {
#   local port="$1"
#   lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
# }

# ensure_api() {
#   if curl -fsS "$API_URL/health/live" >/dev/null 2>&1; then
#     echo "API already running at $API_URL"
#     return
#   fi

#   if port_in_use 8000; then
#     echo "Port 8000 is already in use, but KalpZero API health is not responding." >&2
#     exit 1
#   fi

#   echo "Starting API on $API_URL ..."
#   nohup bash -lc "cd '$ROOT_DIR' && pnpm dev:api:infra" >"$API_LOG" 2>&1 &
#   local api_pid=$!
#   echo "$api_pid" >"$RUN_DIR/super-admin-api.pid"
#   STARTED_PIDS+=("$api_pid")
#   wait_for_url "$API_URL/health/live" "KalpZero API"
# }

# ensure_web() {
#   if ! curl -fsS "$WEB_URL/login" >/dev/null 2>&1 && port_in_use "$WEB_PORT"; then
#     for candidate_port in 3001 3002 3003 3010; do
#       if ! port_in_use "$candidate_port"; then
#         WEB_PORT="$candidate_port"
#         WEB_URL="http://127.0.0.1:${WEB_PORT}"
#         break
#       fi
#       if curl -fsS "http://127.0.0.1:${candidate_port}/login" >/dev/null 2>&1; then
#         WEB_PORT="$candidate_port"
#         WEB_URL="http://127.0.0.1:${WEB_PORT}"
#         echo "KalpZero web app already running at $WEB_URL"
#         return
#       fi
#     done
#   fi

#   if curl -fsS "$WEB_URL/login" >/dev/null 2>&1; then
#     echo "Web app already running at $WEB_URL"
#     return
#   fi

#   if port_in_use "$WEB_PORT"; then
#     echo "Port $WEB_PORT is already in use, but KalpZero web login is not responding." >&2
#     exit 1
#   fi

#   echo "Starting web app on $WEB_URL ..."
#   nohup bash -lc "cd '$ROOT_DIR/apps/web' && NEXT_PUBLIC_KALPZERO_API_URL='$API_URL' pnpm exec next dev --hostname 127.0.0.1 --port $WEB_PORT" >"$WEB_LOG" 2>&1 &
#   local web_pid=$!
#   echo "$web_pid" >"$RUN_DIR/super-admin-web.pid"
#   STARTED_PIDS+=("$web_pid")
#   wait_for_url "$WEB_URL/login" "KalpZero web app"
# }

# api_post() {
#   local token="$1"
#   local path="$2"
#   local body="$3"
#   local output_file
#   output_file="$(mktemp)"
#   local status_code
#   status_code="$(curl -sS -o "$output_file" -w "%{http_code}" "$API_URL$path" \
#     -H "Authorization: Bearer $token" \
#     -H 'content-type: application/json' \
#     -d "$body")"

#   if [[ "$status_code" != "201" && "$status_code" != "200" && "$status_code" != "409" ]]; then
#     echo "Request to $path failed with status $status_code" >&2
#     cat "$output_file" >&2
#     rm -f "$output_file"
#     exit 1
#   fi

#   rm -f "$output_file"
# }

# seed_demo_data() {
#   echo "Ensuring demo agency and tenant exist..."
#   local platform_token
#   platform_token="$(curl -sS "$API_URL/auth/login" \
#     -H 'content-type: application/json' \
#     -d '{"email":"founder@kalpzero.com","password":"very-secure-password"}' \
#     | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')"

#   api_post "$platform_token" "/platform/agencies" '{"slug":"demo-agency","name":"Demo Agency","region":"in","owner_user_id":"founder@kalpzero.com"}'
#   api_post "$platform_token" "/platform/tenants" '{"agency_slug":"demo-agency","slug":"demo-tenant","display_name":"Demo Tenant","infra_mode":"shared","vertical_packs":["commerce","hotel"],"feature_flags":["seo-suite","custom-domain"]}'
# }

# main() {
#   echo "Booting KalpZero Super Admin..."
#   ensure_js_deps
#   ensure_api_venv
#   ensure_local_infra
#   ensure_api
#   ensure_web
#   seed_demo_data

#   echo
#   echo "Super Admin is ready."
#   echo "Open: $WEB_URL/login"
#   echo "Super Admin login: founder@kalpzero.com / very-secure-password"
#   echo "Tenant Admin login: ops@tenant.com / very-secure-password / tenant slug demo-tenant"
#   echo "API log: $API_LOG"
#   echo "Web log: $WEB_LOG"

#   if command -v open >/dev/null 2>&1; then
#     open "$WEB_URL/login" >/dev/null 2>&1 || true
#   fi

#   if [[ "${#STARTED_PIDS[@]}" -gt 0 ]]; then
#     echo
#     echo "Keep this terminal open while you use Super Admin. Press Ctrl-C to stop the services started by this launcher."
#     wait "${STARTED_PIDS[@]}"
#   fi
# }

# main "$@"


#!/usr/bin/env bash

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
API_URL="http://127.0.0.1:8000"
WEB_PORT="${KALPZERO_SUPER_ADMIN_PORT:-3000}"
WEB_URL="http://127.0.0.1:${WEB_PORT}"
API_LOG="$RUN_DIR/super-admin-api.log"
WEB_LOG="$RUN_DIR/super-admin-web.log"

mkdir -p "$RUN_DIR"

wait_for_url() {
  local url="$1"
  local label="$2"

  for i in {1..60}; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  echo "Timed out waiting for $label at $url"
  exit 1
}

ensure_js_deps() {
  if [[ ! -d "$ROOT_DIR/node_modules" ]]; then
    echo "Installing dependencies..."
    (cd "$ROOT_DIR" && pnpm install)
  fi
}

ensure_api_venv() {
  if [[ ! -d "$ROOT_DIR/apps/api/.venv" ]]; then
    echo "Creating Python venv..."
    cd "$ROOT_DIR/apps/api"
    python -m venv .venv
    ./.venv/Scripts/pip install -e ".[dev]"
  fi
}

ensure_api() {
  echo "Starting API..."

  cd "$ROOT_DIR"
  pnpm dev:api:infra > "$API_LOG" 2>&1 &
  
  wait_for_url "$API_URL/health/live" "API"
}

ensure_web() {
  echo "Starting Web..."

  cd "$ROOT_DIR/apps/web"
  NEXT_PUBLIC_KALPZERO_API_URL="$API_URL" pnpm dev --port $WEB_PORT > "$WEB_LOG" 2>&1 &

  wait_for_url "$WEB_URL/login" "Web"
}

seed_demo_data() {
  echo "Seeding demo data..."

  TOKEN=$(curl -s "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"founder@kalpzero.com","password":"very-secure-password"}' \
    | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

  curl -X POST "$API_URL/platform/agencies" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"slug":"demo-agency","name":"Demo Agency","region":"in","owner_user_id":"founder@kalpzero.com"}'

  curl -X POST "$API_URL/platform/tenants" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"agency_slug":"demo-agency","slug":"demo-tenant","display_name":"Demo Tenant","infra_mode":"shared"}'
}

main() {
  echo "Booting Super Admin (Windows)..."

  ensure_js_deps
  ensure_api_venv
  ensure_api
  ensure_web
  seed_demo_data
  ensure_bootstrap_users

  echo ""
  echo "✅ Ready:"
  echo "👉 $WEB_URL/login"
  echo "Login: founder@kalpzero.com / very-secure-password"
}

main