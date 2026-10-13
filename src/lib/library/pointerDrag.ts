let armed: string | null = null
let placedAt = 0

export function armLibraryDrag(value: string): void {
  armed = value
}

export function noteLibraryDrop(): void {
  placedAt = Date.now()
  armed = null
}

/** Pointer-up placement for browsers that do not emit a drop from a mouse drag. */
export function consumeLibraryDrag(): string | null {
  if (Date.now() - placedAt < 500) {
    armed = null
    return null
  }
  const value = armed
  armed = null
  return value
}
