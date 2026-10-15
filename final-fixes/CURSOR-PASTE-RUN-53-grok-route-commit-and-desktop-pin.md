# Run 53 — Fix the dark-creative route, fail loudly on missing ids, commit everything, bump the desktop pin (do not stop until all done and verified)

Source: your Run 52 report. `scripts/verify-models.ts` exits 1 because `x-ai/grok-4` is not in the live OpenRouter list. Rules: INV-2 one LLM path, INV-5 no silent substitution or swallowed errors, INV-8 web/desktop parity. Pause guard, prices and every other routed id stay unchanged (Gemini 3.6/3.8 and GPT-6.1 Sol upgrades stay as proposals in the verification report; do not apply them).

## 1. Dark-creative route
- Confirm the live OpenRouter list contains `x-ai/grok-4.7` (and note whether `x-ai/grok-4` appears under any alias).
- Make ONE capped smoke call to `x-ai/grok-4.7` through the existing LLM path, using the Grok adapter and the director brief with a short dark-scene beat. Cap: max tokens 400, one call, print the cost before and after. Assert: HTTP ok, output validates against the director schema, `stop_reason`/finish reason recorded, no refusal. Save the transcript summary to `docs/grok-4.7-smoke-2026-10-16.md`.
- If it passes: set `DARK_CREATIVE` in `packages/core/src/llm/routing.ts` to `x-ai/grok-4.7`, update its tests and the registry row (source_tier T1 for id-exists via OpenRouter list, T2 for the rest). Keep the Grok adapter style rules unchanged.
- If it fails or is refused: do not change the id; write the exact error into the doc and stop this item (report it, do not guess another model).

## 2. Missing routed id must fail loudly
- Today a missing/deprecated routed id must not fall back silently. Make the router throw a typed `ModelUnavailableError { role, modelId, reason }` for any routed id that the verification cache marks missing, and surface it as a clear user-facing error ("This style is temporarily unavailable") with the detail in the server log. No third-party model names in the UI. Test: simulate a missing id and assert the typed error, no fallback call, and the log line.

## 3. Verify script
- Re-run `scripts/verify-models.ts`; it must exit 0 after item 1. Save `docs/model-verification-<date>.md`. Keep Gemini/GPT/Claude successor notes as report-only "proposed" lines.

## 4. Commit and push (no force-push, stop and report if refused)
- Desktop repo `cinematic-forge-v3`: commit the uncommitted work from Runs 44–49 as logical commits (monitors/layout, playback/track headers, Output window, Preferences/version strings, tests/screens), message style as in the repo. Do not commit `dist/`, installers, `_clicktest` files or any secrets. Do not tag or upload a release; downloads stay closed; signing/notarisation stays with Neo.
- Web repo `forgecinema`, branch `run-43-pricing`: commit Run 52 (briefs, adapters, registry, verify script, tests, docs) and this run as separate commits, then push. Report all commit hashes.

## 5. Desktop pin
- Bump the desktop's pinned `@cinema/core` to the commit/version that contains `experts/`. Rebuild, run the desktop unit tests and the packaged-app smoke test (open with `open -n`, not dev mode): app launches, About shows the right version (one source of truth), and a mocked role call through the new package returns a schema-valid result. Bump the desktop version only if code changed; re-run the Mach-O gate (inspected > 0).
- Add a parity test that imports the same `experts` exports in web and desktop builds (INV-8).

## Report back
Per item: what changed, the test that proves it, commands and results, commit hashes, the smoke-call cost (in AUD as well as USD, using the configured rate). Do not mark anything done from reading code.
