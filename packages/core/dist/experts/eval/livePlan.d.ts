export declare const LIVE_EVAL_COST = "8 language calls: 4 recorded QA cases, two model families. No video generation.";
export declare function liveEvalPlan(argv: readonly string[]): {
    run: boolean;
    cost: string;
};
