# RUN 39 — Server relay for desktop generation, hard credit gating, dev bring-your-own-key
Runs AFTER Run 38 is verified. One pass, no stops. Branch run-39-relay per repo, no push/tag/deploy until told.
Invariants as Run 38: INV-1 billing chokepoint, INV-3 registry endpoints, INV-4 honest UI, INV-5 no silent substitution/swallowed catches,
INV-7 additive migrations only, INV-8 web/desktop parity, §Q user data never deleted, pause guard (unset GENERATION_PAUSED = paused) enforced SERVER-side. Never print secrets.

## Decisions already made by Neo (do not re-raise)
1. The desktop never holds the platform FAL_KEY or FAL_WEBHOOK_SECRET. Both live only on Vercel and Railway.
2. EVERY paid call from web or desktop is gated by the user's balance/allocation. No overspend, ever.
3. The only ungated (isInternal) account is innovative.trailers@gmail.com.
4. Dev accounts may use their own provider keys. First: susi.tate@gmail.com.

## Step 0 — undo the wrong desktop change
Revert 56fc575 semantics on the desktop: remove FAL_WEBHOOK_SECRET from .env.example, src/main/env.ts, README, docs/DESKTOP-SIGNING.md; delete
signFalWebhookToken/verifyFalWebhookToken and the webhook-token path in src/main/ai/falQueue.ts. Keep the packaged-app check but widen it: fail if dist/,
renderer or preload contains FAL_KEY, FAL_WEBHOOK_SECRET, any value of either, or a literal assignment of either.

## Part 1 — Server relay (web repo, deploy web + workers together)
Flow: desktop → authenticated Forge route (Vercel) → account + balance + pause + registry checks → openHold → job queued → Railway worker submits to fal with platform
FAL_KEY and a signed webhook URL → fal calls /api/webhooks/fal (Vercel) → verify signature → settle hold → store result → desktop reads status/result from the server.
1. New routes under src/app/api/desktop/generate/: submit, status, result, cancel. Auth = the existing desktop Bearer/session token from the link flow.
   Request carries typed intent (endpoint key from the registry, never a raw fal path, INV-3) and inputs; the server computes the cost estimate itself — never trusts a client price.
2. Every route goes through ONE chokepoint function (extend meterDesktopRelay / runMetered): check account exists and is active, GENERATION_PAUSED, entitlement/tier, balance >= hold,
   open hold atomically, enqueue, settle on success, release on failure/cancel/timeout. No fal call anywhere outside this chokepoint.
3. Webhook signing: web and Railway workers share FAL_WEBHOOK_SECRET (same value). Signer in src/lib/training/start.ts and verifier src/lib/webhooks/falSignature.ts stay the single pair;
   expiry + subject binding retained. Unknown/expired/forged token → 401, no state change. Replayed event → 200 no-op.
4. Desktop: replace direct fal submit/poll (src/main/ai/falQueue.ts, falClient.ts, anthropicClient.ts fal use) with calls to the relay. Remove the process.env.FAL_KEY and env GENERATION_PAUSED
   client checks as authority (keep GENERATION_PAUSED as a UX hint only). Server responses carry a user-readable reason (insufficient credits, paused, not entitled) and the UI shows it (INV-4).
5. Same relay for web UI generation so web and desktop share one path (INV-8).
6. Env: add FAL_WEBHOOK_SECRET to scripts/sync-railway-env.sh and scripts/sync-railway-essential.sh; document in DEPLOYMENT.md/deploy/railway/README.md that the value must be IDENTICAL
   on Vercel and every Railway service that submits to fal. Startup check on both: fail loudly if unset where required.

## Part 2 — Hard gating for ALL paid calls (no overspend)
1. Inventory every outbound paid call (fal, ElevenLabs, Anthropic/LLM, upscaler, anything with a provider key) in web, workers and desktop relay. Produce docs/PAID-CALL-INVENTORY.md:
   call site → chokepoint used. Any call not behind the chokepoint is a defect: fix it. Add a verify-static rule that fails the build when a provider SDK/fetch is used outside the chokepoint module.
