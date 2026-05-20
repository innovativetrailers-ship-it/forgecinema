#!/usr/bin/env bash
# Link Vercel project, sync env vars, deploy production.
# Usage: ./scripts/setup-vercel.sh [https://your-production-domain]
set -euo pipefail

PRODUCTION_URL="${1:-}"

echo "─────────────────────────────────────────────────────────────"
echo "  Cinematic Forge — Vercel Setup (Gap 3)"
echo "─────────────────────────────────────────────────────────────"

if ! command -v vercel &>/dev/null; then
  echo "Installing Vercel CLI…"
  npm install -g vercel
fi

vercel link --yes

if [[ -f .env.local ]]; then
  bash scripts/sync-vercel-env.sh "$PRODUCTION_URL"
else
  echo "⚠ .env.local missing — set env vars in Vercel dashboard (see deploy/vercel/CHECKLIST.md)"
fi

echo ""
echo "→ Deploying production…"
vercel deploy --prod

echo ""
echo "✓ Done. See deploy/vercel/CHECKLIST.md for OAuth, crons, and Railway worker URLs."
