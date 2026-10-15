# Forge expert briefs — Part 2: model adapters (v1, 2026-10-16)

Two layers, per the research conclusion:
- **Style layer** (how a model wants words ordered, dialogue grammar, negatives allowed or not): changes slowly, written here, stored as code.
- **Parameter layer** (ids, durations, ratios, reference limits, prices): changes monthly and differs between provider-direct and every gateway. Stored as DATA (one registry file, `source_tier` on every field), verified against the live endpoint on first use and by a scheduled check.

Source tiers: `T1` vendor docs read directly; `T2` through an intermediary (fal.ai guide, aggregator); `T3` practitioner blog; `U` unverified / gap. Prices are USD as published; AUD conversion is a config value.

## A. LLM / VLM adapters

### Claude (Opus 5.5, Sonnet 5.5, Haiku 5.5; Fable 5.1 optional) — T1
- Role: one-sentence system role; XML tags for sections; 3-5 diverse examples; long data first, question last; positive instructions.
- Sonnet 5 is literal: say "every shot" not "the shots"; state scope.
- Opus 5.5 defaults to medium effort and is verbose: set effort explicitly per role, ask for concision.
- Prefill is a 400 on 4.6+ models: never prefill; use schema output (`output_config.format` json schema) or strict tool use.
- `temperature/top_p/top_k` rejected on Sonnet 5 and Haiku 5.5: do not send them; determinism comes from schema + validation.
- Schema does not enforce min/max/length: validate client-side.
- Parse on `stop_reason`: `refusal` arrives as HTTP 200; `max_tokens` can truncate JSON.
- Do not request a JSON field called "reasoning"; ask for `evidence` / short `explanation` (a reasoning-extraction request can be refused).
- Vision: images before text, each labelled; >20 images per request needs each image <= 2000 px edge; high-res tier long edge 2576 px. Boxes: ask for absolute `[x1,y1,x2,y2]` pixels of the image as sent, never 0-1000; treat as approximate; crop and re-ask for small targets. Claude does not take video (GIF = first frame): Forge extracts frames. Do not rely on Claude to detect synthetic images; frame it as quality inspection of described defects.
- Dark/violent fiction: no Anthropic guidance found (U). Adapter behaviour: on `refusal`, fall back to the dark-creative route, never retry same model.

### Grok (grok-4 in table; grok-4.7 reported) — T2/U
Official xAI docs were blocked during research, so every Grok fact is a hypothesis to re-check on first use.
- Reported: `grok-4.7` released 2026-09-21, 500K context, text+image input, `reasoning_effort` low..xhigh (cannot be off on 4.6/4.7), strict `json_schema`, OpenAI-style function calling. OpenRouter lists `x-ai/grok-4.7` and `x-ai/grok-4`.
- Style: do NOT use a blanket "edgy / not afraid to offend" line (xAI itself blamed such a line for a 2025 incident). Instead state genre, point of view, intensity ceiling and content limits explicitly.
- Role in Forge: dark/mature creative draft (DARK_CREATIVE). Output still passes the same schemas and a safety/age-rating check afterwards.
- Policy: the only AUP text found was an outdated June 2026 version (no fiction carve-out; bans sexualising minors, sexual/defamatory depictions of real people, WMD uplift). Re-read the current AUP before launch.

### Gemini (Flash-Lite cheap tier; Flash/Pro for video QA) — T1 for video + boxes, U for ids
- Model drift: `gemini-3.5-flash` is deprecated and auto-routes to `gemini-3.6-flash`; Google recommends 3.6 or 3.8 Flash. `gemini-3.8-flash` stable, 1,048,576 in / 65,536 out, thinking low/medium/high ("minimal" errors). OpenRouter lists `google/gemini-3.5-flash-lite` and `google/gemini-3.8-flash`. Pro and Flash-Lite ids on Google's own API: U.
- Video input: native video, 1 FPS default (set `fps` higher for short clips and fast defects), roughly 66 or 258 tokens/frame by media resolution, up to 10 videos per request. Timestamps `MM:SS`. Put the video first, text prompt after.
- Boxes: `box_2d = [ymin, xmin, ymax, xmax]` normalised 0-1000 (y first). Convert to Forge `x,y,w,h` 0-1.
- Timestamp accuracy is weak (one benchmark: 48.7% of predicted timestamps accurate, with an older Gemini): ask for frame ids from labelled frames rather than free timestamps, and confirm by re-asking on the cropped window.
- Structured output / prompting guide: not retrieved (U). Use `responseSchema` and validate.

