/**
 * Brain task → FAL OpenRouter model id. One table. Video delegate does not
 * read this. Open-weight bases are pinned and are not entries here.
 * Verified router family 2026-09-28: openrouter/router, /vision, /openai/v1/chat/completions.
 */
export type BrainTask = 'mechanical' | 'delegation' | 'script' | 'scene' | 'character' | 'asset' | 'training' | 'premise';
export type BrainTone = 'dark' | 'polished' | 'neutral';
export type BrainBudget = 'tight' | 'standard';
export interface BrainRoute {
    primary: string;
    fallbacks: string[];
}
/**
 * Creative tier. Live on OpenRouter 2026-09-29: anthropic/claude-sonnet-5.
 * Blockbuster breakdown may opt into MAX_QUALITY_BREAKDOWN_MODEL.
 */
export declare const CREATIVE_TIER_MODEL = "anthropic/claude-sonnet-5";
export declare const MAX_QUALITY_BREAKDOWN_MODEL = "anthropic/claude-opus-5.5";
export declare const BRAIN_ROUTES: Record<BrainTask, BrainRoute>;
/** Open-weight bases stay pinned. This map must not route to or replace them. */
export declare const OPEN_WEIGHT_ROUTE_PIN: {
    readonly class: "open-weight-base";
    readonly pinned: true;
};
export declare const OPEN_WEIGHT_MODEL_IDS: readonly ["wan-2.2", "fal-ai/wan/v2.2-a14b/text-to-video", "fal-ai/wan/v2.2-5b/text-to-video", "fal-ai/wan-22-trainer"];
export declare function approvedRouteFor(task: BrainTask): string | undefined;
/** Human approval only. Refuses an open-weight id. */
export declare function applyApprovedRoute(task: BrainTask, model: string): void;
/** Dated alias on the OpenRouter list. Presence of the id is T1. The adapter row stays T2. */
export declare const DARK_CREATIVE_ALIAS = "x-ai/grok-4.7-20260916";
export interface BrainModelChoice {
    model: string;
    task: BrainTask;
    substituted: boolean;
    reason: string;
}
export declare function llmModelForTask(task: BrainTask, opts?: {
    tone?: BrainTone;
    budget?: BrainBudget;
}): BrainModelChoice;
/** Every id this table can send. Verification reads this. It does not change the table. */
export declare function routedModelIds(): string[];
/** Logged on every expert-brief call. The version is the brief's BRIEF_VERSION. */
export declare function logExpertBrief(role: string, version: string): void;
export declare class ModelUnavailableError extends Error {
    readonly role: string;
    readonly modelId: string;
    readonly reason: string;
    constructor(role: string, modelId: string, reason: string);
}
/** Test and startup hook. Replaces the on-disk verification cache. */
export declare function applyVerificationCache(missing: readonly string[]): void;
export declare function resetVerificationCache(): void;
/** Throws when the verification cache marks this id missing. Does not pick another model. */
export declare function assertModelAvailable(role: string, modelId: string): void;
