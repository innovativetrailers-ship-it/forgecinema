import { PLAN_DISPLAY_PRICES } from '../logic/planPrices'
import { ltxDuration } from '../logic/ltx'
import { veoDuration } from '../logic/veo'

/**
 * The only fal price table. Figures are copied from each model's llms.txt
 * Pricing section on 2026-10-14. A row with neither usdPerSecond nor a
 * per-video schedule is not sellable.
 */
export const FAL_COST_VERIFIED_ON = '2026-10-14'
export const PRICE_MARKUP = 1.5

/** Monthly credit grants. Free is a one-time trial, not a subscription rate. */
export const PLAN_MONTHLY_CREDITS = { pro: 500, studio: 2000, ultimate: 6000 } as const
export const FREE_TRIAL_CREDITS = 50

export interface FalCostParams {
  resolution?: string
  generateAudio?: boolean
  duration?: string
}

export interface FalCostRow {
  modelKey: string
  endpointId: string
  params: FalCostParams
  /** Dollars per billed second at the params Forge sends, when the page prices that way. */
  usdPerSecond?: number
  /** Dollars for one clip when the page prices a fixed length, not a rate. */
  usdPerVideo?: number
  source: string
  verifiedOn: string
  note: string
}

const PAGE = 'https://fal.ai/models'

