import Redis from 'ioredis'
const token = process.env.REDIS_TOKEN
const raw = process.env.REDIS_URL
const host = raw.replace(/^https?:\/\//,'').replace(/\/$/,'')
const url = `rediss://default:${token}@${host}:6380`
console.log('Connecting to', host, ':6380 (TLS)')
const r = new Redis(url, { tls:{}, lazyConnect:true, maxRetriesPerRequest:2, connectTimeout:8000, retryStrategy:(t)=> t>2?null:500 })
r.on('error', e => console.log('ERR:', e.message))
try {
  await r.connect()
  const pong = await r.ping()
  console.log('PING:', pong)
  await r.quit()
  console.log('SUCCESS')
} catch (e) {
  console.log('FAILED:', e.message)
  process.exit(1)
}
