#!/usr/bin/env bash
# Health-check Next.js API, Redis-backed workers, and Python microservices.
set -euo pipefail

APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
OTIO_URL="${OTIO_SERVICE_URL:-http://localhost:7432}"
IMF_URL="${IMF_SERVICE_URL:-http://localhost:7433}"
SG_URL="${SHOTGRID_SERVICE_URL:-http://localhost:7434}"
EXR_URL="${EXR_SERVICE_URL:-http://localhost:7435}"
WORKER_TOKEN="${WORKER_HEALTH_TOKEN:-}"

check() {
  local name="$1" url="$2"
  if curl -sf --max-time 5 "$url" >/dev/null 2>&1; then
    echo "  ✓ $name"
  else
    echo "  ✗ $name ($url)"
  fi
}

echo "CINÉMA service health"
check "API"           "$APP_URL/api/health"
check "OTIO"          "$OTIO_URL/health"
check "IMF"           "$IMF_URL/health"
check "ShotGrid"      "$SG_URL/health"
check "EXR"           "$EXR_URL/health"

if [[ -n "$WORKER_TOKEN" ]]; then
  check "Queue workers" "$APP_URL/api/health/workers?token=$WORKER_TOKEN"
  check "BullMQ queues" "$APP_URL/api/health/queues?token=$WORKER_TOKEN"
else
  echo "  · workers/queues (set WORKER_HEALTH_TOKEN to check)"
fi
