export const readFileSync = (): string => {
  throw new Error('filesystem is unavailable in the browser')
}

export const existsSync = (): boolean => false
