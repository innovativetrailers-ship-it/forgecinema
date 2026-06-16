/**
 * Global generation kill-switch — defaults ON until explicitly disabled.
 * Set GENERATION_PAUSED=false to allow shot/film generation.
 */
export function isGenerationPaused(): boolean {
  const v = process.env.GENERATION_PAUSED
  if (v === undefined || v === '') return true
  if (v === '0' || v.toLowerCase() === 'false' || v.toLowerCase() === 'off') return false
  return v === '1' || v.toLowerCase() === 'true' || v.toLowerCase() === 'on'
}
