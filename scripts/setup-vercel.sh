#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Vercel project setup — link project and push all environment variables
# Requires: vercel CLI (`npm i -g vercel`) and .env.local
# Usage: ./scripts/setup-vercel.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "─────────────────────────────────────────────────────────────"
echo "  Growth Engine Cinema — Vercel Setup"
echo "─────────────────────────────────────────────────────────────"

if ! command -v vercel &>/dev/null; then
  echo "Installing Vercel CLI…"
  npm install -g vercel
fi

# Link project (creates .vercel/project.json)
echo "→ Linking Vercel project…"
vercel link --yes

# Push env vars from .env.local to all environments
echo "→ Pushing environment variables…"
ENV_FILE=".env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ $ENV_FILE not found — copy .env.example and fill in values first"
  exit 1
fi

ENVS=("production" "preview" "development")

while IFS='=' read -r key value || [[ -n "$key" ]]; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
  # Strip inline comments and trim whitespace
  value="${value%%#*}"
  value="${value// /}"
  key="${key// /}"
  [[ -z "$value" ]] && continue

  for env in "${ENVS[@]}"; do
    echo "  $key → $env"
    echo "$value" | vercel env add "$key" "$env" --force 2>/dev/null || true
  done
done < "$ENV_FILE"

echo ""
echo "✓ Environment variables pushed."
echo ""
echo "→ Triggering first deployment…"
vercel --prod

echo ""
echo "✓ Deployment complete! Check https://vercel.com/dashboard for status."
