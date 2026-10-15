# BUG REGISTER — Run 54 grok schema (2026-10-16)

| ID | Status | What landed |
|---|---|---|
| R54-GROK | live | The adapter now sends the director schema and one example. Two Grok 4.7 calls validated. `DARK_CREATIVE` is `x-ai/grok-4.7`. Reasoning stays outside `max_tokens`; the estimate adds 577 tokens. |

# BUG REGISTER — Run 53 grok route (2026-10-16)

| ID | Status | What landed |
|---|---|---|
| R53-GROK | smoke failed, id unchanged | One capped call to `x-ai/grok-4.7` returned finish reason stop and did not match the director schema. `DARK_CREATIVE` stays `x-ai/grok-4`. The verification cache marks that id missing, and the router throws `ModelUnavailableError` with "This style is temporarily unavailable" instead of calling another model. `scripts/verify-models.ts` still exits 1. |

# BUG REGISTER — Run 52 expert briefs (2026-10-16)

| ID | Status | What landed |
|---|---|---|
| R52-EXPERTS | code + unit tests, model list checked | Seven role briefs, client-side validation with one repair, family adapters, and a video registry live in `@cinema/core`. Prompts in the swarm and the brain compose those briefs. `x-ai/grok-4` is missing from the OpenRouter model list. The id was not changed. `docs/model-verification-2026-10-16.md` is the proposal. |

# BUG REGISTER — Run 51 monitor size (2026-10-15)

| ID | Status | What landed |
|---|---|---|
| R51-MONITOR | code + local playwright, production deployed | The program picture stayed about 252×142 because the well sized to leftover height and the video box followed the letterbox. The well now fills the monitor (`object-contain`), scopes and clip controls collapse, and the dock keeps the monitor at least 45% of the editor height with a draggable divider. On localhost the picture measured 817×232 with the panel open and 1036×232 closed at 1280, and 1354×586 open and 1572×586 closed at 1920. On a phone the feature request leaves the page and lives in the more menu. Exactly one quality card is selected, and that card's price is the Generate price. Focus rings show for keyboard focus only. `e2e/responsive-layout.spec.ts` covers the picture growth, the uncovered Generate control, and the single selected card. Production `https://forgecinema.vercel.app` is this deploy. A logged-out visit to `/ultimate` and `/simple` redirects to `/login`, so the signed-in measurements were not repeated on the host. |

# BUG REGISTER — Run 50 layout (2026-10-15)

| ID | Status | What landed |
|---|---|---|
| R50-LAYOUT | code + local playwright, production deployed | The feature request sat on the Generate control, and Ultimate/Advanced/Simple clipped controls with no way to reach them. The request docks bottom-right. The side panel closes with the edge chevron, the panel X, and `[`, and the choice is saved. Under 1500px the top bar keeps Export Film and puts the rest in a more menu. Under 700px Ultimate and Advanced ask for a wider screen and link to Simple. Simple fits a phone width. `e2e/responsive-layout.spec.ts` passed signed-in on localhost for all six viewports. Production `https://forgecinema.vercel.app` is this deploy. A logged-out visit to `/ultimate` redirects to `/login`, so the signed-in probe was not repeated on the host. |

# BUG REGISTER — status after FIX WAVE 3 (2026-10-04)

Wave 3 closed the 2026-10-04 audit residuals. Job counts now: CANCELLED 90 (tagged historical residue, not re-queued), NEEDS_ATTENTION 8, FAILED 7, COMPLETE 2, PROCESSING 0. Plates link to Asset kind `location`. `VaultLocation` is empty by design. Legacy `needs_action` / `resolved` asset states are rewritten to `unresolved` / `imported` / `generated`. Internal accounts stay balance 0 and are excluded from the ledger rewrite. The 90 cancelled jobs are the pre-fix double-worker residue.

# BUG REGISTER — status after FIX WAVE 2 (2026-09-30)

Source of the rows: the fed `BUG-REGISTER-3.md`. Wave 1 fixed the code paths. Wave 2 reconciled the data those paths left behind. The reconciler is `src/lib/reconcile/wave2.ts` (`runWave2Reconcile`). It also runs inside `/api/cron/cleanup-jobs`, and it can be run again safely: a second run changes nothing.

