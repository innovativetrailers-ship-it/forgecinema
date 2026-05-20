#!/usr/bin/env bash
# Production deploy to Vercel (build runs remotely).
# Usage: ./scripts/deploy-vercel.sh [production-url]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PRODUCTION_URL="${1:-${PRODUCTION_URL:-}}"

if ! command -v vercel &>/dev/null; then
  npm install -g vercel
fi

if [[ -f .env.local ]]; then
  echo "→ Syncing environment variables…"
  bash scripts/sync-vercel-env.sh "$PRODUCTION_URL"
else
  echo "⚠ No .env.local — ensure Vercel env vars are set in the dashboard"
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "→ Running Prisma migrate deploy…"
  npx prisma migrate deploy
elif [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
  if [[ -n "${DATABASE_URL:-}" ]]; then
    echo "→ Running Prisma migrate deploy…"
    npx prisma migrate deploy
  fi
fi

echo "→ Deploying to Vercel production…"
vercel deploy --prod

echo ""
echo "✓ Deploy triggered. Dashboard: https://vercel.com/dashboard"
