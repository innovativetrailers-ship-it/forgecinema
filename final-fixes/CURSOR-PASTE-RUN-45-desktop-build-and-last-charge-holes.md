# CURSOR PASTE — RUN 45 — build the desktop app for real; close the last charge holes (2026-10-14)

PART 1 goes in the DESKTOP window and is the priority. PART 2 goes in the WEB window. Each runs straight through. DO NOT STOP between items, do not ask questions, do not re-raise decisions. If a step is blocked, record why in the report and carry on with every item that does not depend on it. Obey the forge-engineering invariants. Decided and not to be reopened: price = fal cost x 1.5 at the Ultimate floor, download gate stays closed, 3.0.4 and 3.0.5 arm64 stay withdrawn, host stays https://forgecinema.vercel.app, GENERATION_PAUSED untouched.

Web Run 44 is done and live (7e09716, deployment forgecinema-e61kqdmk5). Desktop Run 44 did H only (Mach-O gate, 03afc03, PR #1 open, not merged). Items I and J were not done and no 3.0.6 app exists. This run exists to produce that app.

# PART 1 — DESKTOP WINDOW (cinematic-forge-v3, branch desktop-run-43, PR #1)

Work in THIS ORDER so the app is built once, not twice:

## 1. Electron first
G1: move Electron off ^34.0.0 to the latest stable supported major (read the Electron releases/timelines page for the supported list). Fix breakages, run `vitest`, `tsc`, `audit:security`, and a smoke launch (`electron .` starts, main window opens, IPC round-trips). List the breaking changes you handled and the version you chose. If the newest major breaks something large, take the newest major that is still inside Electron's supported window and say why.

## 2. Make the core dependency reproducible
The desktop app imports `@cinema/core` from `file:../cinema/packages/core`, and the billing checkout has UNCOMMITTED changes the desktop needs (the re-export in `packages/core/src/index.ts`, the pricing allow in `scripts/check-endpoints.mjs`, a rebuilt `dist`). CI clones core at 2dc1311 and will not have them.
1. Do not commit in the billing checkout from here. In the report, give Neo the exact paths and a one-paragraph description so the WEB window (Part 2) commits them.
2. Until Part 2 lands, make the desktop build deterministic: build core from the pinned commit into a temp dir and point the desktop at it, or document the exact commit once Part 2 gives a sha. No build may depend on an uncommitted file.

## 3. Build 3.0.6 arm64 (no publishing)
1. Build the arm64 `.app` (and the DMG) from `desktop-run-43`. Per-arch ffmpeg, ffprobe and C2PA are already installed by the release scripts.
2. Run `node scripts/check-mach-o-arch.mjs "<real .app path>" arm64` and paste the REAL output: files inspected (must be > 0), every binary and its architecture, exit code. If any binary is x86_64-only (known suspects: `@contentauth/c2pa-node` index.node, `ffmpeg-static/ffmpeg`, both `ffprobe`), replace it with a native arm64 build, rebuild, and re-run until it passes with a non-zero inspected count.
3. Signing and notarisation: Neo is enrolled in the Apple Developer Program. Check the login keychain for a "Developer ID Application" identity and check whether a `notarytool` keychain profile exists (`xcrun notarytool history --keychain-profile <name>`). If both exist: sign with hardened runtime and the entitlements the app needs, notarise, staple, and verify with `codesign --verify --deep --strict`, `spctl -a -vvv -t exec`, and `xcrun stapler validate`. If either is missing: stop at a signed-with-what-exists or unsigned local build, and print the exact steps Neo must do himself (create the Developer ID Application certificate in his Apple account, run `xcrun notarytool store-credentials` himself). Never ask for or handle an Apple ID password, app-specific password or API key in chat, never create accounts.
4. Leave the built app at a known absolute path and print it. DO NOT upload to R2, DO NOT change the release manifest, DO NOT touch the download gate.

## 4. Smoke-run the packaged app
Launch the built `.app` from the command line. Confirm it starts, shows the main window, loads the editor, reaches the generate panel, and the account gate behaves: balance wait, ungated skip, server refusal text, price from the shared quote. Capture the first 100 lines of its log. Note anything that only fails when packaged (missing binaries, path issues, ASAR unpacking, entitlement problems).

## 5. Release pipeline items
1. G3: prove the release job uploads the manifest and the notarisation marker bound to the artifact SHA-256. Do it with a dry run against a throwaway key prefix or a mocked store; paste what it would write. If you cannot prove it, state exactly what is missing.
2. G5: the Windows job runs tsc, vitest and audit:security before packaging; remove the committed core `dist` and build core in CI from the pinned commit. NOTE `.github/workflows` is gitignored in this repo, so a gate that lives there is not versioned: move the release workflow to a tracked location (`ci/` or un-ignore `.github/workflows`) and commit it. Tell Neo which.
3. G6: close the IPC allow-list and CSP checks one by one, one test per item.
4. G7: prove signature-before-store for the license and keystore files with a test that tampers with a signature and expects refusal.
5. G8: move character, clip and shot types into `@cinema/core` so web and desktop share them (INV-8), or list exactly which stay local and why. Small and safe moves only; do not refactor the editor.

## 6. Click-test readiness for I2–I11
Neo's computer-use pass will click the packaged app. Write `docs/DESKTOP-CLICK-TEST.md`: for each of I2–I11 give the exact menu path or screen, the action, and the expected result, in a table, plus the app path. Do not claim any item is verified until it has been clicked.

## 7. Report (one message)
Branch and PR URL, commits, Electron version chosen, vitest/tsc/audit results, the real Mach-O gate output, signing state (what was done, what is missing), the app and DMG paths, smoke-run result, and DONE / PARTIAL / NOT DONE for G1–G9 and I2–I11 with one line of evidence each. Push everything before reporting.

# PART 2 — WEB WINDOW (forgecinema, main)

## A. Commit what the desktop depends on
The billing checkout `/Users/imac/cinema/cinema` has uncommitted changes: the re-export in `packages/core/src/index.ts`, the pricing allow in `scripts/check-endpoints.mjs`, and a rebuilt `dist`. Commit the two source changes (not `dist`) on main with tests, deploy, and report the commit sha so the desktop can pin it. Leave `dist` ignored unless the repo tracks it.

## B. Unpriced models must never be free
Run 44 reported: `src/lib/swarm/SwarmRouter.ts` records 0 credits and only logs a warning when a model id has no fal price. For a non-internal account that is a free generation.
1. Fail closed: an unpriced model for a non-internal account throws `CreditError`/returns 400 "price not set" in every path, including swarm and legacy ids. Internal accounts may run it at 0 and the UI says "price not set".
2. Add the swarm path to `scripts/check-chokepoints.mjs` and a test: unpriced id + non-internal account = refused.

## C. Price every other paid operation with the same rule
Non-generate jobs still use flat `OPERATION_COSTS` (for example transcribe at 8 credits, lip sync, upscale, music, speech, image generation, stock, avatar, translation). Each of those calls fal or another provider and costs real money.
1. List every paid operation in `docs/PAID-CALL-INVENTORY.md` with its endpoint, params, billed unit, and the provider's real price (fal's own model page or pricing API for fal endpoints, the provider's own pricing page otherwise). Put them in the same cost file as the video models (`packages/core/src/pricing/falCosts.ts`, extend it for non-fal providers with a `provider` field).
2. Charge = ceil(provider USD x 1.5 / 0.0165), same floor, same 1.2x reserve, same fail-closed rule for an operation with no recorded cost.
3. Regenerate `docs/PRICING-TABLE.md` to include every operation and show margin per plan. Use USD with an AUD column at a stated rate and date.
4. Replace `OPERATION_COSTS` entirely; no flat numbers may remain. Update tests and the price-agreement test to cover non-video operations.

## D. Verify and report
Run tsc, Jest, check-chokepoints, lint baseline and the FULL Playwright suite; deploy through `scripts/migrate-prod.mjs` (take a Neon snapshot first if any migration is pending); verify live that download routes still 503 and prices still match. Report A–C as DONE / PARTIAL / NOT DONE with commit sha, the full operation price list, and every operation whose provider price you could not verify.