| ID | Status | What landed |
|---|---|---|
| P0-1 | ✅ code | `src/workers/index.ts` no longer starts a render worker. The only `render` consumer is `src/lib/queue/workers/render.worker.ts` (`npm run worker:render`). Unknown job types throw. A paused job is marked failed and releases its hold. |
| P0-2 | ✅ code | Project routes live only under `src/app/api/projects/[projectId]`. The `[id]` segment is gone. |
| P0-3 | ✅ | Canonical set is Prisma `User` / `Account` / `Session` via NextAuth `PrismaAdapter`. Session strategy is JWT, so `Session` stays empty. This database has no lowercase `user` / `account` / `session` tables. |
| P1-1 | ✅ code + data | Every terminal failure releases the hold. Completion writes a typed release plus a typed deduction. Holds today: 5 SETTLED, 13 REFUNDED, 0 ACTIVE. |
| P1-2 | ✅ | All 12 completed clips have a storage key. Completed clips left on a provider URL alone: 0. A dead provider URL is marked media-lost and kept. |
| P1-3 | ✅ | Scenes roll up from the full clip mix. A scene with completed clips and clips still awaiting direction is PARTIAL. Today: 1 GENERATED, 6 PARTIAL, 14 FAILED, 0 PENDING. |
| P1-4 | ✅ code | `TranscriptEditor` calls `POST /api/studio/audio/gap` (`op: transcribe`). First click prices. Second click confirms. |
| P2-1 | ✅ | `totalGenerated` increments once per clip on first completion. Wave 2 reconciled every counter against completed clips: 0 needed correction. |
| P2-2 | ✅ | Internal accounts are unmetered with balance 0. The ledger rewrite skips `isInternal`. Historical signup grants on an internal account are not a live balance. External balances match the ledger. |
| P2-3 | ✅ code, needs a new sign-in | Google requests offline access with consent. The JWT callback keeps `refresh_token` on the token when Google returns one. The first refresh token appears on the next Google sign-in. |
| P2-4 | ✅ | Characters stuck at TRAINING are closed as FAILED after 6 hours or when there is no LoRA id. The reason is stored in `VaultCharacter.loraError` and shown under the Failed label in `VaultPanel`. The one failed character now has its reason. |
| P2-5 | ✅ data, resubmit waits on pause | Failed clips keep a `statusReason`. Jobs today: 2 COMPLETE, 90 CANCELLED (historical residue, not re-queued), 7 FAILED, 8 NEEDS_ATTENTION, 0 PROCESSING. |
| P2-6 | ✅ | The 12 `LocationPlate` rows were copied into `Asset` (`kind: location`) and linked through `LocationPlate.assetId`. `VaultLocation` stays empty. No third representation was added. |
| P2-7 | ✅ | Asset states are imported 12, unresolved 7, generated 1. The 7 unresolved rows carry `boundary.needsAction`. No row remains on `needs_action` or `resolved`. |

Schema for wave 2 is additive (`20260930234000_fix_wave_2`): `StudioClip.statusReason`, `StudioClip.retryEligible`, `VaultCharacter.loraError`, `LocationPlate.assetId`.

Pause rule was not changed: an unset `GENERATION_PAUSED` still means paused.

| P2-WS | open | Run 37 part 2 mounted tool workspaces and saved timeline mode per user. Browser screenshots at 1440×900 and 1280×720 were not taken. Do not mark the workspace rows done until that pass. |

## Fix wave 2

| ID | Status | What landed |
|---|---|---|
| P2-5 | ✅ | Pending clips with no video are `FAILED` and kept. 43 are marked retryable. They were not resubmitted, because generation is paused. No clip was deleted. Processing jobs older than an hour with no output are failed with a reason. The cleanup cron runs this reconcile and no longer rewrites finished jobs to cancelled. |
| P2-2 | ✅ | Credit rows are typed. Non-internal balances match the sum of the ledger. Internal accounts are skipped. |
| P2-1 | ✅ | `totalGenerated` matches completed clips. The 12 completed clips belong to the internal accounts. |
| P2-4 | ✅ | The stuck character is `FAILED` with the training job's reason. A training still marked training after six hours is closed the same way. |
| P2-6 | ✅ | The 12 location plates stay, because shots point at them, and each is linked to one `Asset` of kind `location`. `VaultLocation` is empty. |
| P2-7 | ✅ | Legacy `needs_action` becomes `unresolved` with `boundary.needsAction`. Legacy `resolved` locations become `imported`. A resolved character with an image becomes `generated`. |
| P2-3 | ✅ code | Google offline access was already requested. The JWT callback now refreshes the Google access token before it expires. The app session stays a JWT, so an expired Google token does not sign the person out. A refresh token appears on the next Google sign-in. |
