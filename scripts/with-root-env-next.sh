#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "$#" -ge 2 && "$2" == "--" ]]; then
  set -- "$1" "${@:3}"
fi

exec bash "$SCRIPT_DIR/with-root-env.sh" next "$@"
