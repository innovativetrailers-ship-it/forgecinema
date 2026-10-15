"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGeminiRequest = buildGeminiRequest;
exports.formatGeminiTimestamp = mmss;
const routing_1 = require("../../llm/routing");
const openrouter_1 = require("./openrouter");
const validate_1 = require("../validate");
function mmss(seconds) {
    const whole = Math.max(0, Math.floor(seconds));
    const mm = String(Math.floor(whole / 60)).padStart(2, '0');
    const ss = String(whole % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}
/** Video first, then text. Timestamps are MM:SS. fps is configurable. */
function buildGeminiRequest(role, input) {
    const brief = validate_1.ROLE_BRIEFS[role];
    (0, routing_1.logExpertBrief)(role, brief.version);
    const fps = input.fps ?? 1;
    const marks = (input.atSeconds ?? []).map(mmss).join(', ');
    const text = [
        brief.identity,
        brief.scope,
        input.text,
        marks ? `Confirm these timestamps: ${marks}. Prefer the labelled frame ids.` : '',
        'Boxes, if you return them, use box_2d as [ymin, xmin, ymax, xmax] from 0 to 1000.',
    ].filter(Boolean).join('\n\n');
    return {
        contents: [{
                role: 'user',
                parts: [
                    {
                        fileData: { mimeType: input.mimeType ?? 'video/mp4', fileUri: input.videoUri },
                        videoMetadata: { fps },
                    },
                    { text },
                ],
            }],
        generationConfig: { responseSchema: brief.outputSchema },
        openrouter: (0, openrouter_1.openRouterEnvelope)(brief.outputSchema),
    };
}
//# sourceMappingURL=gemini.js.map