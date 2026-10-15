export const LIVE_EVAL_COST = '8 language calls: 4 recorded QA cases, two model families. No video generation.'

export function liveEvalPlan(argv: readonly string[]): { run: boolean; cost: string } {
  return { run: argv.includes('--yes'), cost: LIVE_EVAL_COST }
}