export const FAL_COSTS: readonly FalCostRow[] = [
  {
    modelKey: 'veo-3.1',
    endpointId: 'fal-ai/veo3.1',
    params: { resolution: '720p', generateAudio: false, duration: '4s|6s|8s' },
    usdPerSecond: 0.2,
    source: `${PAGE}/fal-ai/veo3.1/llms.txt`,
    verifiedOn: FAL_COST_VERIFIED_ON,
    note: '720p and 1080p are $0.20/s with audio off and $0.40/s with audio on. 4k is $0.40/s off and $0.60/s on. Forge sends audio off. Duration snaps to 4, 6, or 8 seconds.',
  },
  {
    modelKey: 'kling-3.0',
    endpointId: 'fal-ai/kling-video/v3/pro/text-to-video',
    params: { generateAudio: false, duration: '3-15' },
    usdPerSecond: 0.112,
    source: `${PAGE}/fal-ai/kling-video/v3/pro/text-to-video/llms.txt`,
    verifiedOn: FAL_COST_VERIFIED_ON,
    note: 'Pro endpoint. Audio off $0.112/s, audio on $0.168/s, voice control $0.196/s. No resolution field. Forge sends audio off.',
  },
  {
    modelKey: 'seedance-2.0',
    endpointId: 'bytedance/seedance-2.0/text-to-video',
    params: { resolution: '720p', generateAudio: false, duration: '4-15' },
    usdPerSecond: 0.3034,
    source: `${PAGE}/bytedance/seedance-2.0/text-to-video/llms.txt`,
    verifiedOn: FAL_COST_VERIFIED_ON,
    note: '720p $0.3034/s, 1080p $0.682/s. The token line on the same page equals those rates; it is not added again. Audio does not change the price. Forge default resolution is 720p.',
  },
  {
    modelKey: 'grok-imagine-video',
    endpointId: 'xai/grok-imagine-video/v1.5/text-to-video',
    params: { resolution: '720p', generateAudio: true, duration: '1-15' },
    usdPerSecond: 0.14,
    source: `${PAGE}/xai/grok-imagine-video/v1.5/text-to-video/llms.txt`,
    verifiedOn: FAL_COST_VERIFIED_ON,
    note: '480p $0.08/s, 720p $0.14/s, 1080p $0.25/s. Audio is part of the model. Forge text default is 720p.',
  },
  {
    modelKey: 'wan-2.7',
    endpointId: 'fal-ai/wan/v2.7/text-to-video',
    params: { resolution: '720p', duration: '2-15' },
    usdPerSecond: 0.1,
    source: `${PAGE}/fal-ai/wan/v2.7/text-to-video/llms.txt`,
    verifiedOn: FAL_COST_VERIFIED_ON,
    note: '720p $0.10/s, 1080p $0.15/s. The page default is 1080p. Forge snaps a missing resolution to 720p, so the charge uses $0.10/s.',
  },
  {
    modelKey: 'ltx-2.3-fast',
    endpointId: 'fal-ai/ltx-2.3/text-to-video/fast',
    params: { resolution: '1080p', generateAudio: false, duration: '6|8|10|12|14|16|18|20' },
    usdPerSecond: 0.06,
    source: `${PAGE}/fal-ai/ltx-2.3/text-to-video/fast/llms.txt`,
    verifiedOn: FAL_COST_VERIFIED_ON,
    note: '1080p $0.06/s, 1440p $0.12/s, 2160p $0.24/s. No 480p price and no 480p enum. Forge sends 1080p. A 5s ask bills 6s; a 15s ask bills 16s.',
  },
  {
    modelKey: 'gemini-omni',
    endpointId: 'google/gemini-omni-flash/v1.1/text-to-video',
    params: { resolution: '720p', duration: '3-10' },
    usdPerSecond: 0.1,
    source: `${PAGE}/google/gemini-omni-flash/v1.1/text-to-video/llms.txt`,
    verifiedOn: FAL_COST_VERIFIED_ON,
    note: '360p $0.03/s, 720p $0.10/s, 1080p $0.15/s, 4k $0.30/s. No audio switch. Duration is 3 to 10 seconds, so 15s bills 10s.',
  },
  {
    modelKey: 'pixverse-v5.6',
    endpointId: 'fal-ai/pixverse/v5.6/text-to-video',
    params: { resolution: '720p', generateAudio: false, duration: '5|8|10' },
    usdPerVideo: 0.45,
    source: `${PAGE}/fal-ai/pixverse/v5.6/text-to-video/llms.txt`,
    verifiedOn: FAL_COST_VERIFIED_ON,
    note: 'Priced per clip, not per second. 720p silent: 5s $0.45, 8s $0.90, 10s $0.99. Audio adds $0.45 at 720p. 1080p silent is $0.75 for 5s and is not offered at 10s.',
  },
  {
    modelKey: 'wan-3.0',
    endpointId: 'alibaba/wan-3.0/text-to-video',
    params: { resolution: '720p', generateAudio: false, duration: '2-30' },
    usdPerSecond: 0.1,
    source: `${PAGE}/alibaba/wan-3.0/text-to-video/llms.txt`,
    verifiedOn: FAL_COST_VERIFIED_ON,
    note: '480p $0.05/s, 720p $0.10/s, 1080p $0.20/s. The page says pricing can change. Not in the default council.',
  },
  {
    modelKey: 'hailuo-02',
    endpointId: 'fal-ai/minimax/hailuo-02/pro/text-to-video',
    params: { resolution: '1080p', duration: '6' },
    usdPerSecond: 0.08,
    usdPerVideo: 0.48,
    source: `${PAGE}/fal-ai/minimax/hailuo-02/pro/text-to-video/llms.txt`,
    verifiedOn: FAL_COST_VERIFIED_ON,
    note: 'The input has no duration field. The page prices $0.08/s and gives a 6s clip as $0.48, so every request is billed as 6 seconds.',
  },
  {
    modelKey: 'happyhorse-1.0',
    endpointId: 'alibaba/happy-horse/text-to-video',
    params: { resolution: '1080p', duration: '3-15' },
    usdPerSecond: 0.28,
    source: `${PAGE}/alibaba/happy-horse/text-to-video/llms.txt`,
    verifiedOn: FAL_COST_VERIFIED_ON,
    note: '720p $0.14/s, 1080p $0.28/s. The page default is 1080p. Stays out of the council until one clean generation.',
  },
  {
    modelKey: 'runway-gen4',
    endpointId: 'runway-gen4',
    params: {},
    source: 'registry provider is runway, not a fal model page',
    verifiedOn: FAL_COST_VERIFIED_ON,
    note: 'Fal does not publish this endpoint. No usdPerSecond and no usdPerVideo, so it is not sellable.',
  },
]

const PIXVERSE_SILENT_720: Record<number, number> = { 5: 0.45, 8: 0.9, 10: 0.99 }

export function falCostRow(modelKey: string): FalCostRow | undefined {
  return FAL_COSTS.find((row) => row.modelKey === modelKey)
}

export function hasFalPrice(modelKey: string): boolean {
  const row = falCostRow(modelKey)
  return Boolean(row && (row.usdPerSecond != null || row.usdPerVideo != null || row.modelKey === 'pixverse-v5.6'))
}

export function creditFloorUsd(): number {
  let floor = Number.POSITIVE_INFINITY
  for (const plan of PLAN_DISPLAY_PRICES) {
    const grants = PLAN_MONTHLY_CREDITS[plan.id as keyof typeof PLAN_MONTHLY_CREDITS]
    if (!grants || plan.monthlyAud <= 0) continue
    floor = Math.min(floor, plan.monthlyAud / grants)
  }
  if (!Number.isFinite(floor)) throw new Error('no plan credit floor')
  return floor
}

