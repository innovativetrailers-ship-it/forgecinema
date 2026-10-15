# Run 52 — Expert briefs for cloud LLMs/VLMs and video models, plus a verified model registry (do not stop until all done and tested)

Read first: `final-fixes/EXPERT-BRIEFS-01-roles.md`, `EXPERT-BRIEFS-02-model-adapters.md`, `CLOUD-MODEL-RESEARCH-REPORT.md`. They are the spec; do not re-derive from memory. Rules: INV-2 one LLM path (everything goes through `packages/core/src/llm/routing.ts`), INV-5 no silent substitution or swallowed errors, INV-6 typed intent, INV-7 additive migrations, INV-8 web/desktop parity (code lives in `@cinema/core`). No generation spend in tests: use recorded fixtures and mocked providers. Pause guard unchanged. No third-party model names in user-facing UI.

## 1. Expert briefs in `@cinema/core`
- New folder `packages/core/src/experts/` with: `roles/{director,cinematographer,colourist,editor,sound,continuity,qa}.ts` (each exports `{version, identity, scope, craft, outputSchema, failureModes}`), `examples/<role>.json` (3 examples each, one an edge case), `shotSpec.ts` (the canonical shot spec as a Zod schema + TS type from Part 1), `qaSchema.ts` (superset of the current QA_INSPECTOR_PROMPT output, backwards compatible fields kept).
- `BRIEF_VERSION` string in each role; every LLM call logs the role + version.
- Replace the generic prompts in `src/lib/swarm/brain-prompts.ts` and `src/lib/brain/prompts.ts` by composing these briefs. Keep exported names so callers do not break; delete dead prompt text.
- Client-side validation (Zod) for every role output: clamp ranges (scores 1-5, boxes 0-1, times inside clip), reject zero-area boxes, reject defects with no frame or timestamp as `confirmed: false`. Invalid output = typed error + one repair attempt on the same route, then fail loudly. Never fabricate fields.

## 2. Model adapters (style layer) in code
- `packages/core/src/experts/adapters/{claude,grok,gemini,gpt}.ts`: build the request for each family from a role brief + inputs, following Part 2 section A exactly:
  - Claude: system role, XML sections, examples, schema via `output_config.format`; never prefill; never send temperature/top_p/top_k to Sonnet 5 / Haiku 5.5; parse `stop_reason` (`refusal` = HTTP 200, `max_tokens` = truncated); no "reasoning" JSON field (use `evidence`); images before text with labels "Frame 07, t=00:03.50"; absolute pixel boxes of the image as sent.
  - Gemini: video first then text, `MM:SS`, `fps` configurable, `box_2d` is `[ymin,xmin,ymax,xmax]` 0-1000 — convert to Forge `x,y,w,h` 0-1 with a unit test that would fail if y/x were swapped.
  - GPT-6: remove sampling params when effort is not `none`; do not use for boxes; text fallback only.
  - Grok: explicit genre/POV/intensity/limits section instead of any "edgy" line; schema-validated; flagged `source_tier: T2` until verified.
  - All OpenRouter calls: `require_parameters: true` with `response_format`.
- Box converters in one file with tests for each provider convention.

## 3. Video prompt compiler + model registry (parameter layer as DATA)
- `packages/core/src/experts/video/registry.json` (or TS const typed by Zod): one entry per (model, gateway) with: id, version, durations allowed, aspect ratios, resolutions, fps, max references, reference syntax, negative-prompt support (`field` | `prose` | `never`), dialogue grammar, audio support, duration encoding (number or "8s" string), `source_tier` (T1/T2/T3/U), `verified_at`, `status` (live | unverified | retired). Seed it from Part 2 section B. Sora 2: `retired`. Kling 4.0: `unverified`. Seedance 2.5: `unverified` until a live call succeeds. Luma: negative = never.
- `compileShot(shotSpec, modelKey)` -> `{prompt, params}`: clamps duration to the allowed set (and returns the real clip length to the editor), renders dialogue in the model's grammar, chooses negative-field vs prose vs omit, enforces word/char caps, maps references with stated roles. Unknown or retired model = typed error naming model and reason (INV-5), never a quiet swap.
- Hook into the existing generation path through the existing `modelKnowledge.ts` capability layers (do not create a second capability store). Layer 1 seeds from this registry; Layer 2 live endpoints still override.

## 4. Verification jobs (so drift is caught, not discovered)
- `scripts/verify-models.ts` (runnable in CI and on a schedule): fetch the OpenRouter models list and assert every id in `routing.ts` exists and is not deprecated; report (not fail) ids that have newer successors (e.g. `gemini-3.5-flash` -> 3.6/3.8; `x-ai/grok-4` -> `grok-4.7`; `openai/gpt-6-*` -> `gpt-6.1-sol`; Claude Haiku 4.5 -> Haiku 5.5). For video: for each registry entry with `status != retired`, check the fal endpoint exists (schema fetch) and diff parameter names against the registry. Output `docs/model-verification-<date>.md`.
- Do NOT change any routed model id in this run. Produce the report and a proposed diff only; Neo decides. Admin page (or CLI output) lists every registry field with `source_tier: U` so nothing unverified is hidden.

## 5. Evaluation set (small, real)
- `packages/core/src/experts/eval/`: 12 recorded cases (no live spend): 4 QA cases from existing project outputs on Neo's Mac if present, otherwise synthetic frames with known defects (extra finger, text garble, identity change, camera drift); 4 director/cinematographer cases (script beat -> valid shot spec); 4 compiler cases (same shot spec -> each of Veo, Kling, Seedance, Luma outputs obeying caps).
- Tests assert: schema validity, box conversion, QA never returns `needs_repaint` for an unconfirmed defect, compiler clamps durations, retired model errors, Luma never receives a negative prompt.
- Add a manual live script `scripts/eval-live.ts` (not in CI, cost printed first, needs `--yes`) that runs the QA cases against Gemini and Claude and prints agreement with the known defects.

## 6. Parity and proof
- Web and desktop import the same package; add a test that both build with the new exports (INV-8).
- Report per item: files changed, tests added and results, one sample of each role's output validated by its schema, the verification report. Do not mark done from reading code. No routing id changes, no prices changed, pause unchanged.
