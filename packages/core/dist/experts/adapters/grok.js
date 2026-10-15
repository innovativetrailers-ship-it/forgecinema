"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGrokRequest = buildGrokRequest;
const routing_1 = require("../../llm/routing");
const contract_1 = require("../contract");
const openrouter_1 = require("./openrouter");
const validate_1 = require("../validate");
const DEFAULT_LIMITS = {
    genre: 'dramatic fiction',
    pointOfView: 'third person',
    intensityCeiling: 'mature drama, no sexual content involving minors, no real-person sexual or defamatory depiction',
    contentLimits: 'Stay inside the stated genre. Do not raise intensity past the ceiling.',
};
/** Genre, point of view, intensity, and limits. No blanket shock line. Flagged T2 until verified. */
function buildGrokRequest(role, input) {
    const brief = validate_1.ROLE_BRIEFS[role];
    (0, routing_1.logExpertBrief)(role, brief.version);
    const limits = { ...DEFAULT_LIMITS, ...input.limits };
    const system = [
        brief.identity,
        `Genre: ${limits.genre}`,
        `Point of view: ${limits.pointOfView}`,
        `Intensity ceiling: ${limits.intensityCeiling}`,
        `Content limits: ${limits.contentLimits}`,
        brief.scope,
        brief.craft,
        (0, contract_1.renderRoleContract)(role),
    ].join('\n');
    if (/edgy|not afraid to offend/i.test(system)) {
        throw new Error('Grok brief must not use a blanket shock line');
    }
    const schema = brief.outputSchema;
    return {
        source_tier: 'T2',
        reasoning_effort: 'low',
        messages: [
            { role: 'system', content: system },
            { role: 'user', content: input.text },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'expert_output', strict: true, schema } },
        openrouter: (0, openrouter_1.openRouterEnvelope)(schema),
    };
}
//# sourceMappingURL=grok.js.map