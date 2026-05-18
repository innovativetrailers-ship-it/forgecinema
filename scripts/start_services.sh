#!/bin/bash
# Starts all CINÉMA Python microservices alongside the Next.js app.
# Usage: bash scripts/start_services.sh
# Or via: npm run dev (which runs both concurrently)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Starting CINÉMA Python services..."
echo "Root: $ROOT_DIR"

# Check for Python
if ! command -v python3 &>/dev/null; then
  echo "Warning: python3 not found. Python services will not start."
  exit 0
fi

# Check for required Python packages
check_package() {
  python3 -c "import $1" 2>/dev/null && echo "  ✓ $1" || echo "  ✗ $1 (run: pip install $1)"
}

echo "Checking Python dependencies..."
check_package flask
check_package opentimelineio

cd "$ROOT_DIR"

# OTIO service — port 7432
if lsof -i:7432 &>/dev/null; then
  echo "OTIO service already running on port 7432"
else
  echo "Starting OTIO service (port 7432)..."
  python3 src/services/otio_service.py &
  OTIO_PID=$!
  echo "  PID: $OTIO_PID"
fi

# IMF packaging service — port 7433
if lsof -i:7433 &>/dev/null; then
  echo "IMF service already running on port 7433"
else
  echo "Starting IMF service (port 7433)..."
  python3 src/services/imf_service.py &
  IMF_PID=$!
  echo "  PID: $IMF_PID"
fi

# ShotGrid service — port 7434
if lsof -i:7434 &>/dev/null; then
  echo "ShotGrid service already running on port 7434"
else
  echo "Starting ShotGrid service (port 7434)..."
  python3 src/services/shotgrid_service.py &
  SG_PID=$!
  echo "  PID: $SG_PID"
fi

# OpenEXR service — port 7435
if lsof -i:7435 &>/dev/null; then
  echo "EXR service already running on port 7435"
else
  echo "Starting EXR service (port 7435)..."
  python3 src/services/exr_service.py &
  EXR_PID=$!
  echo "  PID: $EXR_PID"
fi

echo ""
echo "All Python services started."
echo "Services:"
echo "  OTIO     → http://localhost:7432/health"
echo "  IMF      → http://localhost:7433/health"
echo "  ShotGrid → http://localhost:7434/health"
echo "  EXR      → http://localhost:7435/health"
echo ""

# Wait for all background processes to finish if running standalone
if [ "${1}" == "--wait" ]; then
  wait
fi
