# CURSOR PASTE — RUN 41 — fixes from the live click-through (2026-10-13)

Paste everything below into ONE Cursor window. Work straight through A → H. Do not stop between items, do not ask questions, do not re-raise decisions already made. If something is blocked, record it in the final report and keep going with the rest. Branch from main (`b5f840c` or the current deployed commit) as `run-41-click-through`. Read the forge-engineering skill first and obey the invariants (INV-1 billing chokepoint, INV-4 honest UI, INV-5 no silent substitution or swallowed catches, INV-7 additive migrations only, INV-8 web/desktop parity, user data never deleted, pause guard).

Evidence came from a live session in Neo's internal account on https://forgecinema.vercel.app. One Quick Draft generation (LTX-2.3-fast, 5 s) completed correctly through jobs/create → worker → fal webhook → result. Everything below is a defect found afterwards.

## A. CLOSE THE DOWNLOAD GATE (do this first, deploy first)
Finding: `GET /api/desktop/download?platform=mac_arm` and `platform=mac_intel` redirect to signed R2 URLs for `releases/mac-arm/CinematicForge-3.0.5-arm64.dmg` and `releases/mac-intel/CinematicForge-3.0.5-x64.dmg`. `/download` shows a live "Download for Mac — Apple Silicon" button for 3.0.5. The 3.0.4 and 3.0.5 arm64 builds are withdrawn (x86_64-only helper binaries, no Rosetta on macOS 28). The gate is meant to be closed.
1. Find the gate mechanism (route `src/app/api/desktop/download`, any release manifest, env flag, or DB row). Make the route FAIL CLOSED: unset, missing or unknown flag means no signed URL is issued. Return a clear 503 JSON `{ "error": "downloads_closed" }` and never a redirect.
2. Only open for a platform when an explicit release entry marks that exact platform `released: true`. Mark both mac_arm and mac_intel 3.0.5 as NOT released. Windows stays as it is unless it also points at a withdrawn build (check, and report).
3. `/download` page: while closed, replace the buttons with an honest "Desktop download opens soon" state (INV-4). No version number, no "Download for Mac" text. Keep the feature copy.
4. Check the other places that can hand out the file: any marketing page, `/api/download/*`, the signed-URL helper, and the R2 bucket's public access. Report any other path that serves a .dmg or .exe.
5. Add a test that the route returns 503 with no Location header when the flag is unset, and that mac_arm 3.0.5 never redirects. Add the check to `scripts/check-chokepoints.mjs` or a sibling script.
6. Do NOT delete the files in R2 (user data and release history rule). Leave them, just unreachable.

## B. R2 MEDIA CORS (timeline preview/playback is broken)
Finding: the browser console shows `Access to video at https://forge.<id>.r2.cloudflarestorage.com/media/<hash>.mp4?... (redirected from /api/media/lib_...) has been blocked by CORS policy`. The Ultimate timeline clip never plays: Program monitor stays "Select a clip", timecode stays 00:00:00, no `<video>` is created.
1. Inspect how the player loads media (crossOrigin attribute, fetch, canvas or WebGL texture upload, WebCodecs). Decide the fix that matches the code:
   - Preferred: set a CORS policy on the R2 bucket for `GET` and `HEAD`, allowed origins `https://forgecinema.vercel.app`, `https://cinema.ai-forge.co`, `http://localhost:3000`, allowed headers `Range`, `Content-Type`, `If-Match`, `If-None-Match`, expose headers `Content-Length`, `Content-Range`, `Accept-Ranges`, `ETag`, max age 3600. Apply it with the existing R2 credentials (S3 PutBucketCors, or wrangler). Commit the policy JSON to `infra/r2-cors.json` and add a script `scripts/apply-r2-cors.mjs` that applies it and reads it back.
   - Also make sure `/api/media/[id]` redirects keep working with Range requests and that the signed URL lifetime is long enough for a long edit session (or the player refreshes it on 403).
2. Fix any player bug that remains once CORS is fixed. The play button changes to pause but the playhead does not advance: find out why (no source loaded, silently swallowed error). INV-5: surface a visible error in the Program monitor ("Could not load media") instead of a silent blank when a load fails.
3. Verify with a real browser session (Playwright is installed): open /ultimate, drop a media-library clip on a video track, move the playhead onto it, press play, assert the playhead advances and a frame renders. Add this as an e2e spec.
4. Desktop is not affected by browser CORS but confirm it still plays its local files.

## C. TIMELINE DRAG AND DROP
Findings: the Library → Media rows are `draggable` and set `application/x-cinema-media`. A scripted drop onto a track lane creates the clip, but it rendered only after a delay and later jumped from about 2 s to 0 s after toggling the timeline size (Full → Compact → Hidden → Full). A real mouse drag in the pane did nothing visible (may be a test-tool limit).
1. Write a Playwright test that performs a REAL drag (`page.dragAndDrop` or mouse down/move/up with several intermediate moves) from the Media list to a video track and asserts the clip appears immediately at the drop position. Fix whatever fails.
2. Find why the clip position changed after the size toggle. A clip must stay where the user dropped it unless a ripple or magnet setting is on, and that setting must be visible.
3. Dropping the same take twice must not create a hidden duplicate; and "Add to library" must not create a second library row for a clip that is already in the library. The library currently shows the candle clip twice.
4. Clip selection: clicking a clip should select it, show it in the Program monitor and open its properties. Today clicking leaves "Select a clip".

