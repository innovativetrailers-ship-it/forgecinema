/** Forge boxes are normalised 0–1, origin top-left, x,y,w,h. */

export interface ForgeBox {
  x: number
  y: number
  w: number
  h: number
}

export class BoxConversionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BoxConversionError'
  }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

export function assertBoxArea(box: ForgeBox): void {
  if (box.w <= 0 || box.h <= 0) {
    throw new BoxConversionError('Box has zero area')
  }
}

/** Claude: absolute [x1, y1, x2, y2] pixels of the image as sent. */
export function claudePixelsToForge(
  box: readonly [number, number, number, number],
  width: number,
  height: number,
): ForgeBox {
  if (width <= 0 || height <= 0) throw new BoxConversionError('Image size is zero')
  const [x1, y1, x2, y2] = box
  const next = {
    x: clamp01(Math.min(x1, x2) / width),
    y: clamp01(Math.min(y1, y2) / height),
    w: clamp01(Math.abs(x2 - x1) / width),
    h: clamp01(Math.abs(y2 - y1) / height),
  }
  assertBoxArea(next)
  return next
}

/**
 * Gemini box_2d is [ymin, xmin, ymax, xmax] on a 0–1000 scale, y first.
 * Swapping y and x changes the returned x.
 */
export function geminiBoxToForge(box: readonly [number, number, number, number]): ForgeBox {
  const [ymin, xmin, ymax, xmax] = box
  const next = {
    x: clamp01(Math.min(xmin, xmax) / 1000),
    y: clamp01(Math.min(ymin, ymax) / 1000),
    w: clamp01(Math.abs(xmax - xmin) / 1000),
    h: clamp01(Math.abs(ymax - ymin) / 1000),
  }
  assertBoxArea(next)
  return next
}

/** GPT-6 has no verified box convention. Callers must not ask it to localise. */
export function gptBoxToForge(): never {
  throw new BoxConversionError('GPT-6 is text fallback only and does not localise boxes')
}
