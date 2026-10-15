"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHOT_SPEC_JSON_SCHEMA = exports.shotSpecSchema = exports.dialogueLineSchema = exports.cameraSchema = void 0;
const zod_1 = require("zod");
/** Canonical shot spec. Technical fields are optional so the director can omit them. */
exports.cameraSchema = zod_1.z.object({
    size: zod_1.z.string().min(1),
    angle: zod_1.z.string().min(1),
    lens_mm: zod_1.z.number(),
    move: zod_1.z.string().min(1),
    pace: zod_1.z.string().min(1),
});
exports.dialogueLineSchema = zod_1.z.object({
    speaker: zod_1.z.string().min(1),
    voice: zod_1.z.string().min(1),
    line: zod_1.z.string().min(1),
});
exports.shotSpecSchema = zod_1.z.object({
    shot_id: zod_1.z.string().min(1),
    duration_s: zod_1.z.number().positive(),
    subject: zod_1.z.string().min(1),
    action: zod_1.z.string().min(1),
    setting: zod_1.z.string().min(1),
    camera: exports.cameraSchema.optional(),
    lighting: zod_1.z.string().optional(),
    grade: zod_1.z.string().optional(),
    audio: zod_1.z.object({
        dialogue: zod_1.z.array(exports.dialogueLineSchema),
        sfx: zod_1.z.array(zod_1.z.string()),
        ambience: zod_1.z.string(),
        music: zod_1.z.boolean(),
    }),
    references: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().min(1),
        role: zod_1.z.string().min(1),
    })),
    continuity: zod_1.z.object({
        carries_from: zod_1.z.string().nullable(),
        screen_direction: zod_1.z.string(),
        props: zod_1.z.array(zod_1.z.string()),
    }),
    avoid: zod_1.z.array(zod_1.z.string()),
});
exports.SHOT_SPEC_JSON_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['shot_id', 'duration_s', 'subject', 'action', 'setting', 'audio', 'references', 'continuity', 'avoid'],
    properties: {
        shot_id: { type: 'string' },
        duration_s: { type: 'number' },
        subject: { type: 'string' },
        action: { type: 'string' },
        setting: { type: 'string' },
        camera: {
            type: 'object',
            properties: {
                size: { type: 'string' },
                angle: { type: 'string' },
                lens_mm: { type: 'number' },
                move: { type: 'string' },
                pace: { type: 'string' },
            },
        },
        lighting: { type: 'string' },
        grade: { type: 'string' },
        audio: { type: 'object' },
        references: { type: 'array' },
        continuity: { type: 'object' },
        avoid: { type: 'array', items: { type: 'string' } },
    },
};
//# sourceMappingURL=shotSpec.js.map