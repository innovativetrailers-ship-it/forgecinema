import { type ExpertRole } from '../validate';
export interface GrokLimits {
    genre: string;
    pointOfView: string;
    intensityCeiling: string;
    contentLimits: string;
}
export interface GrokExpertRequest {
    source_tier: 'T2';
    messages: Array<{
        role: 'system' | 'user';
        content: string;
    }>;
    response_format: {
        type: 'json_schema';
        json_schema: {
            name: string;
            schema: unknown;
        };
    };
    openrouter: Record<string, unknown>;
}
/** Genre, point of view, intensity, and limits. No blanket shock line. Flagged T2 until verified. */
export declare function buildGrokRequest(role: ExpertRole, input: {
    text: string;
    limits?: Partial<GrokLimits>;
}): GrokExpertRequest;