function nearest(seconds: number, options: number[]): number {
  let best = options[0]
  let distance = Infinity
  for (const value of options) {
    const gap = Math.abs(value - seconds)
    if (gap < distance || (gap === distance && value > best)) {
      distance = gap
      best = value
    }
  }
  return best
}

function clampRange(seconds: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, seconds))
}

/** Seconds fal will bill for the length Forge submits. */
export function billedSecondsFor(modelKey: string, requestedSeconds: number): number {
  const asked = Number.isFinite(requestedSeconds) && requestedSeconds > 0 ? requestedSeconds : 5
  if (modelKey === 'ltx-2.3-fast') return ltxDuration(asked, true, () => {})
  if (modelKey === 'veo-3.1') return Number(veoDuration(asked).replace('s', ''))
  if (modelKey === 'pixverse-v5.6') return nearest(asked, [5, 8, 10])
  if (modelKey === 'hailuo-02') return 6
  if (modelKey === 'gemini-omni') return clampRange(Math.round(asked), 3, 10)
  if (modelKey === 'grok-imagine-video') return clampRange(Math.round(asked), 1, 15)
  if (modelKey === 'kling-3.0' || modelKey === 'happyhorse-1.0') return clampRange(Math.round(asked), 3, 15)
  if (modelKey === 'seedance-2.0') return clampRange(Math.round(asked), 4, 15)
  if (modelKey === 'wan-2.7') return clampRange(Math.round(asked), 2, 15)
  if (modelKey === 'wan-3.0') return clampRange(Math.round(asked), 2, 30)
  return asked
}

export function falUsdCost(
  modelKey: string,
  billedSeconds: number,
  params: FalCostParams = {},
): number {
  const row = falCostRow(modelKey)
  if (!row || !hasFalPrice(modelKey)) throw new Error(`no fal price for ${modelKey}`)
  const audio = params.generateAudio === true
  const resolution = params.resolution ?? row.params.resolution

  if (modelKey === 'veo-3.1') {
    const fourK = resolution === '4k'
    const rate = audio ? (fourK ? 0.6 : 0.4) : (fourK ? 0.4 : 0.2)
    return rate * billedSeconds
  }
  if (modelKey === 'kling-3.0') return (audio ? 0.168 : 0.112) * billedSeconds
  if (modelKey === 'seedance-2.0') {
    const rate = resolution === '1080p' ? 0.682 : resolution === '4k' ? 1.5552 : resolution === '480p' ? 0.1344 : 0.3034
    return rate * billedSeconds
  }
  if (modelKey === 'grok-imagine-video') {
    const rate = resolution === '1080p' ? 0.25 : resolution === '480p' ? 0.08 : 0.14
    return rate * billedSeconds
  }
  if (modelKey === 'wan-2.7') return (resolution === '1080p' ? 0.15 : 0.1) * billedSeconds
  if (modelKey === 'ltx-2.3-fast') {
    const rate = resolution === '2160p' ? 0.24 : resolution === '1440p' ? 0.12 : 0.06
    return rate * billedSeconds
  }
  if (modelKey === 'gemini-omni') {
    const rate = resolution === '4k' ? 0.3 : resolution === '1080p' ? 0.15 : resolution === '360p' ? 0.03 : 0.1
    return rate * billedSeconds
  }
  if (modelKey === 'wan-3.0') {
    const rate = resolution === '1080p' ? 0.2 : resolution === '480p' ? 0.05 : 0.1
    return rate * billedSeconds
  }
  if (modelKey === 'happyhorse-1.0') return (resolution === '720p' ? 0.14 : 0.28) * billedSeconds
  if (modelKey === 'pixverse-v5.6') {
    const bucket = nearest(billedSeconds, [5, 8, 10])
    const silent = PIXVERSE_SILENT_720[bucket]
    return audio ? silent + 0.45 : silent
  }
  if (modelKey === 'hailuo-02') return 0.48
  if (row.usdPerSecond != null) return row.usdPerSecond * billedSeconds
  if (row.usdPerVideo != null) return row.usdPerVideo
  throw new Error(`no fal price for ${modelKey}`)
}

export function creditsForFalCost(usd: number): number {
  const credits = Math.ceil((usd * PRICE_MARKUP) / creditFloorUsd())
  if (!Number.isFinite(credits) || credits <= 0) throw new Error('credit quote is not a positive number')
  return credits
}

export function creditsForRequest(modelKey: string, requestedSeconds: number, params?: FalCostParams): number {
  const billed = billedSecondsFor(modelKey, requestedSeconds)
  return creditsForFalCost(falUsdCost(modelKey, billed, params))
}