2. Atomic hold: balance must cover the held amount inside the same transaction (already true for openHold; extend to every path including training, export, think/learn/feedback, TTS, upscale).
3. Never negative: settlement can never charge above the hold. If a job's actual cost would exceed its hold, stop/cancel the job (and release unused) rather than overdraw. Add an additive
   DB CHECK constraint creditBalance >= 0 and heldCredits >= 0 via a new migration — first query and report any existing negative rows; if any exist, do not apply the constraint, list them in the report.
4. Allocation: monthly subscription allocation and purchased packs are separate buckets in the ledger; usage draws allocation first then purchased; cap per period; no auto top-up; subscription renewal
   adds (increment) never resets. Stripe idempotency as Run 38.
5. Rate/abuse limits: per-user max concurrent holds and a per-minute submit limit; per-job maximum estimate; reject absurd estimates.
6. Failure path: provider error/timeout/cancel releases the hold exactly once; webhook-late results after release are stored but not charged twice.
7. Tests (named): unfunded call refused before any provider request; funded call holds then settles; two concurrent holds cannot overdraw; actual>hold cannot push balance negative;
   release exactly once; allocation drawn before purchased; no provider call outside chokepoint (verify-static); desktop relay with forged/missing token refused; paused server refuses.

## Part 3 — The only ungated account
1. Ungated means isInternal = true. Allowed ONLY for innovative.trailers@gmail.com (case-insensitive exact match).
2. Rewrite scripts/grant-internal.mjs: hard-refuse any email other than that one; refuse if more than one match; add a --revoke path. Keep the confirm prompt.
3. Server guard: a startup/health check and a nightly job that count isInternal users; if any isInternal user's email is not the allowed one, log a high-severity alert and treat that user as NOT internal in
   openHold/runMetered (fail closed). Single constant ALLOWED_INTERNAL_EMAIL in one file; do not read it from client input.
4. Audit every other bypass (role ADMIN/OWNER, test accounts, env flags, "dev" shortcuts) and remove any that skip balance checks. List each in the report.
5. Tests: other email can never be marked internal by the script; an internal flag on another email is ignored (charged normally); allowed account is not charged but still logged in the ledger with amount 0 and a reason.

## Part 4 — Dev accounts with their own keys
1. Additive schema (INV-7): User.canUseOwnKeys Boolean @default(false). New script scripts/grant-dev-keys.mjs, same safety as grant-internal (exact email, one match, confirm, --revoke), with an allowlist
   constant DEV_KEY_EMAILS = [susi.tate@gmail.com]; refuse others unless added to the constant in code.
2. Where keys live: desktop only, in the OS-protected keystore (Electron safeStorage via src/main/keystore.ts). The server never stores or sees them. Never logged, never in renderer/preload,
   never in crash reports, never in the packaged bundle (Step 0 check).
3. Behaviour: if the signed-in account has canUseOwnKeys and has saved a provider key, the desktop MAY call that provider directly with the user's key; no Forge credits are charged;
   the UI clearly labels the job "own key — not billed by Forge" (INV-4). If the flag is false, the key field is hidden and any stored key is ignored. The flag comes from the server (license/account endpoint).
4. Keep a ledger row per own-key job (amount 0, reason own-key, endpoint, no key material) so usage is visible. Pause guard still applies as a UX stop, not a security boundary (their key, their cost).
5. Tests: flag false → relay used, own key ignored; flag true + key → direct call, no credits changed, labelled; key never present in logs/renderer/dist.

## Gates and report
tsc 0, verify-static 0, all unit tests, new tests above; web + desktop. verify-packaged-app passes on a NEW build. Final single report: each Part/step PASS/NOT DONE with test names, the PAID-CALL-INVENTORY
result, any negative-balance rows found, bypasses removed, new env vars (FAL_WEBHOOK_SECRET on Vercel and Railway; nothing on desktop), and what waits on Neo
(set the secret on Vercel + Railway, run grant-internal for innovative.trailers@gmail.com, run grant-dev-keys for susi.tate@gmail.com, then deploy web + workers together).
