#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_SCRIPT="${DEPLOY_SCRIPT:-$ROOT_DIR/scripts/deploy-live.sh}"
DEPLOY_REMOTE="${DEPLOY_REMOTE:-origin}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
LOCK_FILE="${LOCK_FILE:-/tmp/kalpzero-auto-deploy.lock}"
LOG_FILE="${LOG_FILE:-/tmp/kalpzero-auto-deploy.log}"
DEBUG_AUTO_DEPLOY="${DEBUG_AUTO_DEPLOY:-0}"

log() {
  local timestamp

  timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
  printf '[%s] %s\n' "$timestamp" "$*" | tee -a "$LOG_FILE"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
}

debug_log() {
  if [[ "$DEBUG_AUTO_DEPLOY" == "1" ]]; then
    log "$*"
  fi
}

show_dirty_status() {
  if [[ "$DEBUG_AUTO_DEPLOY" != "1" ]]; then
    return
  fi

  while IFS= read -r line; do
    log "Dirty file: $line"
  done < <(git status --short)
}

fetch_remote() {
  if [[ "$DEBUG_AUTO_DEPLOY" == "1" ]]; then
    git fetch "$DEPLOY_REMOTE" "$DEPLOY_BRANCH" 2>&1 | tee -a "$LOG_FILE"
    return
  fi

  git fetch "$DEPLOY_REMOTE" "$DEPLOY_BRANCH" >/dev/null
}

on_error() {
  local exit_code=$?

  log "Auto-deploy failed with exit code $exit_code"
  exit "$exit_code"
}

trap on_error ERR

main() {
  local local_sha
  local remote_sha

  mkdir -p "$(dirname "$LOCK_FILE")" "$(dirname "$LOG_FILE")"

  exec 9>"$LOCK_FILE"

  require_cmd flock
  require_cmd git

  if ! flock -n 9; then
    log "Another auto-deploy run is already in progress. Skipping."
    exit 0
  fi

  if [[ ! -x "$DEPLOY_SCRIPT" ]]; then
    log "Deploy script is missing or not executable: $DEPLOY_SCRIPT"
    exit 1
  fi

  cd "$ROOT_DIR"

  if ! git diff --quiet || ! git diff --cached --quiet; then
    log "Repository has uncommitted tracked changes. Skipping auto-deploy."
    show_dirty_status
    exit 0
  fi

  log "Checking $DEPLOY_REMOTE/$DEPLOY_BRANCH for new commits"
  fetch_remote

  local_sha="$(git rev-parse HEAD)"
  remote_sha="$(git rev-parse FETCH_HEAD)"

  debug_log "Local SHA:  $local_sha"
  debug_log "Remote SHA: $remote_sha"

  if [[ "$local_sha" == "$remote_sha" ]]; then
    log "No new commit detected. Local and remote are already at $local_sha"
    exit 0
  fi

  if git merge-base --is-ancestor "$local_sha" "$remote_sha"; then
    log "New remote commit detected. Local=$local_sha Remote=$remote_sha"
    log "Running $DEPLOY_SCRIPT"
    "$DEPLOY_SCRIPT" 2>&1 | tee -a "$LOG_FILE"
    log "Auto-deploy completed. Current commit: $(git rev-parse HEAD)"
    exit 0
  fi

  if git merge-base --is-ancestor "$remote_sha" "$local_sha"; then
    log "Local repo is ahead of $DEPLOY_REMOTE/$DEPLOY_BRANCH. Nothing to pull. Local=$local_sha Remote=$remote_sha"
    exit 0
  fi

  log "Local and remote have diverged. Skipping auto-deploy. Local=$local_sha Remote=$remote_sha"
  exit 0
}

main "$@"
