import { z } from 'zod'

/** Parameter layer. One row per model and gateway. Layer 2 live endpoints still override this seed. */

export const sourceTierSchema = z.enum(['T1', 'T2', 'T3', 'U'])
export const registryStatusSchema = z.enum(['live', 'unverified', 'retired'])
export const negativeModeSchema = z.enum(['field', 'prose', 'never'])

export const videoRegistryEntrySchema = z.object({
  id: z.string().min(1),
  gateway: z.string().min(1),
  version: z.string().min(1),
  durations: z.array(z.number().positive()),
  aspects: z.array(z.string()),
  resolutions: z.array(z.string()),
  fps: z.number().nullable(),
  maxReferences: z.number().int().nonnegative(),
  referenceSyntax: z.string(),
  negative: negativeModeSchema,
  dialogue: z.enum(['quoted', 'kling', 'prose', 'none']),
  audio: z.boolean(),
  durationEncoding: z.enum(['number', 'seconds-string']),
  source_tier: sourceTierSchema,
  verified_at: z.string().nullable(),
  status: registryStatusSchema,
  wordCap: z.number().int().positive().nullable(),
  charCap: z.number().int().positive().nullable(),
  catalogKey: z.string().nullable(),
  knowledgeId: z.string().nullable(),
  uncertain: z.array(z.string()),
  paramNames: z.array(z.string()),
})

export type VideoRegistryEntry = z.infer<typeof videoRegistryEntrySchema>
export type NegativeMode = z.infer<typeof negativeModeSchema>

function range(min: number, max: number): number[] {
  const values: number[] = []
  for (let n = min; n <= max; n += 1) values.push(n)
  return values
}

