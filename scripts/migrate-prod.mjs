#!/usr/bin/env node
/**
 * One migrate at a time, on the direct Neon host.
 * Refuses when another migrate holds the lock. Never reset. Never db push.
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

function loadEnv(file) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnv(resolve('.env.local'))
loadEnv(resolve('.env'))

function directUrl() {
  const named = process.env.DIRECT_URL?.trim()
  if (named) return named
  const pooled = process.env.DATABASE_URL?.trim()
  if (!pooled) {
    console.error('[migrate] DATABASE_URL is unset and DIRECT_URL is unset')
    process.exit(1)
  }
  const url = new URL(pooled)
  url.hostname = url.hostname.replace('-pooler', '')
  if (url.hostname.includes('-pooler')) {
    console.error('[migrate] could not derive a direct host')
    process.exit(1)
  }
  return url.toString()
}

function runPrisma(args, url) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('npx', ['prisma', ...args], {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: url },
    })
    child.on('exit', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`prisma ${args.join(' ')} exited ${code}`))
    })
  })
}

const url = directUrl()
const host = new URL(url).hostname
if (host.includes('-pooler')) {
  console.error('[migrate] refusing the pooled host')
  process.exit(1)
}
console.log('[migrate] direct host')

const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  const held = await client.query(`
    SELECT a.pid, a.state, left(a.query, 120) AS query
    FROM pg_locks l
    JOIN pg_stat_activity a ON a.pid = l.pid
    WHERE l.locktype = 'advisory'
      AND a.pid <> pg_backend_pid()
      AND (a.query ILIKE '%migrate%' OR a.application_name ILIKE '%prisma%')
  `)
  if (held.rows.length) {
    console.error('[migrate] another migrate holds the lock')
    for (const row of held.rows) console.error(`pid ${row.pid} ${row.state}`)
    process.exit(1)
  }
} finally {
  await client.end()
}

console.log('[migrate] status')
try {
  await runPrisma(['migrate', 'status'], url)
} catch (err) {
  console.log('[migrate] status reported pending or drifted:', err instanceof Error ? err.message : err)
}

if (process.argv.includes('--status')) process.exit(0)

console.log('[migrate] deploy')
await runPrisma(['migrate', 'deploy'], url)
console.log('[migrate] deploy finished')
