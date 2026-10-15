# Model verification 2026-10-16

DARK_CREATIVE is x-ai/grok-4.7. Other routed ids are unchanged. Gemini, GPT, and Haiku successor notes stay proposals.

## Language routes

- present google/gemini-3.5-flash-lite
- present openai/gpt-6-luna
- present anthropic/claude-opus-5.5
- present openai/gpt-6-astra
- present anthropic/claude-sonnet-5
- present x-ai/grok-4.7
- present openai/gpt-6-sol

## Newer successors (report only)

- google/gemini-3.5-flash-lite: Research names gemini-3.6-flash and gemini-3.8-flash as successors of gemini-3.5-flash. Routed id unchanged.
- x-ai/grok-4.7: Live dark-creative id. Dated alias x-ai/grok-4.7-20260916. The id is on the OpenRouter list (T1). Adapter style stays T2. x-ai/grok-4 is not on the list.
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

## Token caps

- x-ai/grok-4.7 lists max_tokens, reasoning, and reasoning_effort. Reasoning is mandatory. The lowest effort is low and the default is high. postFalRouterChat forwards max_tokens. The first smoke sent 400 and was billed 1158 completion tokens with finish reason stop. The low-effort re-smoke was billed 977 and 806 completion tokens, still above 400, and the usage payload did not report a separate reasoning count. The cost estimate adds 577 completion tokens, the larger low-effort overrun.
- anthropic/claude-sonnet-5 lists max_tokens and max_completion_tokens. Reasoning defaults on at high and can be low. Anthropic requires max_tokens above the reasoning budget, and a reasoning.max_tokens budget is at least 1024.
- anthropic/claude-opus-5.5 lists the same token fields. Reasoning is mandatory, default high, lowest low.
- google/gemini-3.5-flash-lite lists max_tokens. Reasoning is mandatory. The lowest effort is minimal, and that is the default. A reasoning.max_tokens value is mapped to a thinking level, not a hard token cap.
- openai/gpt-6-luna and openai/gpt-6-sol list max_tokens. Reasoning defaults on. none is allowed. openai/gpt-6-astra reasoning is mandatory and its lowest effort is low.

## Proposed diff

None. Routed ids stay as they are.