const rows: VideoRegistryEntry[] = [
  {
    id: 'seedance-2.0', gateway: 'fal', version: '2.0',
    durations: range(4, 15), aspects: ['16:9', '9:16', '1:1'], resolutions: [],
    fps: null, maxReferences: 12, referenceSyntax: '@Image1 @Video1 @Audio1',
    negative: 'prose', dialogue: 'quoted', audio: true, durationEncoding: 'number',
    source_tier: 'T2', verified_at: null, status: 'live',
    wordCap: 100, charCap: null, catalogKey: null, knowledgeId: 'seedance-2.0',
    uncertain: ['negative field'], paramNames: ['duration'],
  },
  {
    id: 'seedance-2.5', gateway: 'fal', version: '2.5',
    durations: range(4, 30), aspects: [], resolutions: [],
    fps: null, maxReferences: 50, referenceSyntax: '@Image1 @Video1 @Audio1',
    negative: 'prose', dialogue: 'quoted', audio: true, durationEncoding: 'number',
    source_tier: 'T2', verified_at: null, status: 'unverified',
    wordCap: 100, charCap: null, catalogKey: null, knowledgeId: null,
    uncertain: ['durations', 'task', 'draft'], paramNames: [],
  },
  {
    id: 'kling-3.0', gateway: 'fal', version: '3.0',
    durations: range(3, 15), aspects: ['16:9', '9:16', '1:1'], resolutions: [],
    fps: null, maxReferences: 0, referenceSyntax: 'labelled shots',
    negative: 'field', dialogue: 'kling', audio: true, durationEncoding: 'number',
    source_tier: 'T2', verified_at: null, status: 'live',
    wordCap: null, charCap: null, catalogKey: 'kling-video/v3/pro/text-to-video', knowledgeId: 'kling-3.0',
    uncertain: ['dialogue languages'], paramNames: ['duration', 'negative_prompt', 'multi_prompt'],
  },
  {
    id: 'kling-4.0', gateway: 'fal', version: '4.0',
    durations: [], aspects: [], resolutions: [],
    fps: null, maxReferences: 0, referenceSyntax: '',
    negative: 'prose', dialogue: 'kling', audio: false, durationEncoding: 'number',
    source_tier: 'U', verified_at: null, status: 'unverified',
    wordCap: null, charCap: null, catalogKey: null, knowledgeId: null,
    uncertain: ['durations', 'aspects', 'audio', 'negative'], paramNames: [],
  },
  {
    id: 'veo-3.1', gateway: 'fal', version: '3.1',
    durations: [4, 6, 8], aspects: ['16:9', '9:16'], resolutions: ['1080p', '4k'],
    fps: 24, maxReferences: 3, referenceSyntax: 'reference images, first and last frame',
    negative: 'field', dialogue: 'quoted', audio: true, durationEncoding: 'seconds-string',
    source_tier: 'T1', verified_at: null, status: 'live',
    wordCap: null, charCap: null, catalogKey: 'veo3.1', knowledgeId: 'veo-3.1',
    uncertain: ['google api negative field'], paramNames: ['duration', 'aspect_ratio', 'resolution'],
  },
  {
    id: 'ltx-2.5', gateway: 'fal', version: '2.5',
    durations: [], aspects: [], resolutions: [],
    fps: null, maxReferences: 0, referenceSyntax: '',
    negative: 'prose', dialogue: 'prose', audio: true, durationEncoding: 'number',
    source_tier: 'T2', verified_at: null, status: 'unverified',
    wordCap: null, charCap: null, catalogKey: null, knowledgeId: null,
    uncertain: ['camera_motion enum', 'durations'], paramNames: [],
  },
  {
    id: 'wan-3.0', gateway: 'fal', version: '3.0',
    durations: range(2, 30), aspects: [], resolutions: [],
    fps: null, maxReferences: 0, referenceSyntax: '',
    negative: 'prose', dialogue: 'prose', audio: true, durationEncoding: 'number',
    source_tier: 'T2', verified_at: null, status: 'unverified',
    wordCap: null, charCap: null, catalogKey: null, knowledgeId: 'wan-3.0',
    uncertain: ['param names'], paramNames: [],
  },
  {
    id: 'pixverse-v6', gateway: 'fal', version: '6',
    durations: [], aspects: [], resolutions: [],
    fps: null, maxReferences: 0, referenceSyntax: 'first and last frame',
    negative: 'field', dialogue: 'prose', audio: false, durationEncoding: 'number',
    source_tier: 'U', verified_at: null, status: 'unverified',
    wordCap: null, charCap: null, catalogKey: null, knowledgeId: null,
    uncertain: ['durations', 'negative', 'dialogue'], paramNames: [],
  },
  {
    id: 'hailuo-03', gateway: 'fal', version: '03',
    durations: range(5, 15), aspects: [], resolutions: [],
    fps: null, maxReferences: 0, referenceSyntax: '',
    negative: 'prose', dialogue: 'prose', audio: false, durationEncoding: 'number',
    source_tier: 'U', verified_at: null, status: 'unverified',
    wordCap: null, charCap: 7000, catalogKey: null, knowledgeId: null,
    uncertain: ['param names'], paramNames: [],
  },
  {
    id: 'vidu-q4', gateway: 'fal', version: 'q4',
    durations: [], aspects: [], resolutions: [],
    fps: null, maxReferences: 12, referenceSyntax: 'reference images',
    negative: 'prose', dialogue: 'prose', audio: false, durationEncoding: 'number',
    source_tier: 'U', verified_at: null, status: 'unverified',
    wordCap: null, charCap: null, catalogKey: null, knowledgeId: null,
    uncertain: ['reference count', 'text-to-video'], paramNames: [],
  },
  {
    id: 'luma-ray3.14', gateway: 'fal', version: '3.14',
    durations: [], aspects: [], resolutions: [],
    fps: null, maxReferences: 0, referenceSyntax: '',
    negative: 'never', dialogue: 'none', audio: false, durationEncoding: 'number',
    source_tier: 'U', verified_at: null, status: 'unverified',
    wordCap: 100, charCap: null, catalogKey: null, knowledgeId: null,
    uncertain: ['durations'], paramNames: [],
  },
  {
    id: 'happyhorse-1.0', gateway: 'fal', version: '1.0',
    durations: range(3, 15), aspects: [], resolutions: [],
    fps: null, maxReferences: 0, referenceSyntax: '',
    negative: 'prose', dialogue: 'quoted', audio: true, durationEncoding: 'number',
    source_tier: 'T2', verified_at: null, status: 'unverified',
    wordCap: null, charCap: null, catalogKey: null, knowledgeId: null,
    uncertain: ['specs'], paramNames: [],
  },
  {
    id: 'gemini-omni', gateway: 'fal', version: 'omni',
    durations: [], aspects: [], resolutions: [],
    fps: null, maxReferences: 0, referenceSyntax: '',
    negative: 'prose', dialogue: 'none', audio: false, durationEncoding: 'number',
    source_tier: 'U', verified_at: null, status: 'unverified',
    wordCap: null, charCap: null, catalogKey: null, knowledgeId: 'gemini-omni',
    uncertain: ['prompt guide', 'durations'], paramNames: [],
  },
  {
    id: 'grok-imagine', gateway: 'fal', version: 'imagine',
    durations: range(1, 15), aspects: [], resolutions: ['480p', '720p'],
    fps: null, maxReferences: 0, referenceSyntax: '',
    negative: 'prose', dialogue: 'quoted', audio: true, durationEncoding: 'number',
    source_tier: 'T2', verified_at: null, status: 'unverified',
    wordCap: null, charCap: null, catalogKey: null, knowledgeId: 'grok-imagine-video',
    uncertain: ['silent downgrade'], paramNames: [],
  },
  {
    id: 'sora-2', gateway: 'fal', version: '2',
    durations: [], aspects: [], resolutions: [],
    fps: null, maxReferences: 0, referenceSyntax: '',
    negative: 'prose', dialogue: 'none', audio: false, durationEncoding: 'number',
    source_tier: 'T3', verified_at: null, status: 'retired',
    wordCap: null, charCap: null, catalogKey: null, knowledgeId: null,
    uncertain: [], paramNames: [],
  },
  {
    id: 'runway-gen4.5', gateway: 'fal', version: '4.5',
    durations: [], aspects: [], resolutions: [],
    fps: null, maxReferences: 0, referenceSyntax: '',
    negative: 'prose', dialogue: 'prose', audio: false, durationEncoding: 'number',
    source_tier: 'U', verified_at: null, status: 'unverified',
    wordCap: null, charCap: null, catalogKey: null, knowledgeId: null,
    uncertain: ['parameters'], paramNames: [],
  },
]

