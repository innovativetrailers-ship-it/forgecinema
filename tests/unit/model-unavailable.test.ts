import {
  ModelUnavailableError,
  applyVerificationCache,
  llmModelForTask,
  postFalRouterChat,
  resetVerificationCache,
} from '@cinema/core'

describe('missing routed id', () => {
  afterEach(() => {
    resetVerificationCache()
  })

  test('throws a typed error, logs the id, and does not call the provider', async () => {
    applyVerificationCache(['x-ai/grok-4'])
    const errors: string[] = []
    const spy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map((item) => String(item)).join(' '))
    })
    const fetchImpl = jest.fn()
    expect(() => llmModelForTask('script', { tone: 'dark' })).toThrow(ModelUnavailableError)
    try {
      llmModelForTask('script', { tone: 'dark' })
    } catch (err) {
      expect(err).toBeInstanceOf(ModelUnavailableError)
      const typed = err as ModelUnavailableError
      expect(typed.message).toBe('This style is temporarily unavailable')
      expect(typed.role).toBe('script')
      expect(typed.modelId).toBe('x-ai/grok-4')
      expect(typed.reason).toContain('missing')
    }
    await expect(postFalRouterChat({
      model: 'x-ai/grok-4',
      messages: [{ role: 'user', content: 'A dark stair.' }],
      source: 'model-unavailable-test',
      falKey: 'test-key',
      ignorePause: true,
    }, fetchImpl)).rejects.toThrow('This style is temporarily unavailable')
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(errors.some((line) => line.includes('[model_unavailable]'))).toBe(true)
    expect(errors.join('\n')).toContain('x-ai/grok-4')
    spy.mockRestore()
  })
})
