import { type ExpertRole } from '../validate';
export type GptEffort = 'none' | 'low' | 'medium' | 'high' | 'max';
export interface GptExpertRequest {
    messages: Array<{
        role: 'system' | 'user';
        content: string;
    }>;
    reasoning_effort: GptEffort;
    temperature?: number;
    top_p?: number;
    top_logprobs?: number;
    openrouter: Record<string, unknown>;
}
/** Text fallback. Sampling params are removed unless effort is none. No boxes. */
export declare function buildGptRequest(role: ExpertRole, input: {
    text: string;
    effort?: GptEffort;
    temperature?: number;
    boxes?: boolean;
}): GptExpertRequest;
