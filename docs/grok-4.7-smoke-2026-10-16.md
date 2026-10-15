# Grok 4.7 smoke 2026-10-16

One call through the language router. Max tokens 400.

- Model: `x-ai/grok-4.7`. Alias on the list: `x-ai/grok-4.7-20260916`. `x-ai/grok-4` is not on the list and is not an alias of 4.7.
- List price: prompt USD 2 / million, completion USD 6 / million. AUD uses 1 USD = 1.4331 AUD from the pricing table (Frankfurter 2026-10-13).
- Before: USD 0.002898 / AUD 0.004153.
- After: USD 0.009926 / AUD 0.014225. Prompt tokens 1489, completion tokens 1158. The request sent max_tokens 400. The provider reported 1158 completion tokens and finish reason stop.
- Finish reason: stop.
- Refusal: no.
- Director schema: invalid (scene_id: Invalid input: expected string, received undefined; intent: Invalid input: expected string, received undefined; shots.0.shot_id: Invalid input: expected string, received undefined; shots.0.duration_s: Invalid input: expected number, received undefined; shots.0.subject: Invalid input: expected string, received undefined; shots.0.action: Invalid input: expected string, received undefined; shots.0.setting: Invalid input: expected string, received undefined; shots.0.audio: Invalid input: expected object, received undefined; shots.0.references: Invalid input: expected array, received undefined; shots.0.continuity: Invalid input: expected object, received undefined; shots.0.avoid: Invalid input: expected array, received undefined; coverage_notes: Invalid input: expected string, received undefined).

## Transcript summary

{"coverage_plan":"Single shot only. Hold the line on the keeper’s climb; no angle change, no cut.","shot_order":[1],"shots":[{"order":1,"idea":"The keeper climbs, stops, and finds the lamp still burning.","must_show":"The keeper climbs the dark stair as the storm hits the tower, stops, turns his look up the stair, and the burning lamp fills the end of the shot.","emotional_intent":"He expects the light to be out and instead meets it still burning.","performance_notes":"Climb with effort. Stop. Lift the eyes to the lamp. Do not speak. Let the look land and hold.","eyeline":"His look travels up the stair to the lamp; the shot ends on that match.","line_and_angle":"One camera position. No second angle, so the 180 and the 30-degree rule stay uncrossed.","setup_for_next":"End on the burning lamp, which pulls the next scene toward whoever must answer that light."}]}

## Run 54

max_tokens was forwarded. The field name on this route is max_tokens, which OpenRouter lists for x-ai/grok-4.7. The first smoke billed 1158 completion tokens against a cap of 400 with finish reason stop, so reasoning was outside the cap. Reasoning is mandatory and the default effort is high. This run sends reasoning_effort low. The before-cost uses cap 400 plus a 190-token allowance.

- Schema call: After: USD 0.011192 / AUD 0.016039. Prompt tokens 2665, completion tokens 977, reasoning tokens unreported. Finish stop.
- Schema result: valid. Refusal: no.
- Repair was not needed.
- Accepted. Schema valid. After: USD 0.010164 / AUD 0.014566. Prompt tokens 2664, completion tokens 806, reasoning tokens unreported. Finish stop.
- Live calls this run: 2.
- The before-cost used a 190-token allowance. The low-effort bills were 977 and 806 completion tokens, so the allowance is now 577, the larger overrun above the 400 cap. Fal's usage shape did not include a separate reasoning count.

{"scene_id":"S03","intent":"The keeper climbs, stops, and sees the lamp still burning.","shots":[{"shot_id":"S03-01","duration_s":8,"subject":"lighthouse keeper on the stair","action":"climbs the dark stair, stops, and looks up at the lamp still burning","setting":"lighthouse stairwell at night, storm outside","audio":{"dialogue":[],"sfx":["footsteps on stone","rain on the tower"],"ambience":"storm","music":false},"references":[],"continuity":{"carries_from":null,"screen_direction":"upward","props":["burning lamp"]},"avoid":["text on screen","sexual content","real-person depiction"]}],"coverage_notes":"Single shot: establish the stair in the storm, then the keeper climbs, stops, and looks up so the burning lamp ends the scene and sets up the next."}
