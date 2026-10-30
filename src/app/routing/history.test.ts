import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ARGUS_NAVIGATION_VERSION,
  clearBackBlockersForTests,
  consumeBackBlocker,
  readNavigationState,
  registerBackBlocker,
} from './history'

afterEach(() => {
  clearBackBlockersForTests()
  vi.restoreAllMocks()
})

describe('navigation state', () => {
  it('rejects foreign, malformed and unknown-version history state', () => {
    expect(readNavigationState(null)).toBeNull()
    expect(readNavigationState({ route: { kind: 'section', view: 'today' } })).toBeNull()
    expect(
      readNavigationState({
        argusNavigation: ARGUS_NAVIGATION_VERSION + 1,
        index: 0,
        route: { kind: 'section', view: 'today' },
      }),
    ).toBeNull()
    expect(
      readNavigationState({
        argusNavigation: ARGUS_NAVIGATION_VERSION,
        index: -1,
        route: { kind: 'section', view: 'today' },
      }),
    ).toBeNull()
  })

  it('reads a valid versioned entry without domain snapshots', () => {
    const state = {
      argusNavigation: ARGUS_NAVIGATION_VERSION,
      index: 3,
      route: {
        kind: 'run',
        mode: 'learn',
        topicIds: ['topic-a', 'topic-b'],
        origin: { kind: 'section', view: 'library' },
      },
    }

    expect(readNavigationState(state)).toEqual(state)
  })
})

describe('Back blockers', () => {
  it('gives the newest mounted transient first refusal and cleans up safely', () => {
    const lower = vi.fn(() => true)
    const upper = vi.fn(() => true)
    const removeLower = registerBackBlocker(lower)
    const removeUpper = registerBackBlocker(upper)

    expect(consumeBackBlocker()).toBe(true)
    expect(upper).toHaveBeenCalledTimes(1)
    expect(lower).not.toHaveBeenCalled()

    removeUpper()
    expect(consumeBackBlocker()).toBe(true)
    expect(lower).toHaveBeenCalledTimes(1)

    removeLower()
    expect(consumeBackBlocker()).toBe(false)
  })

  it('lets a mounted surface decline Back without inventing a stop', () => {
    const remove = registerBackBlocker(() => false)
    expect(consumeBackBlocker()).toBe(false)
    remove()
  })
})

it('preserves historical Practice and new stage identities for route normalization', () => {
  const old = { argusNavigation: 1, index: 7, route: { kind: 'run', mode: 'learn', topicIds: ['a'],
    origin: { kind: 'section', view: 'today' }, target: { kind: 'practice', itemIds: ['a-1'] } } }
  expect(readNavigationState(old)).toEqual(old)
  const stage = { ...old, route: { ...old.route, target: { kind: 'stage', stageId: 'lesson-2' } } }
  expect(readNavigationState(stage)).toEqual(stage)
})
