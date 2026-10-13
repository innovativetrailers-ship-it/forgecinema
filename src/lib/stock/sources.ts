/** Env names the stock panel reads. A source is shown only when its variable is set. */
export const STOCK_SOURCE_ENV = {
  pexels: 'PEXELS_API_KEY',
  pixabay: 'PIXABAY_API_KEY',
  unsplash: 'UNSPLASH_ACCESS_KEY',
  freesound: 'FREESOUND_API_KEY',
} as const

export type StockSourceId = keyof typeof STOCK_SOURCE_ENV

export function configuredStockSources(): StockSourceId[] {
  return (Object.keys(STOCK_SOURCE_ENV) as StockSourceId[]).filter((id) => Boolean(process.env[STOCK_SOURCE_ENV[id]]?.trim()))
}
