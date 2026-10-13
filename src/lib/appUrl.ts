/** Public app origin. Override with NEXT_PUBLIC_APP_URL. */
export function appUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim()
  return fromEnv && fromEnv.length > 0 ? fromEnv.replace(/\/$/, '') : 'https://cinema.ai-forge.co'
}
