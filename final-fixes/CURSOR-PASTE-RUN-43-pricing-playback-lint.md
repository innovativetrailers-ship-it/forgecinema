# CURSOR PASTE — RUN 43 — real fal costs, charge table, legacy playback, lint (2026-10-14)

Paste PART 1 into the WEB window and PART 2 into the DESKTOP window. Each runs straight through without stopping, asking, or re-raising decisions. Branch from main (4891264, deployment forgecinema-gevclqdtb). Obey the forge-engineering invariants (INV-1, INV-4, INV-5, INV-7, INV-8, user data never deleted, pause guard: leave GENERATION_PAUSED as it is).

Neo's pricing rule (decided): Forge price = fal cost + 50% (price = fal cost x 1.5, gross margin 33.3%). Neo's decision for the charge table (decided, implement it, do not wait for another approval): charge credits so the LOWEST-value plan still meets the rule, so no plan ever loses money.

# PART 1 — WEB WINDOW

## A. Legacy clips still fail to play (found live after Run 42)
Live check on https://forgecinema.vercel.app/ultimate, Neo's account: a clip already on the timeline shows "Could not load media". The console shows the player still requests `/api/media/lib_JfKGYWXZtjRq5lUXcmGXG`, which redirects to R2 and is blocked by CORS. So Run 42's `/api/media/[id]/stream` is not used for clips whose stored URL was saved before the change.
1. Resolve the media URL at PLAY time, never from a stored URL: any stored `/api/media/<id>` (and any raw R2 URL for our bucket) is rewritten to `/api/media/<id>/stream` when a clip loads. No stored data is changed or deleted.
2. The playback spec must use a REAL decodable mp4 fixture (a 2 s test clip committed to e2e fixtures, served through the stream route) and assert: the timecode advances, `video.currentTime` increases, `videoWidth > 0`, and a frame is drawn. Also a second case that loads a clip saved with the OLD url shape. Fail the suite if the monitor still says "Could not load media".
3. After deploy, verify on production in a browser: the existing timeline clip plays. Report what you saw.
4. Keep the CORS rule work: R2 CORS is still not applied (AccessDenied). Neo applies the rule by hand in the Cloudflare dashboard. Nothing else to do here.

