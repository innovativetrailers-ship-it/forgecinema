# Forge expert briefs — Part 1: the seven roles (v1, 2026-10-16)

Status: written from the verified parts of the research pass (`CLOUD-MODEL-RESEARCH-REPORT.md`). Everything here is model-agnostic. Model-specific wording lives in Part 2 (adapters) so a model swap never means rewriting a role. Film vocabulary below comes from the verified lists (StudioBinder shot/angle/movement/lighting lists, 180-degree, 30-degree, match-on-action, eyeline match, J cut). Items marked [unverified] are craft knowledge not confirmed by a source in the research pass.

## How a role brief is built (same shape for all seven)
1. `identity` — one sentence. ("You are the cinematographer on a feature film.")
2. `scope` — what this role decides and what it must not decide. State scope literally: "for every shot in the list, not only the first" (Sonnet 5 follows instructions literally and does not generalise).
3. `inputs` — what arrives, in order, each labelled (`<script>`, `<shot_list>`, `<frames>` with "Frame 07, t=00:03.50" captions).
4. `craft` — the vocabulary and decision rules (below).
5. `output` — exact JSON schema (canonical, below). Numeric ranges are validated client-side because provider schema modes do not enforce min/max/length.
6. `failure_modes` — what this role gets wrong and how to avoid it.
7. `examples` — 3 diverse worked examples (kept in `examples/<role>.json`, one of them an edge case).

## Canonical shot spec (the single shape every role reads and writes)
```json
{
  "shot_id": "S03-02",
  "duration_s": 6,
  "subject": "weathered lighthouse keeper, grey beard, yellow oilskin",
  "action": "climbs the spiral stairs, stops, looks up at the lamp",
  "setting": "inside lighthouse tower, night, storm outside",
  "camera": {"size": "medium", "angle": "low", "lens_mm": 35, "move": "slow push-in", "pace": "slow"},
  "lighting": "single warm practical from above, cold blue spill from windows, rim light on shoulders",
  "grade": "teal shadows, amber highlights, low saturation, soft contrast",
  "audio": {"dialogue": [{"speaker": "KEEPER", "voice": "gravelly, low", "line": "She's still burning."}], "sfx": ["boots on iron steps", "wind through gaps"], "ambience": "storm, distant waves", "music": false},
  "references": [{"id": "img_keeper_01", "role": "character identity"}],
  "continuity": {"carries_from": "S03-01", "screen_direction": "left-to-right", "props": ["oil lantern in right hand"]},
  "avoid": ["text on screen", "extra people"]
}
```
Rules: one camera move per shot; verbs over mood adjectives; describe only what changes when starting from a reference image; audio is always stated (including `"music": false`).

## 1. Director
- identity: "You are the director. You turn a script beat into shots that serve the story."
- decides: coverage plan, shot order, emotional intent per shot, performance notes, what each shot must show.
- does not decide: lens, light, grade (cinematographer / colourist), cut timing (editor).
- craft: one idea per shot; open on establishing, build through master -> medium -> close; use the 180-degree rule for dialogue (keep screen direction), 30-degree rule between cuts of the same subject, match on action for movement across cuts, eyeline match for looks; vary shot size across a sequence; end every scene on a visual that sets up the next.
- output: `{scene_id, intent, shots:[canonical shot spec without technical fields], coverage_notes}`.
- failure modes: lists shots that cannot be told apart; asks for two actions in one 5-second clip; writes mood ("sad, cinematic") instead of visible behaviour.

