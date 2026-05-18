#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Database provisioning, migration, and seed
# Works with Neon, Supabase, or any Postgres URL in DATABASE_URL
# Usage: ./scripts/setup-db.sh [--seed]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SEED=false
for arg in "$@"; do
  [[ "$arg" == "--seed" ]] && SEED=true
done

echo "─────────────────────────────────────────────────────────────"
echo "  Growth Engine Cinema — Database Setup"
echo "─────────────────────────────────────────────────────────────"

# Load env
source "$(dirname "$0")/../.env.local" 2>/dev/null || true

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "✗ DATABASE_URL is not set. Please configure .env.local"
  exit 1
fi

echo "→ Generating Prisma client…"
npx prisma generate

echo "→ Running database migrations…"
npx prisma migrate deploy

echo "→ Verifying schema…"
npx prisma db pull --print 2>&1 | head -5

if $SEED; then
  echo "→ Running seed…"
  npx tsx scripts/seed.ts
fi

echo ""
echo "✓ Database ready."
