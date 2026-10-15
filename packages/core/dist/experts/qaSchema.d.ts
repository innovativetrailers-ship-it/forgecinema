import { z } from 'zod';
/**
 * Superset of the previous QA inspector fields.
 * quality_score, description_match, physics_accuracy, character_accuracy,
 * issues_found, needs_repaint, repaint_regions, and accept stay.
 * Scores are bands 1–5. Client validation clamps them; the schema does not.
 */
export declare const repaintRegionSchema: z.ZodObject<{
    description: z.ZodString;
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    start_time: z.ZodNumber;
    end_time: z.ZodNumber;
    repair_prompt: z.ZodString;
    suggested_repair_model: z.ZodString;
}, z.core.$strip>;
export declare const qaDefectSchema: z.ZodObject<{
    category: z.ZodString;
    evidence: z.ZodString;
    frames: z.ZodOptional<z.ZodArray<z.ZodString>>;
    t_start: z.ZodOptional<z.ZodNumber>;
    t_end: z.ZodOptional<z.ZodNumber>;
    present: z.ZodBoolean;
    confirmed: z.ZodBoolean;
    severity: z.ZodString;
    region: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        w: z.ZodNumber;
        h: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const qaOutputSchema: z.ZodObject<{
    quality_score: z.ZodNumber;
    description_match: z.ZodNumber;
    physics_accuracy: z.ZodNumber;
    character_accuracy: z.ZodNumber;
    defects: z.ZodDefault<z.ZodArray<z.ZodObject<{
        category: z.ZodString;
        evidence: z.ZodString;
        frames: z.ZodOptional<z.ZodArray<z.ZodString>>;
        t_start: z.ZodOptional<z.ZodNumber>;
        t_end: z.ZodOptional<z.ZodNumber>;
        present: z.ZodBoolean;
        confirmed: z.ZodBoolean;
        severity: z.ZodString;
        region: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            w: z.ZodNumber;
            h: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    issues_found: z.ZodDefault<z.ZodArray<z.ZodString>>;
    needs_repaint: z.ZodBoolean;
    repaint_regions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
        start_time: z.ZodNumber;
        end_time: z.ZodNumber;
        repair_prompt: z.ZodString;
        suggested_repair_model: z.ZodString;
    }, z.core.$strip>>>;
    accept: z.ZodBoolean;
}, z.core.$strip>;
export type QaOutput = z.infer<typeof qaOutputSchema>;
export type QaDefect = z.infer<typeof qaDefectSchema>;
export declare const QA_JSON_SCHEMA: {
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["quality_score", "description_match", "physics_accuracy", "character_accuracy", "defects", "issues_found", "needs_repaint", "repaint_regions", "accept"];
    readonly properties: {
        readonly quality_score: {
            readonly type: "number";
        };
        readonly description_match: {
            readonly type: "number";
        };
        readonly physics_accuracy: {
            readonly type: "number";
        };
        readonly character_accuracy: {
            readonly type: "number";
        };
        readonly defects: {
            readonly type: "array";
        };
        readonly issues_found: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
        readonly needs_repaint: {
            readonly type: "boolean";
        };
        readonly repaint_regions: {
            readonly type: "array";
        };
        readonly accept: {
            readonly type: "boolean";
        };
    };
};
export interface QaValidation {
    ok: boolean;
    value?: QaOutput;
    issues: string[];
}
/** Clamp ranges. Reject zero-area boxes. A defect with no frame or time is unconfirmed. */
export declare function validateQaOutput(raw: unknown, clipDurationS?: number): QaValidation;
