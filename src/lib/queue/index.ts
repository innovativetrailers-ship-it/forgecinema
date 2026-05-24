import { Queue, QueueEvents } from 'bullmq'
import { bullmqRedis, bullMQPrefix } from '../redis'

const isBuildTime =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-export'

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: { count: 500 },
  removeOnFail: { count: 100 },
}

// Queue stub used during build — every method is a no-op async function.
const queueStub = new Proxy({} as Queue, {
  get: () => async () => null,
})
const eventsStub = new Proxy({} as QueueEvents, {
  get: () => async () => null,
})

// Factory that lazily creates a Queue on first access via Proxy.
// This means `renderQueue.add(...)` works unchanged — no `.current` needed.
function lazyQueue(name: string, opts: Partial<Parameters<typeof Queue>[1]> = {}): Queue {
  if (isBuildTime) return queueStub

  let _q: Queue | undefined
  return new Proxy({} as Queue, {
    get(_, prop) {
      if (!_q) {
        _q = new Queue(name, {
          connection: bullmqRedis,
          prefix: bullMQPrefix,
          defaultJobOptions: DEFAULT_JOB_OPTIONS,
          ...opts,
        })
      }
      const val = (_q as unknown as Record<string | symbol, unknown>)[prop]
      return typeof val === 'function' ? val.bind(_q) : val
    },
  })
}

function lazyQueueEvents(name: string): QueueEvents {
  if (isBuildTime) return eventsStub

  let _e: QueueEvents | undefined
  return new Proxy({} as QueueEvents, {
    get(_, prop) {
      if (!_e) {
        _e = new QueueEvents(name, {
          connection: bullmqRedis,
          prefix: bullMQPrefix,
        })
      }
      const val = (_e as unknown as Record<string | symbol, unknown>)[prop]
      return typeof val === 'function' ? val.bind(_e) : val
    },
  })
}

export const renderQueue = lazyQueue('render')
export const trainingQueue = lazyQueue('training', {
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
})
export const exportQueue = lazyQueue('export', {
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 50 },
  },
})
export const upscaleQueue = lazyQueue('upscale')
export const cameraQueue = lazyQueue('camera')

export const renderQueueEvents = lazyQueueEvents('render')
export const trainingQueueEvents = lazyQueueEvents('training')
export const exportQueueEvents = lazyQueueEvents('export')

export function getPriorityForRole(role: string): number {
  switch (role) {
    case 'ADMIN':  return 1
    case 'STUDIO': return 5
    case 'PRO':    return 10
    default:       return 20
  }
}
