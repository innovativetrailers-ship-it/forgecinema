import { z } from 'zod';
/** Canonical shot spec. Technical fields are optional so the director can omit them. */
export declare const cameraSchema: z.ZodObject<{
    size: z.ZodString;
    angle: z.ZodString;
    lens_mm: z.ZodNumber;
    move: z.ZodString;
    pace: z.ZodString;
}, z.core.$strip>;
export declare const dialogueLineSchema: z.ZodObject<{
    speaker: z.ZodString;
    voice: z.ZodString;
    line: z.ZodString;
}, z.core.$strip>;
export declare const shotSpecSchema: z.ZodObject<{
    shot_id: z.ZodString;
    duration_s: z.ZodNumber;
    subject: z.ZodString;
    action: z.ZodString;
    setting: z.ZodString;
    camera: z.ZodOptional<z.ZodObject<{
        size: z.ZodString;
        angle: z.ZodString;
        lens_mm: z.ZodNumber;
        move: z.ZodString;
        pace: z.ZodString;
    }, z.core.$strip>>;
    lighting: z.ZodOptional<z.ZodString>;
    grade: z.ZodOptional<z.ZodString>;
    audio: z.ZodObject<{
        dialogue: z.ZodArray<z.ZodObject<{
            speaker: z.ZodString;
            voice: z.ZodString;
            line: z.ZodString;
        }, z.core.$strip>>;
        sfx: z.ZodArray<z.ZodString>;
        ambience: z.ZodString;
        music: z.ZodBoolean;
    }, z.core.$strip>;
    references: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        role: z.ZodString;
    }, z.core.$strip>>;
    continuity: z.ZodObject<{
        carries_from: z.ZodNullable<z.ZodString>;
        screen_direction: z.ZodString;
        props: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    avoid: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type ShotSpec = z.infer<typeof shotSpecSchema>;
export type CameraSpec = z.infer<typeof cameraSchema>;
export declare const SHOT_SPEC_JSON_SCHEMA: {
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["shot_id", "duration_s", "subject", "action", "setting", "audio", "references", "continuity", "avoid"];
    readonly properties: {
        readonly shot_id: {
            readonly type: "string";
        };
        readonly duration_s: {
            readonly type: "number";
        };
        readonly subject: {
            readonly type: "string";
        };
        readonly action: {
            readonly type: "string";
        };
        readonly setting: {
            readonly type: "string";
        };
        readonly camera: {
            readonly type: "object";
            readonly properties: {
                readonly size: {
                    readonly type: "string";
                };
                readonly angle: {
                    readonly type: "string";
                };
                readonly lens_mm: {
                    readonly type: "number";
                };
                readonly move: {
                    readonly type: "string";
                };
                readonly pace: {
                    readonly type: "string";
                };
            };
        };
        readonly lighting: {
            readonly type: "string";
        };
        readonly grade: {
            readonly type: "string";
        };
        readonly audio: {
            readonly type: "object";
        };
        readonly references: {
            readonly type: "array";
        };
        readonly continuity: {
            readonly type: "object";
        };
        readonly avoid: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
    };
};
