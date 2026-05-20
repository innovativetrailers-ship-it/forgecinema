#!/usr/bin/env bash
# Install Python deps for OTIO / IMF / ShotGrid / EXR microservices.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "Installing CINÉMA Python service dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install -r "$ROOT/src/services/requirements.txt"
echo "Done. Run: bash scripts/start_services.sh"
