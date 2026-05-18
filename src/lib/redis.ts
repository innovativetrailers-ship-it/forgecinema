import Redis from 'ioredis'

// ── Namespace isolation ───────────────────────────────────────
// Every key written by Cinema is prefixed so it cannot collide with
// Growth Engine or any other tenant sharing the same Upstash database.
export const CINEMA_KEY_PREFIX = 'cinema:'

// ── URL normalisation ─────────────────────────────────────────
// Upstash dashboard gives you an HTTP REST URL (https://xxx.upstash.io).
// ioredis requires the Redis wire-protocol URL (rediss://...:6380).
// REDIS_URL  = https://profound-baboon-75253.upstash.io  ← REST (keep for reference)
// REDIS_TOKEN = <token from Upstash dashboard "Connect" tab>
function buildRedisUrl(): string {
  const raw = process.env.REDIS_URL ?? ''

  if (raw.startsWith('https://') || raw.startsWith('http://')) {
    const token = process.env.REDIS_TOKEN
    if (!token) {
      throw new Error(
        '[Redis] REDIS_TOKEN is required when REDIS_URL is an HTTP endpoint. ' +
        'Copy the token from your Upstash dashboard → Database → Connect → ioredis.'
      )
    }
    // Strip protocol, append Redis port
    const host = raw.replace(/^https?:\/\//, '').replace(/\/$/, '')
    return `rediss://default:${token}@${host}:6380`
  }

  // Already a redis:// or rediss:// URL — use as-is
  return raw
}

// ── Connection factory ────────────────────────────────────────
// Export so SSE subscriber routes can create their own dedicated connections
// with the same settings (ioredis cannot share one connection for pub/sub).
export function createRedisConnection(): Redis {
  return new Redis(buildRedisUrl(), {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    // Every key command automatically gets 'cinema:' prepended.
    // NOTE: pub/sub channel names are NOT covered by keyPrefix — use channelKey() below.
    keyPrefix: CINEMA_KEY_PREFIX,
    tls: {}, // Upstash requires TLS; ioredis enables it via rediss:// but this is a safety net
    enableOfflineQueue: false,
    reconnectOnError: (err: Error) => {
      // Reconnect on READONLY errors (Upstash replica promotion)
      return err.message.includes('READONLY')
    },
  })
}

// ── Singleton ─────────────────────────────────────────────────
const globalForRedis = globalThis as unknown as { redis: Redis }

export const redis =
  globalForRedis.redis ??
  createRedisConnection()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// ── Pub/Sub channel helper ────────────────────────────────────
// ioredis `keyPrefix` does NOT apply to pub/sub channel names.
// Always run channel strings through this function before publish/subscribe.
export function channelKey(channel: string): string {
  return `${CINEMA_KEY_PREFIX}${channel}`
}