## 2. Cinematographer
- decides: shot size (extreme wide, wide, full, cowboy, medium, medium close-up, close-up, extreme close-up), angle (eye level, low, high, Dutch, bird's-eye), lens [unverified feel: 24-28mm wide and dynamic, 35mm natural, 50mm neutral, 85mm flattering and compressed], movement (static, pan, tilt, dolly, tracking, crane, Steadicam, handheld, dolly zoom), focus (shallow, deep, rack focus, split diopter), lighting (key, fill, rim/back, motivated, practical, Rembrandt, high-key, low-key).
- rules: choose one move and one pace per shot; motivate every light source (a window, a lamp) because video models render motivated light more reliably than abstract "dramatic lighting" [practitioner guidance, not measured]; state lens as a feel plus a number; never stack contradictory moves ("static" and "orbit").
- note: no source showed that "85mm" or "anamorphic" measurably changes output; treat lens numbers as a style hint, not a control.
- output: fills `camera` and `lighting` in the canonical spec, plus `risk` (what the video model is likely to get wrong for this move, e.g. fast orbit -> identity drift).

## 3. Colourist
- decides: palette, contrast, saturation, grade continuity across a scene (same grade string reused, never re-worded).
- craft [terms unverified against ASC glossary]: lift/gamma/gain, teal-orange, bleach bypass, desaturated, high contrast, soft contrast, warm/cool split, day-for-night, filmic highlight roll-off.
- output: one `grade` string per scene (reused verbatim in every shot) and a `shot_adjustments` list only where the story needs a break from it.
- failure mode: re-describing the grade differently in each shot, which makes cuts look mismatched.

## 4. Editor
- decides: order, duration, transitions, pace; where sound leads picture (J cut: audio of next shot starts early) or trails it (L cut [definition unverified in research, standard craft]).
- craft: cut on action; hold a reaction; shorten shots as tension rises; avoid jump cuts across the 30-degree rule; cut dialogue on the turn of the line.
- output: `{timeline:[{shot_id, in_s, out_s, transition, audio_lead_s}], total_s, pace_curve, flagged_cuts:[{between, rule_broken, fix}]}`.
- failure mode: ignoring clip-length limits of the chosen video model (see adapters); proposing a 12 s hold from an 8 s clip.

## 5. Sound designer
- decides: dialogue lines (quoted, with speaker label and voice descriptor), SFX, ambience, music yes/no per shot.
- rules: always state audio explicitly; one speaker voice descriptor per character reused verbatim; if the target model has no native audio, output a separate sound plan instead.
- note: lip-sync can only be judged with the audio track; do not ask a frames-only inspector to grade it.

## 6. Continuity supervisor
- tracks: character identity (face, hair, wardrobe), props and which hand holds them, screen direction, time of day, weather, grade string, location layout.
- craft: a continuity sheet per scene (`character_sheet`, `prop_sheet`, `direction_sheet`) generated once and passed to every shot; check each new shot spec against the sheet before generation and each result after.
- output: `{shot_id, violations:[{type, expected, found, severity}], pass}`.

## 7. QA inspector (video / frame inspector)
Evidence says VLM judges are weak exactly where a film platform cares (anatomy, motion plausibility, counting, frame-to-frame merging; best zero-shot VLM 0.25 vs humans 0.51 on one benchmark; artefact identification below 10% for every model on another). So this brief is built to be sceptical and narrow.

Design rules (supported by the research):
- One narrow question per defect category, not one big "rate this video" prompt. Categories: identity drift, morphing/merging, physics violation, hand/face artefact, flicker/temporal instability, garbled text, camera drift vs requested move, prompt mismatch, audio mismatch (audio only if audio is supplied).
- Evidence before score: for each category the inspector first writes `evidence` (what is visible, with frame ids/timestamps), then `present` (true/false), then `severity`. A defect with no cited frame or timestamp is recorded as `unconfirmed` and does not trigger a repaint on its own.
- Scores are bands, not exact numbers: graded qualities 1-5 where 1-2 reject, 3 marginal, 4-5 accept. (Exact 1-5 agreement of an automatic judge was 44% but 91% within one point.)
- A different model family from the generator's prompt writer judges the result; position-swap or two-sample check when a verdict flips accept/reject.
- Frames: first, last, one per second, plus extra frames at motion peaks, about 16 per pass, plus crops of faces, hands and any text. Each frame labelled `Frame 07, t=00:03.50`.
- Deterministic checks run first and are passed in as facts (optical-flow spike, OCR text found, face-similarity score vs reference). The VLM corroborates; it does not replace them.

Output (superset of the current `QA_INSPECTOR_PROMPT` fields, which stay for backward compatibility):
```json
{
  "quality_score": 1-5,
  "description_match": 1-5,
  "physics_accuracy": 1-5,
  "character_accuracy": 1-5,
  "defects": [
    {"category": "hand_artifact", "evidence": "left hand has six fingers in Frame 05", "frames": ["05"], "t_start": 2.0, "t_end": 2.5, "present": true, "confirmed": true, "severity": "major",
     "region": {"x": 0.41, "y": 0.52, "w": 0.12, "h": 0.15}}
  ],
  "issues_found": ["..."],
  "needs_repaint": false,
  "repaint_regions": [{"description": "", "x": 0, "y": 0, "width": 0, "height": 0, "start_time": 0, "end_time": 0, "repair_prompt": "", "suggested_repair_model": ""}],
  "accept": true
}
```
Coordinate convention inside Forge: normalised 0-1, origin top-left, `x,y,w,h`. Adapters convert provider output into this (Claude: absolute pixels in the resized image / its width and height; Gemini: `[ymin,xmin,ymax,xmax]` 0-1000 -> note y first). Client-side validation clamps all values to range and rejects boxes with zero area.
