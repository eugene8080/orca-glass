#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT=18787
export HOST=127.0.0.1
export PORT
export EHO_TOKEN=ci-smoke-test
node bridge/server.mjs &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; wait "$PID" 2>/dev/null || true; }
trap cleanup EXIT
for _ in $(seq 1 40); do
  if curl -sf "http://127.0.0.1:${PORT}/healthz" | grep -q '"ok":true'; then
    echo "healthz ok"
    exit 0
  fi
  sleep 0.25
done
echo "healthz failed" >&2
exit 1
