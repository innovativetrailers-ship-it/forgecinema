# Model verification 2026-10-16

No routed model id was changed. This report is a proposal for Neo.

## Language routes

- present google/gemini-3.5-flash-lite
- present openai/gpt-6-luna
- present anthropic/claude-opus-5.5
- present openai/gpt-6-astra
- present anthropic/claude-sonnet-5
- MISSING x-ai/grok-4
- present openai/gpt-6-sol

## Newer successors (report only)

- google/gemini-3.5-flash-lite: Research names gemini-3.6-flash and gemini-3.8-flash as successors of gemini-3.5-flash. Routed id unchanged.
- x-ai/grok-4: Research names x-ai/grok-4.7. Routed id unchanged.
- openai/gpt-6-astra: Research names openai/gpt-6.1-sol as the newer GPT-6. Routed id unchanged.
- openai/gpt-6-sol: Research names openai/gpt-6.1-sol. Routed id unchanged.
- openai/gpt-6-luna: Research names openai/gpt-6.1-sol. Routed id unchanged.
- Claude Haiku 4.5 is not a routed id. Research names Haiku 5.5. No change.

## Video registry against catalogued endpoints

- seedance-2.0@fal has no catalogued endpoint, not fetched
- seedance-2.5@fal has no catalogued endpoint, not fetched
- kling-3.0@fal schema properties 22; registry names missing from schema: none
- kling-4.0@fal has no catalogued endpoint, not fetched
- veo-3.1@fal schema properties 22; registry names missing from schema: none
- ltx-2.5@fal has no catalogued endpoint, not fetched
- wan-3.0@fal has no catalogued endpoint, not fetched
- pixverse-v6@fal has no catalogued endpoint, not fetched
- hailuo-03@fal has no catalogued endpoint, not fetched
- vidu-q4@fal has no catalogued endpoint, not fetched
- luma-ray3.14@fal has no catalogued endpoint, not fetched
- happyhorse-1.0@fal has no catalogued endpoint, not fetched
- gemini-omni@fal has no catalogued endpoint, not fetched
- grok-imagine@fal has no catalogued endpoint, not fetched
- sora-2@fal retired, not fetched
- runway-gen4.5@fal has no catalogued endpoint, not fetched

## Unverified fields

- seedance-2.0@fal negative field (T2)
- seedance-2.5@fal durations (T2)
- seedance-2.5@fal task (T2)
- seedance-2.5@fal draft (T2)
- kling-3.0@fal dialogue languages (T2)
- kling-4.0@fal row (U)
- kling-4.0@fal durations (U)
- kling-4.0@fal aspects (U)
- kling-4.0@fal audio (U)
- kling-4.0@fal negative (U)
- veo-3.1@fal google api negative field (T2)
- ltx-2.5@fal camera_motion enum (T2)
- ltx-2.5@fal durations (T2)
- wan-3.0@fal param names (T2)
- pixverse-v6@fal row (U)
- pixverse-v6@fal durations (U)
- pixverse-v6@fal negative (U)
- pixverse-v6@fal dialogue (U)
- hailuo-03@fal row (U)
- hailuo-03@fal param names (U)
- vidu-q4@fal row (U)
- vidu-q4@fal reference count (U)
- vidu-q4@fal text-to-video (U)
- luma-ray3.14@fal row (U)
- luma-ray3.14@fal durations (U)
- happyhorse-1.0@fal specs (T2)
- gemini-omni@fal row (U)
- gemini-omni@fal prompt guide (U)
- gemini-omni@fal durations (U)
- grok-imagine@fal silent downgrade (T2)
- runway-gen4.5@fal row (U)
- runway-gen4.5@fal parameters (U)

## Proposed diff

Not applied. Neo decides.

- x-ai/grok-4 is missing from the model list. Research names x-ai/grok-4.7.
