export declare class MissingFalRouterKeyError extends Error {
    constructor();
}
export interface FalRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{
        type: string;
        text?: string;
        image_url?: {
            url: string;
        };
    }>;
}
export interface FalJsonSchemaFormat {
    type: 'json_schema';
    json_schema: {
        name: string;
        strict?: boolean;
        schema: unknown;
    };
}
export type FalReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';
export interface FalRouterChatResult {
    content: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    reasoningTokens: number | null;
    finishReason: string | null;
}
export interface FalRouterChatInput {
    model: string;
    messages: FalRouterMessage[];
    maxTokens?: number;
    temperature?: number;
    source: string;
    /** Live web search on the text router. Vision calls ignore this. */
    webSearch?: boolean;
    ignorePause?: boolean;
    falKey?: string;
    timeoutMs?: number;
    /** OpenAI JSON mode, or a strict schema when the model lists structured outputs. */
    responseFormat?: 'json_object' | FalJsonSchemaFormat;
    /** Lowest effort the model allows when reasoning is billed outside max_tokens. */
    reasoningEffort?: FalReasoningEffort;
}
/**
 * One LLM egress. Message-shaped calls use the OpenAI-compatible router.
 * Image parts use the vision family. Auth is FAL_KEY. Pause matches video.
 */
export declare function postFalRouterChat(input: FalRouterChatInput, fetchImpl?: typeof fetch): Promise<FalRouterChatResult>;
