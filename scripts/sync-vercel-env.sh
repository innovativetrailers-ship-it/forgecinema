#!/usr/bin/env bash
# Push .env.local → Vercel (production + preview + development).
# Usage:
#   ./scripts/sync-vercel-env.sh
#   ./scripts/sync-vercel-env.sh https://your-app.vercel.app
#
# Production-only URLs (NEXTAUTH_URL, AUTH_URL, NEXT_PUBLIC_APP_URL) are set
# only on the production environment when you pass the production URL argument.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.local}"
PRODUCTION_URL="${1:-}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ $ENV_FILE not found — copy .env.example first"
  exit 1
fi

if ! command -v vercel &>/dev/null; then
  echo "Install Vercel CLI: npm i -g vercel"
  exit 1
fi

if [[ ! -f .vercel/project.json ]]; then
  echo "→ Linking project…"
  vercel link --yes
fi

PRODUCTION_ONLY=(NEXTAUTH_URL AUTH_URL NEXT_PUBLIC_APP_URL)
SKIP_PREFIXES=(DATABASE_DAS_URL) # local-only unless you use Neon DAS in prod

should_skip_key() {
  local key="$1"
  for p in "${SKIP_PREFIXES[@]}"; do
    [[ "$key" == "$p" ]] && return 0
  done
  return 1
}

is_production_only() {
  local key="$1"
  for k in "${PRODUCTION_ONLY[@]}"; do
    [[ "$key" == "$k" ]] && return 0
  done
  return 1
}

add_env() {
  local key="$1" value="$2" target="$3"
  printf '%s' "$value" | vercel env add "$key" "$target" --force >/dev/null 2>&1 \
    && echo "  ✓ $key → $target" \
    || echo "  · $key → $target (skipped or unchanged)"
}

echo "Syncing $ENV_FILE to Vercel…"

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  key="${key// /}"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  value="${value%%#*}"
  value="${value%"${value##*[![:space:]]}"}"
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"

  [[ -z "$key" || -z "$value" ]] && continue
  should_skip_key "$key" && continue

  if is_production_only "$key"; then
    if [[ -n "$PRODUCTION_URL" ]]; then
      add_env "$key" "$PRODUCTION_URL" production
    else
      echo "  · $key — production only (pass production URL as arg 1 to set)"
    fi
    continue
  fi

  for target in production preview development; do
    add_env "$key" "$value" "$target"
  done
done < "$ENV_FILE"

# Preview: trustHost handles auth URL; optional explicit preview app URL
if [[ -n "$PRODUCTION_URL" ]]; then
  add_env "NEXT_PUBLIC_APP_URL" "$PRODUCTION_URL" production
fi

echo ""
echo "Done. Set CRON_SECRET on production if missing:"
echo "  openssl rand -hex 32 | vercel env add CRON_SECRET production"
echo ""
echo "Preview deploys: leave NEXTAUTH_URL unset on preview (auth uses trustHost + VERCEL_URL)."
echo "Google OAuth: add https://<prod-domain>/api/auth/callback/google"
