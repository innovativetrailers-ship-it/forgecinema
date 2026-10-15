# CURSOR PASTE — RUN 44 — get 2dc1311 live, close the last pricing hole, make the desktop gates real (2026-10-14)

PART 1 goes in the WEB window, PART 2 in the DESKTOP window. Each runs straight through without stopping, asking, or re-raising decisions. Obey the forge-engineering invariants (INV-1, INV-4, INV-5, INV-7, INV-8, user data never deleted, pause guard: leave GENERATION_PAUSED as it is). Decided and not to be reopened: price = fal cost x 1.5, floor = Ultimate $99/6000 credits, pickers only show priced models, runway-gen4 stays out, the download gate stays closed, 3.0.4 and 3.0.5 arm64 stay withdrawn, the host stays https://forgecinema.vercel.app until Neo says otherwise (Run 40 not switched).

Verified live by Neo's side on bd90e8c: /simple shows Quick Draft 33, Standard 138, Cinematic 51, Film Grade 110. The existing Ultimate timeline clip now loads through `/api/media/<id>/stream`, decodes (1920 px) and plays (timecode and video currentTime advance). Do not touch that.

# PART 1 — WEB WINDOW

## A. Get 2dc1311 live (production is still bd90e8c)
Two deploys died at `npx prisma migrate deploy` with Prisma P1002 (advisory lock timeout) although no migration was added.
1. Find the cause before retrying. Check: (a) whether two deployments were building at once (two `migrate deploy` calls fight over the advisory lock), (b) whether `DATABASE_URL` used in the build is the pooled Neon host (`-pooler`), which breaks Prisma advisory locks; migrations must use the direct (non-pooled) URL via `directUrl` / `DIRECT_URL`, (c) a stuck session holding the lock (`select pid, state, query_start, left(query,80) from pg_stat_activity where datname=current_database()` and `pg_locks` for advisory locks; terminate only idle sessions that clearly belong to a dead migrate, and say what you terminated).
2. Move migrations OUT of the Vercel build. The build runs `prisma generate` only. Migrations run as a separate, single-flight, guarded step (`scripts/migrate-prod.mjs`: takes the direct URL, refuses to run if another migrate holds the lock, prints applied and pending migrations, additive only per INV-7, never `migrate reset`, never `db push`). Document it in `docs/DEPLOY-CHECKLIST.md` and take a Neon snapshot step before any run that has pending migrations (the snapshot procedure from Run 38/39).
3. Deploy 2dc1311 (or the current main) once, wait until Ready, then verify live: the download routes still 503, `/simple` prices still 33/138/51/110, `GET /api/desktop/generate/own-key` for a signed-in session returns `creditBalance` and `ungated` (test with a script or a Playwright login using the saved state; report the real response shape without printing tokens).

## B. `/api/studio/production/direct` still charges `ceil(duration/5)`
This is the last charge path that does not use the quote (INV-1).
1. Move it onto `quoteGenerationHold` with the model, billed seconds and params it really sends. Use the same hold, settle and refund path as `jobs/create`.
2. Hailuo 02 has no duration field, so every request is billed as 6 s ($0.48, 44 credits). Show that in the picker and in the quote ("fixed 6 s"). Any model whose real billed length differs from the asked length must say so before the click.
3. Search the whole repo (web, workers, desktop relay) for every other place that calls fal or any paid provider and shows or charges a number: list each with file and line and confirm it goes through the quote or the chokepoint. Add any missing one to `scripts/check-chokepoints.mjs`. Report the full list.
4. Add a test that for every priced model, tier and duration, the number charged by `jobs/create`, the relay, and `production/direct` equals the quote.

## C. Result card shows the model and the credits spent
Live: after "Add to library" the Simple result card reads "LIBRARY · Library ⬡0". The model name and the credits spent are gone, so the card looks free. Run 42 said this was fixed. Check the live behaviour for both a fresh clip and a library-added clip and fix it: model name and credits spent always stay visible; "Library" is an extra label only. Add a Playwright assertion on the card text.