### GPT-6 (Astra / 6.1 Sol / Sol / Luna) — T1 for family + API rules, U for vision
- Ids per OpenAI guide: `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-luna`, `gpt-6-sol`. 6.1 Sol latest (note dated 2026-09-29). Reasoning effort low..max; Astra and 6.1 Sol reject `none`; when effort is not `none`, remove `temperature`, `top_p`, `top_logprobs`.
- Vision limits, video, image token cost, box convention, strict-schema rules: NOT found. Do not give GPT-6 localisation (box) duties until tested; use as text fallback only.
- Via OpenRouter: always send `require_parameters: true` with `response_format`, else a fallback provider can silently ignore the schema.

### OpenRouter rules (all LLM routes)
- Structured output support is per endpoint; `strict` only where the provider has a native strict mode. Use `require_parameters: true`.
- Model-id verification job (see Run 52): query the models list at build/CI and on a schedule; fail loudly (INV-5) if a routed id is missing or deprecated; never silently substitute.

## B. Video model adapters

Shared prompt style (converges across T2/T3 sources): subject + action first, one camera move per shot, verbs over mood words, explicit audio line, image-to-video describes only what changes. The compiler turns the canonical shot spec into each model's dialect and enforces caps.

| Model | Dialect | Dialogue | Negatives | Notable limits (tier) |
|---|---|---|---|---|
| Seedance 2.0 / 2.5 | short brief ~60-100 words; references as `@Image1`, `@Video1`, `@Audio1` with stated roles | quoted | none documented (T2); say "no music" in prose | 2.0: 4-15 s, 12 refs (T2). 2.5: reported 31 Jul 2026, up to 30 s, 50 files, `task` field, `draft` mode (T2/T3) |
| Kling 3.0 (4.0 unverified) | scene-direction prose; up to 6 labelled shots; `multi_prompt` | `[Character A: Role, voice]: "line"`, labels consistent | field exists on fal v3 (T2) | 3-15 s (T2); dialogue languages conflict (zh/en only per endpoint doc). Kling 4.0 = single third-party source, treat as not live |
| Veo 3.1 (+Fast, Lite) | prose with quoted dialogue, explicit SFX and ambience lines | quoted | field on fal (T2); Google API: U | 4/6/8 s, 24 fps, 16:9 or 9:16; 1080p, 4K, references and extensions force 8 s; up to 3 reference images, first/last frame (T1) |
| LTX-2.5 Pro/Fast | one chronological paragraph, sound and camera ranked first; `camera_motion` enum | prose | not in guide (T2) | enum list incomplete (5 of 8 found) |
| Wan 3.0 | block brief or timecoded beats; `enable_prompt_expansion`, `enable_thinking`, `audio` | prose | no field; "no X" in prose | 2-30 s (T2) |
| PixVerse V6 | V5.5 guide only (U for V6) | prose | field in V5.5 | endpoints: t2v, i2v, transition (first/last), extend |
| Hailuo 03 | timed blocks "[0 to 2 seconds]"; up to 7,000 chars | prose | prose | 5-15 s; fal id `minimax/hailuo-03`; param names U |
| Vidu Q4 | reference-driven; ~3 beats per clip | prose | prose | refs 12 (fal) vs 15 (third party); may lack text-to-video (U) |
| Luma Ray3.14 | positive-only, ~100 words, present tense, avoid "begins to" | n/a (no native audio) | harmful, never send | duration table self-contradicts (U) |
| HappyHorse 1.x (Alibaba) | native audio, lip-sync 7 languages | quoted | prose | 3-15 s; fal `alibaba/happy-horse`; specs conflict |
| Omni (likely Gemini Omni Flash) | schema: prompt, aspect_ratio, resolution, duration | n/a | n/a | prompt guide not found (U) |
| Grok Imagine | subject/action first, then camera, lighting, sound; timecoded segments, quoted dialogue | quoted | n/a | reported 1-15 s, 480p/720p, native audio (T2 only). Blocked generations still consume quota; real faces blocked most; silent 720p->480p downgrades reported |
| Sora 2 | REMOVE from routing | | | app closed 2026-04-26, API scheduled to end 2026-09-24 (second-hand). fal still lists endpoints: flag unavailable until a live call proves otherwise |
| Runway Gen-4.5 | Runway site and Runware disagree on some parameters | | | verify on the actual gateway |

Adapter rules the compiler must enforce:
1. Clip length is clamped to the model's allowed set (e.g. Veo 4/6/8) and the editor is told the real clip length.
2. Negative prompt: pass a field only if the registry says the endpoint has one; otherwise express as positive prose; never send to Luma.
3. Dialogue rendered in the model's grammar; one voice descriptor per character, reused verbatim.
4. Gateway parameter map is data (duration as number vs "8s" string, aspect sets, audio toggle, reference syntax). Krea-style wrappers differ from fal; parameter maps are keyed by (model, gateway).
5. No silent substitution (INV-5): if the requested model/version is unavailable, return a typed error naming the model and the reason.
6. Every registry field carries `source_tier` and `verified_at`; `U` fields are shown to Neo in an admin report, not hidden.
