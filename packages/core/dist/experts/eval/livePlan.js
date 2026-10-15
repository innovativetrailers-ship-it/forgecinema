"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIVE_EVAL_COST = void 0;
exports.liveEvalPlan = liveEvalPlan;
exports.LIVE_EVAL_COST = '8 language calls: 4 recorded QA cases, two model families. No video generation.';
function liveEvalPlan(argv) {
    return { run: argv.includes('--yes'), cost: exports.LIVE_EVAL_COST };
}
//# sourceMappingURL=livePlan.js.map