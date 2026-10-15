"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildClaudeRequest = buildClaudeRequest;
exports.parseClaudeStop = parseClaudeStop;
const routing_1 = require("../../llm/routing");
const contract_1 = require("../contract");
const openrouter_1 = require("./openrouter");
const validate_1 = require("../validate");
const NO_SAMPLING = ['temperature', 'top_p', 'top_k'];
/** System role, XML sections, images before text. No prefill. No sampling params. */
function buildClaudeRequest(role, input) {
    const brief = validate_1.ROLE_BRIEFS[role];
    (0, routing_1.logExpertBrief)(role, brief.version);
    const images = input.images ?? [];
    const content = [];
    for (const image of images) {
        content.push({
            type: 'image',
            source: { type: 'base64', media_type: image.mediaType, data: image.data },
        });
    }
    const labels = images.map((image) => image.label).join('\n');
    content.push({
        type: 'text',
        text: [labels, input.text].filter(Boolean).join('\n\n'),
    });
    const system = [
        brief.identity,
        `<scope>${brief.scope}</scope>`,
        `<craft>${brief.craft}</craft>`,
        `<failures>${brief.failureModes}</failures>`,
        '<output>Return JSON for the schema. Ask for evidence. Do not add a field named reasoning.</output>',
        (0, contract_1.renderRoleContract)(role),
    ].join('\n');
    const request = {
        system,
        messages: [{ role: 'user', content }],
        output_config: { format: { type: 'json_schema', schema: brief.outputSchema } },
        max_tokens: input.maxTokens ?? 2048,
        openrouter: (0, openrouter_1.openRouterEnvelope)(brief.outputSchema),
    };
    for (const key of NO_SAMPLING) {
        if (key in request)
            throw new Error(`Claude request must not send ${key}`);
    }
    return request;
}
/** refusal and max_tokens both arrive as HTTP 200. */
function parseClaudeStop(body) {
    if (body.stop_reason === 'refusal')
        return { kind: 'refusal' };
    if (body.stop_reason === 'max_tokens')
        return { kind: 'truncated' };
    const text = (body.content ?? []).map((block) => block.text ?? '').join('').trim();
    return { kind: 'ok', text };
}
//# sourceMappingURL=claude.js.map