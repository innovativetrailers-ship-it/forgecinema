import type { ShotSpec } from '../shotSpec';
export declare class ModelCompileError extends Error {
    readonly model: string;
    readonly reason: string;
    constructor(model: string, reason: string);
}
export interface CompiledShot {
    prompt: string;
    params: Record<string, unknown>;
    duration_s: number;
}
/** Turn one shot spec into the model's dialect. Retired and unknown models throw. */
export declare function compileShot(shot: ShotSpec, modelKey: string): CompiledShot;
