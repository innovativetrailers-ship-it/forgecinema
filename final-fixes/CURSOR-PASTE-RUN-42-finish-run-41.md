# CURSOR PASTE — RUN 42 — finish what Run 41 left (2026-10-13)

Paste everything into ONE Cursor window. Work straight through A → G without stopping, asking, or re-raising decisions. Branch from the commit that is live now (c992b8c, Vercel deployment forgecinema-k4rundikv) as `run-42-finish`. Obey the forge-engineering invariants (INV-1, INV-4, INV-5, INV-7, INV-8, user data never deleted, pause guard: leave GENERATION_PAUSED as it is). Already done and verified live, do not touch: download gate (503 downloads_closed), the quote function wiring, AUD labels, appUrl helper, copy rewrites, falSignature message.

## A. TIMELINE: real drag, position, selection, playback (Run 41 item C, not done)
1. Playwright test with a REAL pointer drag (mouse down, several intermediate moves, mouse up; not synthetic events) from Library → Media to a video track on /ultimate and /advanced. Assert: the clip appears at once at the drop position, only one clip is created, the track state holds the clip (timeline duration label changes from 0.0s).
2. Fix the position jump: a clip dropped at about 2 s moved to 0 s after cycling the timeline size Full → Compact → Hidden → Full. A clip stays where dropped unless a visible ripple or magnet toggle is on. Test it.
3. Fix click-to-select: clicking a timeline clip selects it, loads it in the Program monitor, and opens its properties. Today it stays "Select a clip".
4. Playback spec: put a library clip on a track, move the playhead onto it, press play, assert the timecode advances and a frame is drawn (a `<video>`/canvas exists and currentTime moves). Until R2 CORS is applied this spec must run against a same-origin media route: add a same-origin streaming route `/api/media/[id]/stream` (auth-checked, Range-aware, proxies the R2 object) and make the player use it when the R2 origin does not send CORS headers. Keep the redirect route for downloads. This makes playback work now, independent of the bucket policy. Measure the added Vercel bandwidth cost in the report; if large, say so.
5. "Add to library" on a clip already in the library must be a no-op with a toast, never a second row. Run 41 fixed the stored-file case; also cover the Simple result card path.

## B. R2 CORS (Run 41 item B, blocked by AccessDenied)
1. Keep `infra/r2-cors.json` and `scripts/apply-r2-cors.mjs`. Make the script print the exact failure and then print this ready-to-paste Cloudflare dashboard rule (R2 → bucket → Settings → CORS policy) so Neo can apply it by hand without a token change:
[{"AllowedOrigins":["https://forgecinema.vercel.app","https://cinema.ai-forge.co","http://localhost:3000"],"AllowedMethods":["GET","HEAD"],"AllowedHeaders":["*"],"ExposeHeaders":["Content-Length","Content-Range","Accept-Ranges","ETag"],"MaxAgeSeconds":3600}]
2. Add `scripts/verify-r2-cors.mjs`: sends a signed GET with `Origin: https://forgecinema.vercel.app` to a real media object and reports whether `Access-Control-Allow-Origin` is returned. Neo runs it after applying the rule.

