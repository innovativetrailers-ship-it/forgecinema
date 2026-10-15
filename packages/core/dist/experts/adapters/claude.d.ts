import { type ExpertRole } from '../validate';
export interface ClaudeImage {
    mediaType: string;
    data: string;
    label: string;
}
export interface ClaudeExpertRequest {
    system: string;
    messages: Array<{
        role: 'user';
        content: Array<{
            type: 'image';
            source: {
                type: 'base64';
                media_type: string;
                data: string;
            };
        } | {
            type: 'text';
            text: string;
        }>;
    }>;
    output_config: {
        format: {
            type: 'json_schema';
            schema: unknown;
        };
    };
    max_tokens: number;
    openrouter: Record<string, unknown>;
}
/** System role, XML sections, images before text. No prefill. No sampling params. */
export declare function buildClaudeRequest(role: ExpertRole, input: {
    text: string;
    images?: ClaudeImage[];
    maxTokens?: number;
}): ClaudeExpertRequest;
export type ClaudeStop = {
    kind: 'ok';
    text: string;
} | {
    kind: 'refusal';
} | {
    kind: 'truncated';
};
/** refusal and max_tokens both arrive as HTTP 200. */
export declare function parseClaudeStop(body: {
    stop_reason?: string;
    content?: Array<{
        text?: string;
    }>;
}): ClaudeStop;