## D. ONE PRICE LIST (INV-1, INV-4)
Findings: Simple shows Quick Draft 2 / Standard 20 / Cinematic 17 / Film Grade 23 credits. Advanced and Ultimate Generate panels show Standard = 8 credits. In Simple, Cinematic (17) is cheaper than Standard (20). The landing page and /download say "21 models".
1. There is exactly one quote function (registry-driven, the same one the server charges with). Every UI price, estimate, button label and ledger hold must come from it. Remove every hard-coded number in Simple, Advanced, Ultimate and the desktop.
2. The displayed price must equal what `openHold` is asked to hold for that exact request (tier, duration, aspect ratio, model). Add a test that renders each mode's button price and compares it to the server quote for the same inputs, for every tier and duration.
3. Fix tier ordering so a higher tier never costs less than a lower one at the same duration, or explain in the UI why (for example a model with different pricing) and make that data-driven.
4. The Audio-to-Video tab ("Generate Beat-Synced Video") and the Drop & Direct tab show NO credit cost. Show the real quote before the click. If a mode cannot quote yet, disable it with an honest reason.
5. Replace "21 models" everywhere with a number computed from the registry (or remove it). Same check for any other count in copy.
6. Prices shown to Neo must be AUD. Landing page pricing shows $19 / $49 / $99 in USD. Show AUD, labelled "AUD", from a single price config shared with Stripe; confirm what the Stripe products actually charge and report any mismatch. Do not change what customers are charged without reporting it.

## E. FALSE "INSUFFICIENT CREDITS — NEED 20, HAVE 0"
Finding: on first load of /simple the red message "Insufficient credits — need 20, have 0" appeared before the balance request finished. Moments later the account (isInternal) showed 9999999 and the message was gone.
1. Do not run the credit check until the balance has loaded. While loading, show a neutral state and keep Generate disabled.
2. Internal (ungated) accounts must skip the client check entirely; the server stays the authority.
3. The same applies to the Advanced and Ultimate panels and the desktop.
4. Add a test: slow `/api/credits/balance` by 2 s, assert no insufficient message is rendered during the wait.

## F. HONESTY AND SMALL DEFECTS
1. Duration: a 5 s Quick Draft produced a 6 s file. Check the model's real output length against what was requested and what the quote assumes. If the model cannot do exactly 5 s, the UI must say so, and the charge must match the real output length. Trim to the requested length in the export path if that is the documented behaviour.
2. Result card badge changed from "LTX-2.3-FAST ⬡2" to "LIBRARY ⬡0" after the clip was added to the library. Keep the model and the credits spent visible on every card; a library tag is an extra label, not a replacement.
3. Stock panel says "Pixabay, Unsplash, and Freesound have no key configured, so they are not searched." That is honest, but do not show sources that cannot work. List only configured providers, and say in one line which are off. Report which provider keys Neo needs to add, with the Vercel variable names. Do not invent keys.
4. Ultimate top tab strip overflows at about 800 px wide: CGI, Motion & Camera and Review are cut off, and tabs after Locations did not change the left panel (it kept showing Continuity for Locations, Colour Grade, VFX Mix, Green Screen and SFX Makeup). Make the strip scroll or wrap, and make each tab show its own panel, or clearly label tabs that only change the workspace layout. Test at 800 px, 1024 px and 1440 px wide.
5. The VFX node graph says desktop-only nodes stay disabled; keep that text and keep those nodes visibly disabled.
6. Footer and any copy still showing `cinematicforge.ai` or `cinema.growthengine.ai`: replace with the single app-URL helper from Run 40 (`src/lib/appUrl.ts`, default `https://cinema.ai-forge.co`). If Run 40 is not merged yet, create the helper now and use it.
7. Marketing claims that need an honesty pass (INV-4): "Knowledge Firewall … no hallucinations", "Replace 6 subscriptions". List each unprovable claim you find in the landing page and Download page, and rewrite it to something the product actually does today. Report what you changed so Neo can approve wording.
8. Fix the stale message "NEXTAUTH_SECRET is not set" in `src/lib/webhooks/falSignature.ts` so it names the variable it really reads.

## G. NOT COVERED YET — ADD COVERAGE
1. A Playwright spec for the Simple, Advanced and Ultimate click-through: every tab opens, every button in each rail panel responds, no console errors, no uncaught promise rejections. Use the saved internal login only in a local, git-ignored storage state.
2. Fix the known browser-project failures: Mobile Safari binary, logged-out specs using the saved login, invalid Simple Mode selectors.
3. Credit hold, settle and refund still has NO live proof. Do not run it. Prepare it only: confirm `scripts/grant-test-credits.mjs`, `scripts/verify-billing-run.mjs` and `docs/LIVE-BILLING-TEST.md` are current for the new price list from item D, and say what Neo must run.

## H. DEPLOY, VERIFY, REPORT
1. Run typecheck, lint, unit tests, `scripts/check-chokepoints.mjs` and the Playwright suite. Fix failures that belong to this run.
2. Deploy A first as its own commit (merge and deploy before the rest). Then deploy B–G. Use additive migrations only (INV-7) and take no destructive action on user data.
3. After deploy, verify on the live site with curl and a browser: `/api/desktop/download?platform=mac_arm` and `mac_intel` return 503 and no Location header; the R2 media URL returns `Access-Control-Allow-Origin` for the web origin; a timeline clip plays.
4. Update `docs/PAID-CALL-INVENTORY.md`, `docs/DEPLOY-CHECKLIST.md` and the spec docs for anything you changed. Keep specs and code identical (no drift).
5. FINAL REPORT, one message, in this exact shape: for each of A–G, DONE / PARTIAL / NOT DONE with commit sha and one line of evidence. List anything you could not do and why, the exact env vars or keys Neo must add, and the exact commands Neo must run, if any. Nothing deferred without a reason.
