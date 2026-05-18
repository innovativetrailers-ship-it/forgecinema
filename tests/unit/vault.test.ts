/**
 * Unit tests for vault logic — model locking and character management
 */

// ── Model lock logic ────────────────────────────────────────────────────────
describe('Model lock logic', () => {
  type ModelFamily = 'kling' | 'runway' | 'luma' | 'pika' | 'veo3' | 'seedance'

  function shouldLockModel(renderCount: number, threshold = 3): boolean {
    return renderCount >= threshold
  }

  function getLockedFamily(
    firstModel: string,
    renderCount: number,
    threshold = 3
  ): ModelFamily | null {
    if (!shouldLockModel(renderCount, threshold)) return null

    // Map model name to family
    if (firstModel.includes('kling')) return 'kling'
    if (firstModel.includes('runway')) return 'runway'
    if (firstModel.includes('luma')) return 'luma'
    if (firstModel.includes('pika')) return 'pika'
    if (firstModel.includes('veo')) return 'veo3'
    if (firstModel.includes('seedance')) return 'seedance'
    return null
  }

  test('does not lock before threshold', () => {
    expect(shouldLockModel(2, 3)).toBe(false)
    expect(shouldLockModel(0, 3)).toBe(false)
  })

  test('locks at threshold', () => {
    expect(shouldLockModel(3, 3)).toBe(true)
    expect(shouldLockModel(10, 3)).toBe(true)
  })

  test('returns correct family from model name', () => {
    expect(getLockedFamily('kling-v1.6', 5)).toBe('kling')
    expect(getLockedFamily('runway-gen3', 5)).toBe('runway')
    expect(getLockedFamily('luma-dream-machine', 5)).toBe('luma')
    expect(getLockedFamily('veo3-fast', 5)).toBe('veo3')
  })

  test('returns null when not locked', () => {
    expect(getLockedFamily('kling-v1.6', 1)).toBeNull()
  })
})

// ── Character validation ────────────────────────────────────────────────────
describe('Character name validation', () => {
  function validateCharacterName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length === 0) return { valid: false, error: 'Name is required' }
    if (name.trim().length < 2) return { valid: false, error: 'Name must be at least 2 characters' }
    if (name.trim().length > 50) return { valid: false, error: 'Name must be 50 characters or less' }
    if (!/^[\w\s\-'.]+$/.test(name)) return { valid: false, error: 'Name contains invalid characters' }
    return { valid: true }
  }

  test('accepts valid names', () => {
    expect(validateCharacterName('Alice')).toEqual({ valid: true })
    expect(validateCharacterName("Dr. O'Brien")).toEqual({ valid: true })
    expect(validateCharacterName('John-Paul')).toEqual({ valid: true })
  })

  test('rejects empty names', () => {
    expect(validateCharacterName('')).toMatchObject({ valid: false })
    expect(validateCharacterName('   ')).toMatchObject({ valid: false })
  })

  test('rejects single character names', () => {
    expect(validateCharacterName('A')).toMatchObject({ valid: false })
  })

  test('rejects names over 50 characters', () => {
    const longName = 'A'.repeat(51)
    expect(validateCharacterName(longName)).toMatchObject({ valid: false })
  })
})

// ── LoRA trigger word generation ────────────────────────────────────────────
describe('LoRA trigger word generation', () => {
  function generateTriggerWord(characterName: string, userId: string): string {
    const sanitized = characterName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)
    const userPrefix = userId.slice(0, 6)
    return `${userPrefix}_${sanitized}`
  }

  test('generates a valid trigger word', () => {
    const trigger = generateTriggerWord('Alice Johnson', 'usr_abc123')
    expect(trigger).toMatch(/^usr_ab_alice_johnson$/)
  })

  test('sanitizes special characters', () => {
    const trigger = generateTriggerWord("O'Brien-Smith", 'usr_xyz789')
    expect(trigger).not.toContain("'")
    expect(trigger).not.toContain('-')
    expect(trigger).toMatch(/^[\w_]+$/)
  })

  test('truncates long names to 20 chars', () => {
    const longName = 'Very Long Character Name That Exceeds Limit'
    const trigger = generateTriggerWord(longName, 'usr_123')
    // Trigger = prefix (6) + _ + sanitised name (max 20)
    // Total max = 27 chars
    expect(trigger.length).toBeLessThanOrEqual(27)
  })

  test('is deterministic for same inputs', () => {
    const t1 = generateTriggerWord('Alice', 'usr_abc')
    const t2 = generateTriggerWord('Alice', 'usr_abc')
    expect(t1).toBe(t2)
  })
})
