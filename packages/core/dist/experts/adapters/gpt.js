"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGptRequest = buildGptRequest;
const routing_1 = require("../../llm/routing");
const openrouter_1 = require("./openrouter");
const boxes_1 = require("../boxes");
const validate_1 = require("../validate");
/** Text fallback. Sampling params are removed unless effort is none. No boxes. */
function buildGptRequest(role, input) {
    if (input.boxes)
        throw new boxes_1.BoxConversionError('GPT-6 is text fallback only and does not localise boxes');
    const brief = validate_1.ROLE_BRIEFS[role];
    (0, routing_1.logExpertBrief)(role, brief.version);
    const effort = input.effort ?? 'low';
    const request = {
        messages: [
            { role: 'system', content: `${brief.identity}\n${brief.scope}\n${brief.craft}` },
            { role: 'user', content: input.text },
        ],
        reasoning_effort: effort,
        openrouter: (0, openrouter_1.openRouterEnvelope)(brief.outputSchema),
    };
    if (effort === 'none')
        request.temperature = input.temperature;
    return request;
}
//# sourceMappingURL=gpt.js.map