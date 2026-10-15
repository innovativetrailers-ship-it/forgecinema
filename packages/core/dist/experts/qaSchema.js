"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QA_JSON_SCHEMA = exports.qaOutputSchema = exports.qaDefectSchema = exports.repaintRegionSchema = void 0;
exports.validateQaOutput = validateQaOutput;
const zod_1 = require("zod");
/**
 * Superset of the previous QA inspector fields.
 * quality_score, description_match, physics_accuracy, character_accuracy,
 * issues_found, needs_repaint, repaint_regions, and accept stay.
 * Scores are bands 1–5. Client validation clamps them; the schema does not.
 */
exports.repaintRegionSchema = zod_1.z.object({
    description: zod_1.z.string(),
    x: zod_1.z.number(),
    y: zod_1.z.number(),
    width: zod_1.z.number(),
    height: zod_1.z.number(),
    start_time: zod_1.z.number(),
    end_time: zod_1.z.number(),
    repair_prompt: zod_1.z.string(),
    suggested_repair_model: zod_1.z.string(),
});
exports.qaDefectSchema = zod_1.z.object({
    category: zod_1.z.string(),
    evidence: zod_1.z.string(),
    frames: zod_1.z.array(zod_1.z.string()).optional(),
    t_start: zod_1.z.number().optional(),
    t_end: zod_1.z.number().optional(),
    present: zod_1.z.boolean(),
    confirmed: zod_1.z.boolean(),
    severity: zod_1.z.string(),
    region: zod_1.z.object({
        x: zod_1.z.number(),
        y: zod_1.z.number(),
        w: zod_1.z.number(),
        h: zod_1.z.number(),
    }).optional(),
});
exports.qaOutputSchema = zod_1.z.object({
    quality_score: zod_1.z.number(),
    description_match: zod_1.z.number(),
    physics_accuracy: zod_1.z.number(),
    character_accuracy: zod_1.z.number(),
    defects: zod_1.z.array(exports.qaDefectSchema).default([]),
    issues_found: zod_1.z.array(zod_1.z.string()).default([]),
    needs_repaint: zod_1.z.boolean(),
    repaint_regions: zod_1.z.array(exports.repaintRegionSchema).default([]),
    accept: zod_1.z.boolean(),
});
exports.QA_JSON_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: [
        'quality_score',
        'description_match',
        'physics_accuracy',
        'character_accuracy',
        'defects',
        'issues_found',
        'needs_repaint',
        'repaint_regions',
        'accept',
    ],
    properties: {
        quality_score: { type: 'number' },
        description_match: { type: 'number' },
        physics_accuracy: { type: 'number' },
        character_accuracy: { type: 'number' },
        defects: { type: 'array' },
        issues_found: { type: 'array', items: { type: 'string' } },
        needs_repaint: { type: 'boolean' },
        repaint_regions: { type: 'array' },
        accept: { type: 'boolean' },
    },
};
function clampScore(n) {
    if (!Number.isFinite(n))
        return 1;
    return Math.min(5, Math.max(1, Math.round(n)));
}
function clamp01(n) {
    if (!Number.isFinite(n))
        return 0;
    return Math.min(1, Math.max(0, n));
}
/** Clamp ranges. Reject zero-area boxes. A defect with no frame or time is unconfirmed. */
function validateQaOutput(raw, clipDurationS) {
    const parsed = exports.qaOutputSchema.safeParse(raw);
    if (!parsed.success) {
        return { ok: false, issues: parsed.error.issues.map((issue) => issue.message) };
    }
    const value = {
        ...parsed.data,
        quality_score: clampScore(parsed.data.quality_score),
        description_match: clampScore(parsed.data.description_match),
        physics_accuracy: clampScore(parsed.data.physics_accuracy),
        character_accuracy: clampScore(parsed.data.character_accuracy),
        defects: parsed.data.defects.map((defect) => ({ ...defect })),
        repaint_regions: parsed.data.repaint_regions.map((region) => ({ ...region })),
    };
    const issues = [];
    const limit = clipDurationS != null && clipDurationS > 0 ? clipDurationS : null;
    for (const defect of value.defects) {
        const hasFrame = (defect.frames?.length ?? 0) > 0;
        const hasTime = defect.t_start != null || defect.t_end != null;
        if (!hasFrame && !hasTime)
            defect.confirmed = false;
        if (limit != null) {
            if (defect.t_start != null)
                defect.t_start = Math.min(limit, Math.max(0, defect.t_start));
            if (defect.t_end != null)
                defect.t_end = Math.min(limit, Math.max(0, defect.t_end));
        }
        if (defect.region) {
            defect.region = {
                x: clamp01(defect.region.x),
                y: clamp01(defect.region.y),
                w: clamp01(defect.region.w),
                h: clamp01(defect.region.h),
            };
            if (defect.region.w <= 0 || defect.region.h <= 0) {
                issues.push(`zero-area box on ${defect.category}`);
            }
        }
    }
    for (const region of value.repaint_regions) {
        region.x = clamp01(region.x);
        region.y = clamp01(region.y);
        region.width = clamp01(region.width);
        region.height = clamp01(region.height);
        if (limit != null) {
            region.start_time = Math.min(limit, Math.max(0, region.start_time));
            region.end_time = Math.min(limit, Math.max(0, region.end_time));
        }
        if (region.width <= 0 || region.height <= 0)
            issues.push('zero-area repaint region');
    }
    const confirmed = value.defects.some((defect) => defect.confirmed && defect.present);
    if (!confirmed)
        value.needs_repaint = false;
    if (issues.length)
        return { ok: false, issues };
    return { ok: true, value, issues: [] };
}
//# sourceMappingURL=qaSchema.js.map