## D. Default quality tier and low-balance UX
Standard is now Seedance 138 credits and the 50-credit free trial cannot afford it, so a new user lands on a disabled Generate button.
1. The default tier is the dearest tier the account can afford; if only Quick Draft fits, select it. Internal accounts keep Standard.
2. Under the button show "You have N credits. This costs M." and, when short, one honest line with the cheapest option that fits. Same logic in Advanced, Ultimate and the desktop panel.
3. Replace any fixed "clips per plan" copy with numbers generated from `docs/PRICING-TABLE.md` / the cost file (clips per model for 50, 500, 2000, 6000 credits). Landing, upgrade modal and pricing page.

## E. Lint
Full `npm run lint` reports 588 problems. Do not try to fix them all. Create a lint baseline (the existing counts per file) so the build and CI fail on any NEW error or any increase, and fix the errors and unused-variable warnings in every file this run touches. Report the baseline numbers.

## F. Verify and report
Run tsc, Jest, check-chokepoints and the FULL Playwright suite (not only the touched specs) and report real numbers. Deploy through the new migrate step. Verify live as in A3 and re-check: an existing timeline clip plays; Simple shows the new default tier for a 50-credit account (use the test account from `grant-test-credits.mjs` locally, not production data). FINAL REPORT in one message: A–E as DONE / PARTIAL / NOT DONE with commit sha and one line of evidence; the full list of charge paths from B3; anything blocked and why.

# PART 2 — DESKTOP WINDOW (cinematic-forge-v3, branch desktop-run-43)

## G. Back up and tidy
1. Push `desktop-run-43` to the remote now (it exists only on this machine) and open a pull request into main. Do not merge it.
2. In `/Users/imac/cinema/cinema` there is an uncommitted copy of the pricing module. Compare it with the committed `2dc1311` version. If identical, remove the stray copy and use the pinned core dependency; if different, commit the difference on the right branch and say so. Do not discard any change without showing the diff in the report. Leave `index.js` at the desktop repo root alone unless you can prove what it is.

## H. The Mach-O gate must not pass vacuously
`check-mach-o-arch.mjs` printed "arm64 ok" and exited 0 when the app was not on disk (zero files inspected). That is a false pass.
1. The gate must exit non-zero when the path does not exist, when it inspects zero Mach-O files, or when any inspected binary lacks the required architecture. Print the count of files inspected and the list of non-arm64 binaries. Add unit tests for all three failure cases.
2. Wire it into the release job so a missing bundle fails the job.

## I. Build 3.0.6 for real (no publishing)
1. Build the arm64 app locally from `desktop-run-43` (per-arch ffmpeg, ffprobe, C2PA already installed). Run `check-mach-o-arch.mjs` on the real `.app` and paste the real count and result. If anything is x86_64-only, fix it and rebuild.
2. Sign the build. Notarise only if the Apple notarisation credentials are already available on this machine (keychain profile or the existing env); if they are not, stop at a signed, un-notarised local build and say exactly what is missing. Do not create accounts, do not ask Neo for passwords in chat.
3. Do NOT upload to R2, do NOT change the release manifest, do NOT touch the download gate. Leave the built app at a known path and print it.

## J. Electron and release pipeline
1. G1: move Electron off `^34.0.0` to the latest stable supported major (read the Electron releases page for the supported list), fix breakages, run the desktop tests and a smoke launch of the packaged app, and report the version you chose and the breaking changes you handled.
2. G3: prove, with a dry run against a throwaway bucket path or a mocked store, that the release job uploads the manifest and the notarisation marker and binds them to the artifact SHA-256. If you cannot prove it, say what is missing.
3. G4: delete the stale web desktop-release workflow (a code file in the repo, recoverable from git history).
4. G5 finish: Windows job runs tsc, vitest and audit:security before packaging; remove the committed core `dist` and build core in CI from the pinned commit.
5. G6/G7: close the IPC allow-list and CSP checks one by one with a test per item, and re-prove signature-before-store for the license and keystore files with a test that tampers with a signature and expects refusal.
6. G8: move character, clip and shot types into `@cinema/core` so web and desktop share them (INV-8), or list exactly which types remain local and why.

## K. Report
One message: commits and branch URL, vitest result, the real Mach-O gate output, which of G1–G9 and I2–I11 are DONE / PARTIAL / NOT DONE with evidence, the path of the built 3.0.6 app and its signing state, and what is blocked. I2–I11 need a click-test on the packaged app: say which ones you could not click and leave them for Neo's computer-use pass.
