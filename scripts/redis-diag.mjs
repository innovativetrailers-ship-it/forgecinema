// Standalone Railway → Upstash reachability probe. Prints DNS + TCP/TLS results,
// then exits 0 so the worker can start regardless. Does NOT import ioredis.
import { lookup } from 'node:dns/promises'
import { connect as tlsConnect } from 'node:tls'
import { connect as netConnect } from 'node:net'

const raw = process.env.REDIS_URL ?? ''
if (!raw) {
  console.error('[redis-diag] REDIS_URL is empty')
  process.exit(0)
}

let u
try {
  u = new URL(raw.replace(':6380', ':6379'))
} catch (e) {
  console.error('[redis-diag] bad REDIS_URL:', e.message)
  process.exit(0)
}

const host = u.hostname
const port = Number(u.port) || 6379
const isTls = u.protocol === 'rediss:'
console.log(`[redis-diag] host=${host} port=${port} tls=${isTls}`)

async function dns() {
  for (const family of [4, 6]) {
    try {
      const r = await lookup(host, { family })
      console.log(`[redis-diag] DNS v${family} = ${r.address}`)
    } catch (e) {
      console.error(`[redis-diag] DNS v${family} FAILED: ${e.message}`)
    }
  }
}

function probe(useTls) {
  return new Promise((resolve) => {
    const started = Date.now()
    const label = useTls ? 'TLS' : 'TCP'
    const onErr = (e) => { console.error(`[redis-diag] ${label} ERROR after ${Date.now() - started}ms: ${e.message}`); resolve() }
    const sock = useTls
      ? tlsConnect({ host, port, servername: host, timeout: 12_000, rejectUnauthorized: false }, () => {
          console.log(`[redis-diag] ${label} connect OK in ${Date.now() - started}ms`); sock.end(); resolve()
        })
      : netConnect({ host, port, timeout: 12_000 }, () => {
          console.log(`[redis-diag] ${label} connect OK in ${Date.now() - started}ms`); sock.end(); resolve()
        })
    sock.on('timeout', () => { console.error(`[redis-diag] ${label} TIMEOUT after ${Date.now() - started}ms`); sock.destroy(); resolve() })
    sock.on('error', onErr)
  })
}

await dns()
await probe(false)
await probe(true)
console.log('[redis-diag] done')
process.exit(0)
