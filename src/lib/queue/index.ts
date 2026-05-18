import { Queue, QueueEvents } from 'bullmq'
import { redis } from '../redis'

const connection = { connection: redis }

export const renderQueue = new Queue('render', {
  ...connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 100 },
  },
})

export const trainingQueue = new Queue('training', {
  ...connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
})

export const exportQueue = new Queue('export', {
  ...connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 50 },
  },
})

export const renderQueueEvents = new QueueEvents('render', connection)
export const trainingQueueEvents = new QueueEvents('training', connection)
export const exportQueueEvents = new QueueEvents('export', connection)

// In BullMQ, lower priority number = processed first (higher actual priority)
export function getPriorityForRole(role: string): number {
  switch (role) {
    case 'ADMIN':
      return 1
    case 'STUDIO':
      return 5
    case 'PRO':
      return 10
    default:
      return 20
  }
}
