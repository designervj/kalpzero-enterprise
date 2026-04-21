#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECK_SCRIPT="${CHECK_SCRIPT:-$ROOT_DIR/scripts/auto-deploy-live.sh}"
INTERVAL_SECONDS="${AUTO_DEPLOY_DEBUG_INTERVAL:-60}"
RUN_ONCE=0

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

usage() {
  cat <<'EOF'
Usage:
  ./scripts/auto-deploy-debug.sh
  ./scripts/auto-deploy-debug.sh --once
  ./scripts/auto-deploy-debug.sh --interval=15

Options:
  --once          Run a single check and exit.
  --interval=N    Run checks every N seconds in the foreground.

Environment:
  AUTO_DEPLOY_DEBUG_INTERVAL   Default loop interval in seconds.
  CHECK_SCRIPT                 Override the auto-deploy check script path.
EOF
}

for arg in "$@"; do
  case "$arg" in
    --once)
      RUN_ONCE=1
      ;;
    --interval=*)
      INTERVAL_SECONDS="${arg#*=}"
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ ! "$INTERVAL_SECONDS" =~ ^[0-9]+$ ]] || [[ "$INTERVAL_SECONDS" -lt 1 ]]; then
  echo "Interval must be a positive integer. Received: $INTERVAL_SECONDS" >&2
  exit 1
fi

if [[ ! -x "$CHECK_SCRIPT" ]]; then
  echo "Check script is missing or not executable: $CHECK_SCRIPT" >&2
  exit 1
fi

trap 'log "Stopping auto-deploy debug runner"; exit 0' INT TERM

main() {
  local iteration=1

  log "Starting auto-deploy debug runner"
  log "Repo: $ROOT_DIR"
  log "Check script: $CHECK_SCRIPT"
  log "Interval: ${INTERVAL_SECONDS}s"
  log "Press Ctrl+C to stop"

  while true; do
    log "Debug check #$iteration"
    DEBUG_AUTO_DEPLOY=1 "$CHECK_SCRIPT"

    if [[ "$RUN_ONCE" -eq 1 ]]; then
      log "Single debug check completed"
      exit 0
    fi

    iteration=$((iteration + 1))
    log "Sleeping for ${INTERVAL_SECONDS}s before next check"
    sleep "$INTERVAL_SECONDS"
  done
}

main "$@"