## C. PRICES AND CHARGES (Run 41 item D, partial)
Charge changes on POST /api/jobs/create for a 5 s request were: LTX 1 → 3, Seedance 12 → 20, Kling 25 → 17, Veo 35 → 23 credits. Neo has to accept this table once, so give him everything in one report:
1. A margin table, one row per model and duration (5, 10, 15 s): credits charged, the credit price in AUD at each plan (A$19, A$49, A$99 and the credits each plan grants), the fal cost per generation in AUD (read the fal price from the registry or the PAID-CALL-INVENTORY; if a cost is not in the repo say "unknown" and do not guess), and gross margin %. PRICING RULE FROM NEO: Forge prices every generation at fal cost + 50% markup (price = fal cost x 1.5, which is a 33.3% gross margin). Add two columns: the credits needed to meet that rule (round up) and the difference from the credits charged now. Flag every row where the credits charged are BELOW the rule (we lose money against the target), every row more than 25% above it (we overcharge), and every row with unknown cost. Use the rule only to report and to propose a corrected charge table in the same report. Do not change any charge until Neo approves the table. Use a USD→AUD rate that you state with its date.
2. openHold reserves ceil(quote × 1.2). Prove with a test that settle charges the real quote and releases the extra 20% (no leaked credits, no double charge), including a failed job (full refund) and a cancelled job.
3. Stripe: read back, READ-ONLY, the live prices for Pro, Studio and Ultimate (currency, amount, interval, price ids) using the existing Stripe key. Do not create or change products. Report whether they are AUD and A$19 / A$49 / A$99. If they are not, say exactly what the site claims versus what Stripe charges, and stop that item there. Do not leave the site claiming AUD if Stripe charges USD: in that case revert the labels to the real currency until Neo decides.
4. Replace the redundant "A$19 AUD" with one currency marker ("A$19/mo" or "AUD $19/mo") everywhere, from `planPrices.ts`.
5. Switch the signup steps and the desktop price display to `planPrices.ts` and `quoteGenerationHold` (Run 41 skipped them). Desktop prices from the same shared package so INV-8 holds.
6. Audio-to-Video and Drop & Direct: confirm each shows a real quote or an honest disabled state (Run 41 did not report these). Test it.

## D. ULTIMATE TAB STRIP AND PANELS (Run 41 item F4, not done)
1. The tab strip overflows below about 1000 px (CGI, Motion & Camera, Review are cut off). Make it scrollable with edge fades and keyboard access, or wrap.
2. Tabs after Locations (Locations, Colour Grade, VFX Mix, Green Screen, SFX Makeup, and any others) changed the workspace layout but left the left panel on Continuity. Each tab must show its own left panel, or the tab must say it is a layout preset. Check every tab in the strip and list what each one shows in the report.
3. Test at 800, 1024 and 1440 px.

## E. STOCK PANEL (Run 41 item F3, not done)
Show only providers that are configured. Today only PEXELS_API_KEY is read. Remove Pixabay, Unsplash and Freesound from the panel unless their keys exist, with one line "More sources need keys". Report the exact Vercel variable names Neo adds to enable the other three, as read from the code (or add the provider code only if trivial and keyed off those variables).

## F. LOADING STATE TEST AND DESKTOP (Run 41 item E)
1. Add the Playwright test: delay `/api/credits/balance` by 2 s, assert no "Insufficient credits" text and a disabled Generate during the wait, then the normal state.
2. Apply the same wait-for-balance and ungated-skip logic in the desktop generate panel (INV-8), and in the desktop relay UI.

## G. TEST COVERAGE, RUN, DEPLOY, REPORT
1. Playwright click-through spec for Simple, Advanced and Ultimate: every tab and rail panel opens, no console errors, no unhandled rejections. Fix the known browser-project failures (Mobile Safari binary, logged-out specs, invalid Simple Mode selectors).
2. Update `scripts/grant-test-credits.mjs`, `scripts/verify-billing-run.mjs` and `docs/LIVE-BILLING-TEST.md` for the new quote and the 20% reserve, so the live billing proof (a plain non-internal account, 50 credits) checks exact numbers. Do not run the live proof.
3. Run tsc, lint, unit tests, check-chokepoints and the FULL Playwright suite. Report real results, not "not run". The Vercel build must pass: do not import the database client into code the client bundle uses (the earlier 8780cf6 build failure).
4. Deploy, then verify live: download routes still 503; a library clip plays on /ultimate; the timeline drop works; the tab strip scrolls.
5. FINAL REPORT in one message: for A–G, DONE / PARTIAL / NOT DONE with commit sha and one line of evidence; the margin table; the Stripe read-back result; the exact commands and variables Neo must run or set. No item deferred without a reason.
