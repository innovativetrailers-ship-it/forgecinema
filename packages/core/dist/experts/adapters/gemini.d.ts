import { type ExpertRole } from '../validate';
export interface GeminiExpertRequest {
    contents: Array<{
        role: 'user';
        parts: Array<{
            fileData: {
                mimeType: string;
                fileUri: string;
            };
            videoMetadata: {
                fps: number;
            };
        } | {
            text: string;
        }>;
    }>;
    generationConfig: {
        responseSchema: unknown;
    };
    openrouter: Record<string, unknown>;
}
declare function mmss(seconds: number): string;
/** Video first, then text. Timestamps are MM:SS. fps is configurable. */
export declare function buildGeminiRequest(role: ExpertRole, input: {
    text: string;
    videoUri: string;
    mimeType?: string;
    fps?: number;
    atSeconds?: number[];
}): GeminiExpertRequest;
export { mmss as formatGeminiTimestamp };
