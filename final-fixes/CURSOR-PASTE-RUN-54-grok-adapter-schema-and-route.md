# Run 54 — Grok adapter never told the model the schema; fix, re-smoke, switch DARK_CREATIVE (do not stop until the route is live-proven)

Source: `docs/grok-4.7-smoke-2026-10-16.md`. The Grok 4.7 reply was valid JSON, no refusal, finish `stop`, but with invented keys (`coverage_plan`, `shot_order`, `shots[].idea/must_show/...`) instead of the director schema (`scene_id`, `intent`, `shots[]` with canonical shot-spec fields, `coverage_notes`). That is an adapter/prompt defect, not a model defect: the model was only asked for "the director JSON" and `response_format` was `json_object` (no schema). Right now `DARK_CREATIVE` points at `x-ai/grok-4`, which is not on the live list, so the dark-creative route throws `ModelUnavailableError` (correct, loud). Rules: INV-2, INV-5, INV-8. Pause, prices and all other routed ids unchanged. Spend cap for this whole run: 3 live calls, each printed before/after in USD and AUD.

## 1. Adapter fix (all four families, not only Grok)
- Every adapter (`claude`, `grok`, `gemini`, `gpt`) must put the role's output contract in the request: the JSON schema rendered as text with field names, types, ranges, plus one complete valid example (from `examples/<role>.json`), and the instruction "Return only JSON with exactly these keys; no extra keys." Where the provider path supports a real schema (`json_schema` strict via the router, Claude `output_config.format`, Gemini `responseSchema`), send it; otherwise `json_object` plus the in-prompt contract.
- Add a unit test per adapter and per role: the built request contains every required top-level key name of that role's schema and the example. This test must fail on today's Grok director request.
- On schema-invalid output, the existing single repair attempt must send the validation issues back to the same model ("These fields are missing or wrong: ...; return corrected JSON only"). Add a test with a mocked invalid-then-valid reply.

## 2. `max_tokens` is not a cap on this route
- The smoke sent `max_tokens: 400` and the provider billed 1158 completion tokens. Find out why (reasoning tokens counted outside the cap, parameter not forwarded by `postFalRouterChat`, or the fal/OpenRouter field name differs). Fix the forwarding if it is ours; if reasoning is uncapped by design, send the lowest reasoning effort the model allows (`reasoning_effort` low) and make the cost estimate use the real worst case (cap + a documented reasoning allowance) so any spend guard is honest. Document the finding in `docs/grok-4.7-smoke-2026-10-16.md`. Check the same for Claude/Gemini/GPT routes and list results in the verification report.

## 3. Re-smoke (max 2 live calls)
- Re-run `scripts/grok-4.7-smoke.ts --yes` with the fixed adapter. Pass criteria: valid director schema on the first reply (or after the single repair), no refusal, cost printed. Then a second call only if needed, using a darker beat (violent confrontation, no gore, no real people) to confirm Grok accepts mature-but-allowed fiction through this route; record refusals verbatim.
- If it passes: set `DARK_CREATIVE` to `x-ai/grok-4.7` (use the id the router accepts; note the dated alias in the registry), update tests/registry, re-run `scripts/verify-models.ts` and it must exit 0. If it still fails after the schema fix, do not change the id; write the exact failure and stop.

## 4. Housekeeping
- Commit as separate commits on `run-43-pricing` and push (no force). Report hashes.
- Desktop repo: `index.js` at the repo root is untracked. Inspect it: if it is a stray build/debug file add it to `.gitignore` and do not commit it; if it is real source, say what it is and commit it separately. Re-pin the desktop to the new core commit, bump version only if desktop code changed, run desktop tests and the packaged-app smoke (`open -n`), Mach-O gate inspected > 0. Signing/notarisation stays with Neo; no tag, no upload.
- Spec hygiene: `final-fixes/` (all Run prompts, BUILD-* docs, EXPERT-BRIEFS-01/02, CLOUD-MODEL-RESEARCH-REPORT) has been copied into this worktree but is untracked. Commit the whole folder in its own commit "docs: add final-fixes specs and run prompts" on `run-43-pricing`, push, and keep adding each new Run prompt to it. Do not edit their contents. Also check whether the same folder is tracked on the other branch/worktree (`run-38b-billing` has 3 tracked files and many untracked) and report so there is one source of truth.
- Update `docs/` so the model-verification report and the smoke doc agree with the final state.

## Report back
Per item: cause, change, test that proves it, live-call results with cost in USD and AUD, commit hashes. Do not mark done from reading code.