## B. Real fal costs, one cost table, charge table from the rule
Run 42 reported every fal cost as unknown, so no margin could be computed. Fix that now.
1. For every model in the registry, read the EXACT fal endpoint id and the exact request parameters Forge sends (resolution, fast vs standard, audio on/off, duration billing rule). Write them into one data file, `packages/core/src/pricing/falCosts.ts` (or the existing registry file): `{ modelKey, endpointId, params, usdPerSecond (or usdPerVideo), source, verifiedOn }`. This file is the ONLY place fal costs live.
2. Find each price from fal's own model page or fal's pricing API for that exact endpoint. Do not guess. Indicative figures from third-party summaries (Aug–Sep 2026, NOT verified against Forge's endpoints; use only to sanity-check what you find):
   - Veo 3.1 on fal: standard 720p/1080p $0.20/s no audio, $0.40/s with audio; fast $0.10/s no audio, $0.15/s with audio.
   - Kling 3.0: standard 720p $0.084/s no audio, about $0.126/s with audio; pro 1080p about $0.11/s no audio, about $0.17/s with audio.
   - Seedance 2.0: fast 720p about $0.24/s; standard 720p about $0.30/s; 1080p about $0.68/s (audio included).
   - LTX-2.3 fast (fal page): 1080p $0.06/s, 1440p $0.12/s, 2160p $0.24/s. No 480p price is listed, but the Draft tier in the UI says 480p: find out what resolution Forge actually requests and what fal actually bills.
   - Wan 2.7, Runway Gen-4, Grok Imagine Video, Gemini omni: no verified fal price found. Find them, or report that fal does not offer them at that endpoint.
3. Add a check (CI and `check-chokepoints.mjs`): a model with no recorded `usdPerSecond` / `usdPerVideo` is NOT sellable to non-internal accounts. It must not appear in Simple/Advanced/Ultimate pickers or be chargeable. Internal accounts may still use it, and the UI says "price not set". This replaces "unknown" with a fail-closed rule.
4. Charge rule, implemented in `quoteGenerationHold` (single source): `credits = ceil( falUsdCost(model, billedSeconds, params) x 1.5 / CREDIT_FLOOR_USD )`, where `CREDIT_FLOOR_USD` is computed from `planPrices.ts` and the credits each plan grants, taking the LOWEST USD-per-credit across plans. Today that is Ultimate: $99 / 6000 = $0.0165 per credit (Pro is $0.038, Studio $0.0245). Billing keeps using billed seconds (LTX bills 6 s and 16 s), keeps `openHold` reserving ceil(quote x 1.2), and keeps settle and refund exactly as tested in Run 42. If a plan price or grant changes, the table recomputes and a test fails loudly if any model ends up below the rule on any plan.
5. Indicative result of the rule at the floor value, 5 s, for sanity checking your output only (current charge in brackets): Veo 3.1 fast with audio about 69 credits (23); Veo 3.1 standard with audio about 182 (23); Kling 3.0 standard 720p no audio about 39 (17), with audio about 58; Seedance 2.0 fast about 110 (20); LTX-2.3 fast at 1080p, billed 6 s, about 33 (3). If your verified costs differ from these, trust yours and say why.
6. Produce `docs/PRICING-TABLE.md` from the data file (generated, never hand-edited): per model and duration (5, 10, 15 s): fal USD cost, credits charged, USD revenue per credit on each plan, gross margin % on each plan, and a flag if any plan is below the rule. Use USD throughout and also show an AUD column at a stated rate and date (Neo wants AUD figures).
7. Every price shown in any UI (Simple, Advanced, Ultimate, desktop, upgrade modal) must come from `quoteGenerationHold` and the plan config. Re-run the price-agreement test across tiers, durations and aspect ratios.
8. Show users plain wording where numbers changed: no marketing claim about "cheap" unless it is true.

## C. Free trial and plan credit sanity
1. List what 50 free credits now buy at the new table (clips per model) and what 500 / 2000 / 6000 credits buy per plan. Put it in `docs/PRICING-TABLE.md`. If the free trial can cost Forge more than a stated cap per signup at fal cost, say so in the report with the number. Do not change the trial size.

## D. Live billing proof, ready to run
Update `scripts/grant-test-credits.mjs`, `scripts/verify-billing-run.mjs` and `docs/LIVE-BILLING-TEST.md` so the proof checks the NEW exact numbers (quote, 20% reserve, settle, refund on failure and cancel). Do not run it. Tell Neo the exact commands and the cheapest clip to use.

## E. Lint
Run 42 left 6 ESLint errors and 25 warnings on the touched files. Fix every error. Fix warnings in files you touch. Run the full `npm run lint` and report the real result.

## F. Verify, deploy, report
Run tsc, lint, Jest, check-chokepoints and the FULL Playwright suite. Deploy. Verify live: download routes still 503; the existing timeline clip plays; prices on Simple, Advanced and Ultimate agree with the quote; a model with no cost row is not offered. FINAL REPORT in one message: A–F as DONE / PARTIAL / NOT DONE with commit sha and one line of evidence; the full `docs/PRICING-TABLE.md` content; every model whose fal price you could not verify and what you did with it; the commands Neo must run.

# PART 2 — DESKTOP WINDOW (cinematic-forge-v3)

Run 42 reported the desktop account gate is NOT in a commit and the checkout is dirty. Do not discard anything.
1. `git status` and `git stash list`; list every modified and untracked file in the report. Create branch `desktop-run-43` and commit the dirty work in logical commits after reading each diff. If a change looks wrong or unfinished, commit it separately and say so.
2. Finish the account gate: the generate panel waits for the balance, skips the client check for ungated accounts, and the relay UI shows the server's refusal text. Prices come from the shared quote package so they equal the web (INV-8).
3. Finish the open desktop items from the audit if they are not done: arm64-only helper binaries (replace or remove x86_64-only `@contentauth/c2pa-node` index.node, `ffmpeg-static/ffmpeg` and both `ffprobe`), G1–G8, I2–I11, the three `router.test.ts` failures. `scripts/check-mach-o-arch.mjs` must pass. Build 3.0.6 against the final host `https://cinema.ai-forge.co` only after Run 40 is merged; otherwise build against the current host and say so. Do NOT publish, upload to R2, or touch the download gate. 3.0.4 and 3.0.5 arm64 stay withdrawn.
4. Report: commits, test results, which of G1–G8 and I2–I11 are done, and the exact result of `check-mach-o-arch.mjs`.
