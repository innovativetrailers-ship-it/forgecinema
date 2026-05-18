import { getPriorityForRole } from '../lib/queue'

// Mock BullMQ and Redis
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    getJob: jest.fn(),
    close: jest.fn(),
  })),
  QueueEvents: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}))

jest.mock('../lib/redis', () => ({
  redis: {
    publish: jest.fn().mockResolvedValue(1),
    subscribe: jest.fn(),
    duplicate: jest.fn().mockReturnThis(),
    on: jest.fn(),
  },
}))

describe('getPriorityForRole', () => {
  it('returns lower priority number for STUDIO (higher actual priority)', () => {
    const studioPriority = getPriorityForRole('STUDIO')
    const freePriority = getPriorityForRole('FREE')
    expect(studioPriority).toBeLessThan(freePriority)
  })

  it('returns priority order: STUDIO < PRO < FREE', () => {
    expect(getPriorityForRole('STUDIO')).toBeLessThan(getPriorityForRole('PRO'))
    expect(getPriorityForRole('PRO')).toBeLessThan(getPriorityForRole('FREE'))
  })

  it('returns a valid number for unknown roles', () => {
    const p = getPriorityForRole('UNKNOWN_ROLE')
    expect(typeof p).toBe('number')
    expect(p).toBeGreaterThan(0)
  })

  it('returns positive integers', () => {
    for (const role of ['FREE', 'PRO', 'STUDIO', 'ADMIN']) {
      expect(getPriorityForRole(role)).toBeGreaterThan(0)
    }
  })
})
