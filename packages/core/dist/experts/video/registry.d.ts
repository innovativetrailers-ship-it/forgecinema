import { z } from 'zod';
/** Parameter layer. One row per model and gateway. Layer 2 live endpoints still override this seed. */
export declare const sourceTierSchema: z.ZodEnum<{
    T1: "T1";
    T2: "T2";
    T3: "T3";
    U: "U";
}>;
export declare const registryStatusSchema: z.ZodEnum<{
    unverified: "unverified";
    live: "live";
    retired: "retired";
}>;
export declare const negativeModeSchema: z.ZodEnum<{
    field: "field";
    prose: "prose";
    never: "never";
}>;
export declare const videoRegistryEntrySchema: z.ZodObject<{
    id: z.ZodString;
    gateway: z.ZodString;
    version: z.ZodString;
    durations: z.ZodArray<z.ZodNumber>;
    aspects: z.ZodArray<z.ZodString>;
    resolutions: z.ZodArray<z.ZodString>;
    fps: z.ZodNullable<z.ZodNumber>;
    maxReferences: z.ZodNumber;
    referenceSyntax: z.ZodString;
    negative: z.ZodEnum<{
        field: "field";
        prose: "prose";
        never: "never";
    }>;
    dialogue: z.ZodEnum<{
        none: "none";
        kling: "kling";
        prose: "prose";
        quoted: "quoted";
    }>;
    audio: z.ZodBoolean;
    durationEncoding: z.ZodEnum<{
        number: "number";
        "seconds-string": "seconds-string";
    }>;
    source_tier: z.ZodEnum<{
        T1: "T1";
        T2: "T2";
        T3: "T3";
        U: "U";
    }>;
    verified_at: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        unverified: "unverified";
        live: "live";
        retired: "retired";
    }>;
    wordCap: z.ZodNullable<z.ZodNumber>;
    charCap: z.ZodNullable<z.ZodNumber>;
    catalogKey: z.ZodNullable<z.ZodString>;
    knowledgeId: z.ZodNullable<z.ZodString>;
    uncertain: z.ZodArray<z.ZodString>;
    paramNames: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type VideoRegistryEntry = z.infer<typeof videoRegistryEntrySchema>;
export type NegativeMode = z.infer<typeof negativeModeSchema>;
export declare const VIDEO_EXPERT_REGISTRY: VideoRegistryEntry[];
export declare function registryKey(entry: Pick<VideoRegistryEntry, 'id' | 'gateway'>): string;
export declare function findVideoRegistry(modelKey: string): VideoRegistryEntry | undefined;
export declare function expertSeedForKnowledge(knowledgeId: string): {
    registryId: string;
    maxDuration: number | null;
    negative: VideoRegistryEntry['negative'];
    sourceTier: VideoRegistryEntry['source_tier'];
    status: VideoRegistryEntry['status'];
} | null;
export declare function unverifiedRegistryFields(): Array<{
    id: string;
    field: string;
    source_tier: 'U' | 'T2' | 'T3';
}>;
