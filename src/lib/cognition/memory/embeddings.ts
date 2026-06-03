// Embeddings via Voyage AI. A missing key or transient error yields a zero vector
// so callers degrade gracefully (recall returns nothing) rather than throwing.

const EMBED_DIM = 1024

export async function embed(text: string): Promise<number[]> {
  const key = process.env.VOYAGE_API_KEY
  if (!key) return new Array(EMBED_DIM).fill(0)
  try {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'voyage-3', input: text, output_dimension: EMBED_DIM }),
    })
    if (!res.ok) return new Array(EMBED_DIM).fill(0)
    const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> }
    return json.data?.[0]?.embedding ?? new Array(EMBED_DIM).fill(0)
  } catch {
    return new Array(EMBED_DIM).fill(0)
  }
}

// pgvector literal form for binding a number[] as a ::vector parameter.
export function toVector(vec: number[]): string {
  return `[${vec.join(',')}]`
}
