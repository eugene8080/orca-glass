#!/usr/bin/env bash
# launchd entrypoint; keep logs under .local/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL="$ROOT/.local"
mkdir -p "$LOCAL"
LOG="$LOCAL/startup.log"
PORT="${PORT:-8787}"
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "$(date -Iseconds) Port ${PORT} already occupied; startup skipped." >>"$LOG"
  exit 0
fi
export HOST="${HOST:-127.0.0.1}"
export PORT
cd "$ROOT"
echo "$(date -Iseconds) Starting Orca Glass." >>"$LOG"
exec node scripts/start.mjs >>"$LOCAL/custom-output.log" 2>>"$LOCAL/custom-error.log"
