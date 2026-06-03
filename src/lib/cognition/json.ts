// Parse JSON returned by an LLM, tolerating ```json fences and surrounding prose.
// Falls back to a caller-supplied default so cognition degrades gracefully
// instead of throwing when a model returns malformed output.
export function parseLLMJson<T>(content: string, fallback: T): T {
  const cleaned = content.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const start = cleaned.search(/[[{]/)
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'))
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T
      } catch {
        return fallback
      }
    }
    return fallback
  }
}
