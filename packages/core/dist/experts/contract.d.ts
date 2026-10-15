import { type ExpertRole } from './validate';
export declare const CONTRACT_INSTRUCTION = "Return only JSON with exactly these keys; no extra keys.";
/**
 * The 2026-10-16 smoke sent max_tokens 400 and was billed 1158 completion
 * tokens at Grok's default effort (high), finish reason stop. Reasoning is
 * mandatory on that model and was not inside the cap. OpenRouter's effort
 * table assigns low about 20% of the budget and high about 80%. That guess was
 * 190. The low-effort re-smoke still billed 977 completion tokens, 577 above
 * the 400 cap. The allowance is that observed overrun.
 */
export declare const GROK_REASONING_ALLOWANCE = 577;
export declare function roleExample(role: ExpertRole): unknown;
export declare function requiredTopLevelKeys(role: ExpertRole): string[];
export declare function renderRoleContract(role: ExpertRole): string;
export declare function expertRepairMessage(issues: string[]): string;
