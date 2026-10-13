/**
 * The only fal price table. Figures are copied from each model's llms.txt
 * Pricing section on 2026-10-14. A row with neither usdPerSecond nor a
 * per-video schedule is not sellable.
 */
export declare const FAL_COST_VERIFIED_ON = "2026-10-14";
export declare const PRICE_MARKUP = 1.5;
/** Monthly credit grants. Free is a one-time trial, not a subscription rate. */
export declare const PLAN_MONTHLY_CREDITS: {
    readonly pro: 500;
    readonly studio: 2000;
    readonly ultimate: 6000;
};
export declare const FREE_TRIAL_CREDITS = 50;
export interface FalCostParams {
    resolution?: string;
    generateAudio?: boolean;
    duration?: string;
}
export interface FalCostRow {
    modelKey: string;
    endpointId: string;
    params: FalCostParams;
    /** Dollars per billed second at the params Forge sends, when the page prices that way. */
    usdPerSecond?: number;
    /** Dollars for one clip when the page prices a fixed length, not a rate. */
    usdPerVideo?: number;
    source: string;
    verifiedOn: string;
    note: string;
}
export declare const FAL_COSTS: readonly FalCostRow[];
export declare function falCostRow(modelKey: string): FalCostRow | undefined;
export declare function hasFalPrice(modelKey: string): boolean;
export declare function creditFloorUsd(): number;
/** Seconds fal will bill for the length Forge submits. */
export declare function billedSecondsFor(modelKey: string, requestedSeconds: number): number;
export declare function falUsdCost(modelKey: string, billedSeconds: number, params?: FalCostParams): number;
export declare function creditsForFalCost(usd: number): number;
export declare function creditsForRequest(modelKey: string, requestedSeconds: number, params?: FalCostParams): number;
export interface PlanMargin {
    planId: string;
    usdPerCredit: number;
    revenueUsd: number;
    marginPct: number;
    belowRule: boolean;
}
export declare function pricingTableMarkdown(audPerUsd: number, audDate: string): string;
export declare function planMargins(falUsd: number, credits: number): PlanMargin[];
