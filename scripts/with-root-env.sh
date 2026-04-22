#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

load_root_env() {
  local line key value

  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Missing $ENV_FILE" >&2
    return 1
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "$line" || "${line:0:1}" == "#" ]] && continue
    [[ "$line" != *=* ]] && continue

    key="${line%%=*}"
    value="${line#*=}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    value="${value#"${value%%[![:space:]]*}"}"

    if [[ "$key" == export\ * ]]; then
      key="${key#export }"
    fi

    if [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      continue
    fi

    if [[ -n "${!key+x}" ]]; then
      continue
    fi

    if [[ "${#value}" -ge 2 ]]; then
      if [[ "${value:0:1}" == "\"" && "${value: -1}" == "\"" ]]; then
        value="${value:1:-1}"
      elif [[ "${value:0:1}" == "'" && "${value: -1}" == "'" ]]; then
        value="${value:1:-1}"
      fi
    fi

    export "$key=$value"
  done < "$ENV_FILE"
}

set_compat_env() {
  if [[ -n "${KALPZERO_OPENAI_API_KEY:-}" && -z "${OPENAI_API_KEY:-}" ]]; then
    export OPENAI_API_KEY="$KALPZERO_OPENAI_API_KEY"
  fi

  if [[ -n "${KALPZERO_JWT_SECRET:-}" && -z "${JWT_SECRET:-}" ]]; then
    export JWT_SECRET="$KALPZERO_JWT_SECRET"
  fi

  if [[ -n "${KALPZERO_ENCRYPTION_KEY:-}" && -z "${KALP_SECRET_ENCRYPTION_KEY:-}" ]]; then
    export KALP_SECRET_ENCRYPTION_KEY="$KALPZERO_ENCRYPTION_KEY"
  fi

  if [[ -n "${KALPZERO_RUNTIME_MONGO_URL:-}" && -z "${MONGODB_URI:-}" ]]; then
    export MONGODB_URI="$KALPZERO_RUNTIME_MONGO_URL"
  fi

  if [[ -n "${KALPZERO_PUBLIC_WEB_URL:-}" && -z "${KALP_PUBLIC_BASE_URL:-}" ]]; then
    export KALP_PUBLIC_BASE_URL="$KALPZERO_PUBLIC_WEB_URL"
  fi

  if [[ -n "${KALPZERO_PUBLIC_API_URL:-}" && -z "${NEXT_PUBLIC_KALPZERO_API_URL:-}" ]]; then
    export NEXT_PUBLIC_KALPZERO_API_URL="$KALPZERO_PUBLIC_API_URL"
  fi
}

if [[ "$#" -eq 0 ]]; then
  echo "Usage: $0 <command> [args...]" >&2
  exit 1
fi

load_root_env
set_compat_env

exec "$@"
