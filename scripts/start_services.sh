#!/bin/bash
# Starts all CINÉMA Python microservices alongside the Next.js app.
# Usage: bash scripts/start_services.sh [--wait]
# Install deps first: bash scripts/install-python-services.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Starting CINÉMA Python services..."
echo "Root: $ROOT_DIR"

if ! command -v python3 &>/dev/null; then
  echo "Warning: python3 not found. Python services will not start."
  exit 0
fi

check_package() {
  python3 -c "import $1" 2>/dev/null && echo "  ✓ $1" || echo "  ✗ $1 (run: bash scripts/install-python-services.sh)"
}

echo "Checking Python dependencies..."
check_package flask
check_package opentimelineio

cd "$ROOT_DIR"

start_service() {
  local name="$1"
  local port="$2"
  local script="$3"
  if lsof -i:"$port" &>/dev/null; then
    echo "$name already running on port $port"
    return
  fi
  echo "Starting $name (port $port)..."
  PORT="$port" python3 "$script" &
  echo "  PID: $!"
}

start_service "OTIO"     "${OTIO_PORT:-7432}" "src/services/otio_service.py"
start_service "IMF"      "${IMF_PORT:-7433}" "src/services/imf_service.py"
start_service "ShotGrid" "${SHOTGRID_PORT:-7434}" "src/services/shotgrid_service.py"
start_service "EXR"      "${EXR_PORT:-7435}" "src/services/exr_service.py"

echo ""
echo "Python services started."
echo "  OTIO     → ${OTIO_SERVICE_URL:-http://localhost:7432}/health"
echo "  IMF      → ${IMF_SERVICE_URL:-http://localhost:7433}/health"
echo "  ShotGrid → ${SHOTGRID_SERVICE_URL:-http://localhost:7434}/health"
echo "  EXR      → ${EXR_SERVICE_URL:-http://localhost:7435}/health"
echo ""
echo "Verify: bash scripts/check-services.sh"

if [ "${1}" == "--wait" ]; then
  wait
fi
