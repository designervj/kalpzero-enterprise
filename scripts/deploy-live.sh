#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_REMOTE="${DEPLOY_REMOTE:-origin}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
DEPLOY_PM2_APPS="${DEPLOY_PM2_APPS:-kalpzero-api,kalpzero-web}"
HEALTH_CHECK_ATTEMPTS="${HEALTH_CHECK_ATTEMPTS:-20}"
HEALTH_CHECK_SLEEP_SECONDS="${HEALTH_CHECK_SLEEP_SECONDS:-2}"
SKIP_PULL=0

for arg in "$@"; do
  case "$arg" in
    --skip-pull)
      SKIP_PULL=1
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

ensure_clean_repo() {
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Refusing to deploy with uncommitted changes in $ROOT_DIR" >&2
    exit 1
  fi
}

ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    return
  fi

  if command -v corepack >/dev/null 2>&1; then
    log "Activating pnpm via corepack"
    corepack enable >/dev/null 2>&1 || true
    corepack prepare pnpm@10.5.2 --activate >/dev/null 2>&1
  fi

  require_cmd pnpm
}

ensure_api_env() {
  if [[ ! -f "$ROOT_DIR/apps/api/.env" ]]; then
    echo "Missing $ROOT_DIR/apps/api/.env on the deploy server" >&2
    exit 1
  fi
}

ensure_api_venv() {
  if [[ ! -x "$ROOT_DIR/apps/api/.venv/bin/python" ]]; then
    log "Creating API virtual environment"
    python3 -m venv "$ROOT_DIR/apps/api/.venv"
  fi

  log "Syncing API dependencies"
  "$ROOT_DIR/apps/api/.venv/bin/pip" install --upgrade pip
  "$ROOT_DIR/apps/api/.venv/bin/pip" install -e "$ROOT_DIR/apps/api"
}

update_code() {
  local current_branch

  log "Updating repository from $DEPLOY_REMOTE/$DEPLOY_BRANCH"
  git fetch "$DEPLOY_REMOTE" "$DEPLOY_BRANCH"
  current_branch="$(git rev-parse --abbrev-ref HEAD)"

  if [[ "$current_branch" != "$DEPLOY_BRANCH" ]]; then
    git checkout "$DEPLOY_BRANCH"
  fi

  git pull --ff-only "$DEPLOY_REMOTE" "$DEPLOY_BRANCH"
}

restart_services() {
  log "Refreshing PM2 apps: $DEPLOY_PM2_APPS"
  pm2 startOrRestart "$ROOT_DIR/ecosystem.config.cjs" --only "$DEPLOY_PM2_APPS" --update-env
  pm2 save
}

wait_for_http_endpoint() {
  local name="$1"
  local url="$2"
  local attempt=1

  while (( attempt <= HEALTH_CHECK_ATTEMPTS )); do
    if curl -fsS --max-time 15 "$url" >/dev/null; then
      log "$name health check passed: $url"
      return 0
    fi

    if (( attempt == HEALTH_CHECK_ATTEMPTS )); then
      echo "$name health check failed after ${HEALTH_CHECK_ATTEMPTS} attempts: $url" >&2
      return 1
    fi

    log "Waiting for $name to become healthy (attempt ${attempt}/${HEALTH_CHECK_ATTEMPTS}): $url"
    sleep "$HEALTH_CHECK_SLEEP_SECONDS"
    attempt=$((attempt + 1))
  done
}

run_health_checks() {
  log "Running post-deploy health checks"

  wait_for_http_endpoint "API" "http://127.0.0.1:8012/health/live"
  wait_for_http_endpoint "Frontend" "http://127.0.0.1:3002/login"
}

main() {
  cd "$ROOT_DIR"

  require_cmd git
  require_cmd python3
  require_cmd curl
  require_cmd pm2
  ensure_pnpm
  ensure_api_env
  ensure_clean_repo

  if [[ "$SKIP_PULL" -eq 0 ]]; then
    update_code
  else
    log "Skipping git pull"
  fi

  log "Installing workspace dependencies"
  pnpm install --frozen-lockfile

  ensure_api_venv

  export KALPZERO_INTERNAL_API_URL="${KALPZERO_INTERNAL_API_URL:-http://127.0.0.1:8012}"
  export KALPZERO_API_PROXY_URL="${KALPZERO_API_PROXY_URL:-http://127.0.0.1:8012}"
  export KALPZERO_PUBLIC_API_URL="${KALPZERO_PUBLIC_API_URL:-https://kalptree.xyz/api}"
  export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-/api}"
  export NEXT_PUBLIC_KALPZERO_API_URL="${NEXT_PUBLIC_KALPZERO_API_URL:-/api}"

  log "Building workspace"
  pnpm build

  restart_services
  run_health_checks

  log "Deploy completed successfully"
}

main "$@"
