"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportModelVerification = reportModelVerification;
const routing_1 = require("../../llm/routing");
const registry_1 = require("./registry");
const SUCCESSORS = [
    {
        routed: 'google/gemini-3.5-flash-lite',
        note: 'Research names gemini-3.6-flash and gemini-3.8-flash as successors of gemini-3.5-flash. Routed id unchanged.',
    },
    {
        routed: 'x-ai/grok-4.7',
        note: 'Live dark-creative id. Dated alias x-ai/grok-4.7-20260916. The id is on the OpenRouter list (T1). Adapter style stays T2. x-ai/grok-4 is not on the list.',
    },
    {
        routed: 'openai/gpt-6-astra',
        note: 'Research names openai/gpt-6.1-sol as the newer GPT-6. Routed id unchanged.',
    },
    {
        routed: 'openai/gpt-6-sol',
        note: 'Research names openai/gpt-6.1-sol. Routed id unchanged.',
    },
    {
        routed: 'openai/gpt-6-luna',
        note: 'Research names openai/gpt-6.1-sol. Routed id unchanged.',
    },
];
/** Turns fetched lists into the report. The script performs the fetches. */
function reportModelVerification(input) {
    const missing = [];
    const deprecated = [];
    const lines = [
        '# Model verification 2026-10-16',
        '',
        'DARK_CREATIVE is x-ai/grok-4.7. Other routed ids are unchanged. Gemini, GPT, and Haiku successor notes stay proposals.',
        '',
        '## Language routes',
        '',
    ];
    if (!input.listed) {
        const message = input.listError || 'model list missing';
        console.warn('[model-verify]', message);
        lines.push(`- The model list could not be read: ${message}`);
        missing.push('openrouter-list');
    }
    else {
        const rows = new Map(input.listed.map((row) => [row.id, row]));
        for (const id of (0, routing_1.routedModelIds)()) {
            const row = rows.get(id);
            if (!row) {
                missing.push(id);
                lines.push(`- MISSING ${id}`);
                continue;
            }
            if (row.deprecated) {
                deprecated.push(id);
                lines.push(`- DEPRECATED ${id}`);
                continue;
            }
            lines.push(`- present ${id}`);
        }
        lines.push('', '## Newer successors (report only)', '');
        for (const item of SUCCESSORS) {
            if ((0, routing_1.routedModelIds)().includes(item.routed))
                lines.push(`- ${item.routed}: ${item.note}`);
        }
        lines.push('- Claude Haiku 4.5 is not a routed id. Research names Haiku 5.5. No change.');
    }
    lines.push('', '## Video registry against catalogued endpoints', '');
    const byId = new Map(input.endpoints.map((row) => [row.registryId, row.note]));
    for (const entry of registry_1.VIDEO_EXPERT_REGISTRY) {
        const key = (0, registry_1.registryKey)(entry);
        if (entry.status === 'retired') {
            lines.push(`- ${key} retired, not fetched`);
            continue;
        }
        lines.push(`- ${key} ${byId.get(key) ?? 'no schema note'}`);
    }
    lines.push('', '## Unverified fields', '');
    for (const field of (0, registry_1.unverifiedRegistryFields)()) {
        lines.push(`- ${field.id} ${field.field} (${field.source_tier})`);
    }
    lines.push('', '## Token caps', '');
    lines.push('- x-ai/grok-4.7 lists max_tokens, reasoning, and reasoning_effort. Reasoning is mandatory. The lowest effort is low and the default is high. postFalRouterChat forwards max_tokens. The first smoke sent 400 and was billed 1158 completion tokens with finish reason stop. The low-effort re-smoke was billed 977 and 806 completion tokens, still above 400, and the usage payload did not report a separate reasoning count. The cost estimate adds 577 completion tokens, the larger low-effort overrun.');
    lines.push('- anthropic/claude-sonnet-5 lists max_tokens and max_completion_tokens. Reasoning defaults on at high and can be low. Anthropic requires max_tokens above the reasoning budget, and a reasoning.max_tokens budget is at least 1024.');
    lines.push('- anthropic/claude-opus-5.5 lists the same token fields. Reasoning is mandatory, default high, lowest low.');
    lines.push('- google/gemini-3.5-flash-lite lists max_tokens. Reasoning is mandatory. The lowest effort is minimal, and that is the default. A reasoning.max_tokens value is mapped to a thinking level, not a hard token cap.');
    lines.push('- openai/gpt-6-luna and openai/gpt-6-sol list max_tokens. Reasoning defaults on. none is allowed. openai/gpt-6-astra reasoning is mandatory and its lowest effort is low.');
    lines.push('', '## Proposed diff', '');
    if (!missing.length && !deprecated.length) {
        lines.push('None. Routed ids stay as they are.', '');
    }
    else {
        lines.push('Not applied. Neo decides.', '');
        for (const id of missing) {
            const successor = id === 'x-ai/grok-4' ? ' Research names x-ai/grok-4.7.' : '';
            lines.push(`- ${id} is missing from the model list.${successor}`);
        }
        for (const id of deprecated)
            lines.push(`- ${id} is marked deprecated.`);
        lines.push('');
    }
    return { markdown: lines.join('\n'), missing, deprecated };
}
//# sourceMappingURL=verify.js.map