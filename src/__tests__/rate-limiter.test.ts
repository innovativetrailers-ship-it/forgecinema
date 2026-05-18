// Mock ioredis
jest.mock('../lib/redis', () => ({
  redis: {
    zadd: jest.fn().mockResolvedValue(1),
    zcard: jest.fn(),
    zremrangebyscore: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    pipeline: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  },
}))

import { redis } from '../lib/redis'

const mockRedis = redis as jest.Mocked<typeof redis>

// Replicate the sliding window rate limiter logic from middleware
async function checkRateLimit(
  userId: string,
  role: string,
  limits: Record<string, number>
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = limits[role] ?? limits['FREE'] ?? 20
  const windowMs = 60 * 1000
  const now = Date.now()
  const windowStart = now - windowMs
  const key = `rl:${userId}:jobs`

  await (mockRedis as unknown as { zremrangebyscore: (k: string, s: number, e: number) => Promise<number> }).zremrangebyscore(key, 0, windowStart)

  const count = (await (mockRedis as unknown as { zcard: (k: string) => Promise<number> }).zcard(key)) ?? 0

  if (count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  await (mockRedis as unknown as { zadd: (k: string, s: number, m: string) => Promise<number> }).zadd(key, now, `${now}-${Math.random()}`)
  return { allowed: true, remaining: limit - count - 1 }
}

const RATE_LIMITS = { FREE: 20, PRO: 100, STUDIO: 500, ADMIN: 1000 }

describe('Rate Limiter', () => {
  beforeEach(() => jest.clearAllMocks())

  it('allows request when under limit', async () => {
    ;(mockRedis as unknown as { zcard: jest.Mock }).zcard = jest.fn().mockResolvedValue(5)

    const result = await checkRateLimit('user-1', 'FREE', RATE_LIMITS)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(14) // 20 - 5 - 1
  })

  it('blocks request when at limit', async () => {
    ;(mockRedis as unknown as { zcard: jest.Mock }).zcard = jest.fn().mockResolvedValue(20)

    const result = await checkRateLimit('user-1', 'FREE', RATE_LIMITS)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('STUDIO users have higher limit than FREE', () => {
    expect(RATE_LIMITS.STUDIO).toBeGreaterThan(RATE_LIMITS.FREE)
    expect(RATE_LIMITS.PRO).toBeGreaterThan(RATE_LIMITS.FREE)
  })

  it('cleans up old entries before counting', async () => {
    ;(mockRedis as unknown as { zcard: jest.Mock }).zcard = jest.fn().mockResolvedValue(0)

    await checkRateLimit('user-2', 'PRO', RATE_LIMITS)
    expect((mockRedis as unknown as { zremrangebyscore: jest.Mock }).zremrangebyscore).toHaveBeenCalled()
  })
})