export const VIDEO_EXPERT_REGISTRY: VideoRegistryEntry[] = z.array(videoRegistryEntrySchema).parse(rows)

export function registryKey(entry: Pick<VideoRegistryEntry, 'id' | 'gateway'>): string {
  return `${entry.id}@${entry.gateway}`
}

export function findVideoRegistry(modelKey: string): VideoRegistryEntry | undefined {
  const key = modelKey.trim()
  return VIDEO_EXPERT_REGISTRY.find((entry) => registryKey(entry) === key || entry.id === key)
}

export function expertSeedForKnowledge(knowledgeId: string): {
  registryId: string
  maxDuration: number | null
  negative: VideoRegistryEntry['negative']
  sourceTier: VideoRegistryEntry['source_tier']
  status: VideoRegistryEntry['status']
} | null {
  const entry = VIDEO_EXPERT_REGISTRY.find((row) => row.knowledgeId === knowledgeId && row.status !== 'retired')
  if (!entry) return null
  return {
    registryId: registryKey(entry),
    maxDuration: entry.durations.length ? Math.max(...entry.durations) : null,
    negative: entry.negative,
    sourceTier: entry.source_tier,
    status: entry.status,
  }
}

export function unverifiedRegistryFields(): Array<{ id: string; field: string; source_tier: 'U' | 'T2' | 'T3' }> {
  const listed: Array<{ id: string; field: string; source_tier: 'U' | 'T2' | 'T3' }> = []
  for (const entry of VIDEO_EXPERT_REGISTRY) {
    if (entry.source_tier === 'U') {
      listed.push({ id: registryKey(entry), field: 'row', source_tier: 'U' })
    }
    for (const field of entry.uncertain) {
      listed.push({
        id: registryKey(entry),
        field,
        source_tier: entry.source_tier === 'T1' ? 'T2' : entry.source_tier,
      })
    }
  }
  return listed
}
