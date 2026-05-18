import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_DAS_URL,
})

export async function initDas(): Promise<void> {
  if (!process.env.DATABASE_DAS_URL) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS das_files (
      path TEXT PRIMARY KEY,
      data BYTEA,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

export function getDasPath(...segments: string[]): string {
  return segments.join('/')
}

export function getTrainingPath(...segments: string[]): string {
  return ['training', ...segments].join('/')
}

export async function ensureDasDir(dirPath: string): Promise<void> {
  // No-op for Postgres
}

export async function saveToDas(
  subPath: string,
  data: Buffer | string
): Promise<string> {
  await initDas()
  const buffer = typeof data === 'string' ? Buffer.from(data) : data
  await pool.query(
    `INSERT INTO das_files (path, data) VALUES ($1, $2)
     ON CONFLICT (path) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
    [subPath, buffer]
  )
  return subPath
}

export async function readFromDas(subPath: string): Promise<Buffer> {
  await initDas()
  const res = await pool.query('SELECT data FROM das_files WHERE path = $1', [subPath])
  if (res.rows.length === 0) {
    throw new Error(`File not found in DAS: ${subPath}`)
  }
  return res.rows[0].data
}

export async function dasExists(subPath: string): Promise<boolean> {
  await initDas()
  const res = await pool.query('SELECT 1 FROM das_files WHERE path = $1', [subPath])
  return res.rows.length > 0
}