export interface PlanMargin {
  planId: string
  usdPerCredit: number
  revenueUsd: number
  marginPct: number
  belowRule: boolean
}

const SELLABLE_KEYS = () => FAL_COSTS.filter((row) => hasFalPrice(row.modelKey)).map((row) => row.modelKey)

export function pricingTableMarkdown(audPerUsd: number, audDate: string): string {
  const floor = creditFloorUsd()
  const lines: string[] = []
  lines.push('# Pricing table')
  lines.push('')
  lines.push(`Generated from packages/core/src/pricing/falCosts.ts. Verified ${FAL_COST_VERIFIED_ON}.`)
  lines.push(`Charge = ceil(fal USD × ${PRICE_MARKUP} / ${floor.toFixed(4)}). The floor is the lowest plan: Ultimate $99 / 6000 credits.`)
  lines.push(`AUD column uses 1 USD = ${audPerUsd} AUD on ${audDate} (Frankfurter).`)
  lines.push('A 5s, 10s, or 15s row uses the seconds fal actually bills when that length is shorter or snapped.')
  lines.push('')
  lines.push('| Model | Asked | Billed | Fal USD | Credits | Ultimate margin | Studio margin | Pro margin | Below rule | Fal AUD |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
  for (const key of SELLABLE_KEYS()) {
    for (const asked of [5, 10, 15]) {
      const billed = billedSecondsFor(key, asked)
      const usd = falUsdCost(key, billed)
      const credits = creditsForFalCost(usd)
      const margins = planMargins(usd, credits)
      const cell = (id: string) => {
        const row = margins.find((item) => item.planId === id)
        return row ? `${row.marginPct.toFixed(1)}%` : ''
      }
      const below = margins.some((item) => item.belowRule) ? 'YES' : 'no'
      lines.push(`| ${key} | ${asked}s | ${billed}s | ${usd.toFixed(4)} | ${credits} | ${cell('ultimate')} | ${cell('studio')} | ${cell('pro')} | ${below} | ${(usd * audPerUsd).toFixed(2)} |`)
    }
  }
  lines.push('')
  lines.push('## What a credit balance buys')
  lines.push('')
  lines.push('Counts are whole clips at a 5-second ask (billed length may be longer).')
  lines.push('')
  lines.push('| Model | 50 trial | Pro 500 | Studio 2000 | Ultimate 6000 |')
  lines.push('| --- | --- | --- | --- | --- |')
  let trialFal = 0
  for (const key of SELLABLE_KEYS()) {
    const one = creditsForRequest(key, 5)
    const fal = falUsdCost(key, billedSecondsFor(key, 5))
    const cells = [FREE_TRIAL_CREDITS, 500, 2000, 6000].map((balance) => Math.floor(balance / one))
    if (one <= FREE_TRIAL_CREDITS) trialFal = Math.max(trialFal, fal)
    lines.push(`| ${key} | ${cells[0]} | ${cells[1]} | ${cells[2]} | ${cells[3]} |`)
  }
  lines.push('')
  lines.push(`The free trial is ${FREE_TRIAL_CREDITS} credits and is unchanged. The dearest single clip those credits can start costs about $${trialFal.toFixed(2)} at fal. A signup cannot start a clip whose quote is above ${FREE_TRIAL_CREDITS} credits.`)
  lines.push('')
  lines.push('## Rows with no fal price')
  lines.push('')
  for (const row of FAL_COSTS.filter((item) => !hasFalPrice(item.modelKey))) {
    lines.push(`- ${row.modelKey} (${row.endpointId}): ${row.note}`)
  }
  lines.push('')
  lines.push('## Notes from the model pages')
  lines.push('')
  for (const row of FAL_COSTS) {
    lines.push(`- ${row.modelKey}: ${row.note} Source: ${row.source}`)
  }
  lines.push('')
  return lines.join('\n')
}

export function planMargins(falUsd: number, credits: number): PlanMargin[] {
  return PLAN_DISPLAY_PRICES.filter((plan) => plan.monthlyAud > 0).map((plan) => {
    const grants = PLAN_MONTHLY_CREDITS[plan.id as keyof typeof PLAN_MONTHLY_CREDITS]
    const usdPerCredit = plan.monthlyAud / grants
    const revenueUsd = credits * usdPerCredit
    const marginPct = revenueUsd === 0 ? 0 : ((revenueUsd - falUsd) / revenueUsd) * 100
    const belowRule = revenueUsd + 1e-9 < falUsd * PRICE_MARKUP
    return { planId: plan.id, usdPerCredit, revenueUsd, marginPct, belowRule }
  })
}
