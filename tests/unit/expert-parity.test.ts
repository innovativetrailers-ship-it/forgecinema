import {
  DIRECTOR_BRIEF_VERSION,
  KEEPER_SHOT,
  VIDEO_EXPERT_REGISTRY,
  acceptRoleOutput,
  buildGrokRequest,
  validateRoleOutput,
} from '@cinema/core'

const scene = {
  scene_id: 'S03',
  intent: 'The keeper sees the lamp still burning.',
  coverage_notes: 'One shot of the climb.',
  shots: [KEEPER_SHOT],
}

describe('expert parity', () => {
  test('the desktop pin imports these same exports', async () => {
    expect(DIRECTOR_BRIEF_VERSION).toBe('v1')
    expect(VIDEO_EXPERT_REGISTRY.length).toBeGreaterThan(0)
    const request = buildGrokRequest('director', { text: 'A dark stair.' })
    expect(request.messages[0]?.role).toBe('system')
    const repair = jest.fn()
    const value = await acceptRoleOutput('director', scene, repair)
    expect(repair).not.toHaveBeenCalled()
    expect(validateRoleOutput('director', value).ok).toBe(true)
  })
})
