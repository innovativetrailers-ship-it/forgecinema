# RUN 40 — Domain cutover: Cinematic Forge to cinema.ai-forge.co
Runs AFTER Runs 38+39 are verified and deployed on the current Vercel address. One pass, no stops. Branch run-40-domain per repo, no push/tag/deploy until told.
Invariants as before (INV-1..8, §Q, pause guard, never print secrets). Hosting stays Vercel (web) + Railway (workers). Neo has decided: domain ai-forge.co; this app lives at cinema.ai-forge.co;
the old forgecinema.vercel.app must keep working and redirect (308) to the new host.

## 1. One source of truth for the app address (web)
- Single exported constant/helper (src/lib/appUrl.ts) reading NEXT_PUBLIC_APP_URL; default https://cinema.ai-forge.co. Replace every hard-coded host and every stray default
  (e.g. src/app/layout.tsx currently defaults to https://cinema.growthengine.ai; the Stripe success/cancel/return URLs in src/app/api/payments/*; branch/[embedId]/page.tsx). grep for forgecinema,
  growthengine, vercel.app across src/, scripts/, deploy/, vercel.json, next.config.ts, .env.example and fix each. Docs/DEPLOYMENT.md, deploy/vercel/CHECKLIST.md, deploy/railway/README.md updated.
- NEXTAUTH_URL, cookie names/secure settings, CORS allow-list and the CSP/report-only policy built from that one value. No wildcard origins. Cookies host-only (NO Domain=.ai-forge.co attribute).
- HSTS: max-age=31536000 only; NO includeSubDomains and NO preload yet (the hub and other apps share the apex; revisit once all are stable).
- Redirect: requests to forgecinema.vercel.app → 308 to the same path on cinema.ai-forge.co (vercel.json redirects/host rule or middleware). Webhook paths (/api/webhooks/*) must NOT redirect:
  Stripe/fal must be repointed by hand, and the old host keeps answering webhooks during the overlap (document the overlap window in the report).

## 2. Webhooks and workers
- fal webhook base URL used by web + Railway workers derives from the same helper/env (WEBHOOK_BASE_URL falling back to NEXT_PUBLIC_APP_URL). Tokens stay bound to subject and expiry (Run 39);
  verification must accept webhooks regardless of which host delivered them.
- Stripe: success/cancel/portal return URLs from the helper. Document the manual step: add a NEW Stripe webhook endpoint at https://cinema.ai-forge.co/api/webhooks/stripe, confirm deliveries, THEN remove the old one.
- Railway env sync scripts (sync-railway-env.sh, sync-railway-essential.sh, sync-vercel-env.sh, repair-vercel-auth-env.sh) updated to the new variables; no secret values printed.

## 3. Desktop (cinematic-forge-v3) built against the final host
- One server-address setting (src/shared/external.ts is the single source): default https://cinema.ai-forge.co. Replace every forgecinema reference: src/shared/commerceSettings.ts, cognitionRelay.ts, crash.ts,
  PreferencesPanel.tsx, electron-builder.config.cjs (publish/update feed + download URLs), .github/workflows/release.yml, README(s), LICENSE.txt, tests.
- The app trusts ONLY an allow-list of hosts (cinema.ai-forge.co; the old host during overlap). A server address from env/config outside the allow-list is ignored in packaged builds. Tests for the allow-list.
- Auto-update feed and the link/licence/relay endpoints use the same address. Bump to 3.0.6, rebuild arm64 (and x64 if built separately), run check-mach-o-arch, verify-packaged-app, notarise, staple.
  3.0.5 and 3.0.4 stay withdrawn. The web download gate stays CLOSED until Neo opens it.

## 4. Auth and third parties (list what must be changed by hand — do NOT attempt them)
Produce docs/DOMAIN-CUTOVER-CHECKLIST.md with exact values for Neo to apply: Vercel project domain + redirect, DNS records, NEXTAUTH_URL / NEXT_PUBLIC_APP_URL on Vercel and Railway, OAuth provider
redirect URIs (Google etc.), Stripe webhook + portal/branding URLs, fal dashboard webhook if any, R2/CORS origins, email sender (SPF/DKIM/DMARC) for noreply@/contact@ai-forge.co, Apple/Windows signing metadata that names the
host, and a rollback section (how to revert in under 10 minutes).

## 5. Tests and gates
- Named tests: single helper used everywhere (verify-static rule fails on any literal forgecinema/growthengine/vercel.app host in src outside the redirect rule and allow-list); redirect keeps path+query;
  webhooks not redirected; CSP/CORS contain only the configured host(s); desktop ignores a non-allow-listed server address; Stripe return URLs built from the helper.
- tsc 0, verify-static 0, full Jest suite, desktop suite, verify-packaged-app on the NEW 3.0.6 build.
- One final report: PASS/NOT DONE per section, files changed, and the exact hand steps Neo must do in order.
