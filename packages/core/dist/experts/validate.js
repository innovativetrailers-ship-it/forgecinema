"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpertOutputError = exports.ROLE_BRIEFS = exports.EXPERT_ROLES = void 0;
exports.validateRoleOutput = validateRoleOutput;
exports.acceptRoleOutput = acceptRoleOutput;
exports.composeRolePrompt = composeRolePrompt;
const zod_1 = require("zod");
const routing_1 = require("../llm/routing");
const qa_1 = require("./roles/qa");
const director_1 = require("./roles/director");
const cinematographer_1 = require("./roles/cinematographer");
const colourist_1 = require("./roles/colourist");
const editor_1 = require("./roles/editor");
const sound_1 = require("./roles/sound");
const continuity_1 = require("./roles/continuity");
const shotSpec_1 = require("./shotSpec");
const qaSchema_1 = require("./qaSchema");
exports.EXPERT_ROLES = [
    'director',
    'cinematographer',
    'colourist',
    'editor',
    'sound',
    'continuity',
    'qa',
];
exports.ROLE_BRIEFS = {
    director: director_1.directorBrief,
    cinematographer: cinematographer_1.cinematographerBrief,
    colourist: colourist_1.colouristBrief,
    editor: editor_1.editorBrief,
    sound: sound_1.soundBrief,
    continuity: continuity_1.continuityBrief,
    qa: qa_1.qaBrief,
};
const directorOutputSchema = zod_1.z.object({
    scene_id: zod_1.z.string().min(1),
    intent: zod_1.z.string().min(1),
    shots: zod_1.z.array(shotSpec_1.shotSpecSchema).min(1),
    coverage_notes: zod_1.z.string(),
});
const cinematographerOutputSchema = zod_1.z.object({
    shot: shotSpec_1.shotSpecSchema.extend({ camera: shotSpec_1.cameraSchema, lighting: zod_1.z.string().min(1) }),
    risk: zod_1.z.string().min(1),
});
const colouristOutputSchema = zod_1.z.object({
    scene_id: zod_1.z.string().min(1),
    grade: zod_1.z.string().min(1),
    shot_adjustments: zod_1.z.array(zod_1.z.object({ shot_id: zod_1.z.string(), grade: zod_1.z.string() })),
});
const editorOutputSchema = zod_1.z.object({
    timeline: zod_1.z.array(zod_1.z.object({
        shot_id: zod_1.z.string(),
        in_s: zod_1.z.number(),
        out_s: zod_1.z.number(),
        transition: zod_1.z.string(),
        audio_lead_s: zod_1.z.number(),
    })).min(1),
    total_s: zod_1.z.number(),
    pace_curve: zod_1.z.string(),
    flagged_cuts: zod_1.z.array(zod_1.z.object({
        between: zod_1.z.array(zod_1.z.string()),
        rule_broken: zod_1.z.string(),
        fix: zod_1.z.string(),
    })),
});
const soundOutputSchema = zod_1.z.object({
    shot_id: zod_1.z.string().min(1),
    audio: shotSpec_1.shotSpecSchema.shape.audio,
    native_audio: zod_1.z.boolean(),
    sound_plan: zod_1.z.string().nullable(),
});
const continuityOutputSchema = zod_1.z.object({
    shot_id: zod_1.z.string().min(1),
    violations: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.string(),
        expected: zod_1.z.string(),
        found: zod_1.z.string(),
        severity: zod_1.z.string(),
    })),
    pass: zod_1.z.boolean(),
});
const OUTPUT_SCHEMAS = {
    director: directorOutputSchema,
    cinematographer: cinematographerOutputSchema,
    colourist: colouristOutputSchema,
    editor: editorOutputSchema,
    sound: soundOutputSchema,
    continuity: continuityOutputSchema,
};
class ExpertOutputError extends Error {
    role;
    version;
    issues;
    constructor(role, version, issues) {
        super(`Expert output failed for ${role} ${version}: ${issues.join('; ')}`);
        this.name = 'ExpertOutputError';
        this.role = role;
        this.version = version;
        this.issues = issues;
    }
}
exports.ExpertOutputError = ExpertOutputError;
function validateRoleOutput(role, raw, clipDurationS) {
    if (role === 'qa') {
        const qa = (0, qaSchema_1.validateQaOutput)(raw, clipDurationS);
        return qa.ok && qa.value ? { ok: true, value: qa.value } : { ok: false, issues: qa.issues };
    }
    const parsed = OUTPUT_SCHEMAS[role].safeParse(raw);
    if (!parsed.success) {
        return { ok: false, issues: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'output'}: ${issue.message}`) };
    }
    return { ok: true, value: parsed.data };
}
/**
 * One repair on the same route. The repair function is injected so tests
 * spend nothing. A second failure throws. Fields are never invented here.
 */
async function acceptRoleOutput(role, raw, repair, clipDurationS) {
    const brief = exports.ROLE_BRIEFS[role];
    (0, routing_1.logExpertBrief)(role, brief.version);
    const first = validateRoleOutput(role, raw, clipDurationS);
    if (first.ok)
        return first.value;
    console.warn('[expert_repair]', JSON.stringify({ role, version: brief.version, issues: first.issues }));
    let secondRaw;
    try {
        secondRaw = await repair(first.issues);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new ExpertOutputError(role, brief.version, [...first.issues, message]);
    }
    const second = validateRoleOutput(role, secondRaw, clipDurationS);
    if (second.ok)
        return second.value;
    throw new ExpertOutputError(role, brief.version, second.issues);
}
function composeRolePrompt(role) {
    const brief = exports.ROLE_BRIEFS[role];
    return [
        `[expert ${role} ${brief.version}]`,
        brief.identity,
        `Scope: ${brief.scope}`,
        `Craft: ${brief.craft}`,
        `Output schema: ${JSON.stringify(brief.outputSchema)}`,
        `Failure modes: ${brief.failureModes}`,
        'Return only JSON that matches the schema. Do not add a field named reasoning. Use evidence.',
    ].join('\n\n');
}
//# sourceMappingURL=validate.js.map