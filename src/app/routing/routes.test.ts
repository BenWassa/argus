import { describe, expect, it } from 'vitest'
import { isAppRoute, liveRoute, parentFor, restoreRoute, roleRouteFromSearch, sameRoute, type AppRoute } from './routes'
import type { Topic } from '../../domain/library/topic'

describe('the route model', () => {
  it('accepts only versioned serializable Argus routes', () => {
    const topic = { kind: 'topic', topicId: 'topic-a' } as const
    const run = {
      kind: 'run',
      mode: 'test',
      topicIds: ['topic-a'],
      origin: topic,
    } as const

    expect(isAppRoute(topic)).toBe(true)
    expect(isAppRoute(run)).toBe(true)
    expect(isAppRoute({ kind: 'section', view: 'profile' })).toBe(true)
    expect(isAppRoute({ kind: 'section', view: 'data' })).toBe(true)
    expect(isAppRoute({ kind: 'section', view: 'unknown' })).toBe(false)
    expect(isAppRoute({ kind: 'topic', topicId: '' })).toBe(false)
    expect(isAppRoute({ kind: 'run', mode: 'test', topicIds: [], origin: topic })).toBe(false)
    expect(isAppRoute({ kind: 'run', mode: 'practice', topicIds: ['topic-a'], origin: topic })).toBe(false)
  })

  it('compares route identity including run origin', () => {
    const topic: AppRoute = { kind: 'topic', topicId: 'topic-a' }
    const sameTopic: AppRoute = { kind: 'topic', topicId: 'topic-a' }
    const otherTopic: AppRoute = { kind: 'topic', topicId: 'topic-b' }
    const runFromTopic: AppRoute = {
      kind: 'run',
      mode: 'test',
      topicIds: ['topic-a'],
      origin: topic,
    }
    const runFromLibrary: AppRoute = {
      kind: 'run',
      mode: 'test',
      topicIds: ['topic-a'],
      origin: { kind: 'section', view: 'library' },
    }

    expect(sameRoute(topic, sameTopic)).toBe(true)
    expect(sameRoute(topic, otherTopic)).toBe(false)
    expect(sameRoute(runFromTopic, runFromTopic)).toBe(true)
    expect(sameRoute(runFromTopic, runFromLibrary)).toBe(false)
  })
})

describe('a practice run in the route model', () => {
  const origin = { kind: 'section', view: 'library' } as const

  function practice(itemIds?: string[]): AppRoute {
    return {
      kind: 'run',
      mode: 'learn',
      topicIds: ['topic-a'],
      origin,
      target: { kind: 'practice', ...(itemIds ? { itemIds } : {}) },
    }
  }

  it('validates with and without an item list', () => {
    expect(isAppRoute(practice())).toBe(true)
    expect(isAppRoute(practice(['item-1', 'item-2']))).toBe(true)
  })

  it('rejects a malformed item list rather than restoring it', () => {
    const bad = (itemIds: unknown): AppRoute =>
      ({
        kind: 'run',
        mode: 'learn',
        topicIds: ['topic-a'],
        origin,
        target: { kind: 'practice', itemIds },
      }) as AppRoute

    expect(isAppRoute(bad([]))).toBe(false)
    expect(isAppRoute(bad(['ok', '']))).toBe(false)
    expect(isAppRoute(bad('item-1'))).toBe(false)
    expect(isAppRoute(bad([1, 2]))).toBe(false)
  })

  /**
   * `navigate` no-ops on `sameRoute`, so two offers over different items have
   * to read as different routes or the second one would silently do nothing.
   */
  it('tells two different practice sets apart', () => {
    expect(sameRoute(practice(['a']), practice(['a']))).toBe(true)
    expect(sameRoute(practice(['a']), practice(['b']))).toBe(false)
    expect(sameRoute(practice(['a', 'b']), practice(['a']))).toBe(false)
    // A derived run and a named run are not the same route either.
    expect(sameRoute(practice(), practice(['a']))).toBe(false)
    expect(sameRoute(practice(), practice())).toBe(true)
  })

  it('is not the same route as the lesson it shares a mode with', () => {
    const lesson: AppRoute = {
      kind: 'run',
      mode: 'learn',
      topicIds: ['topic-a'],
      origin,
      target: { kind: 'lesson' },
    }
    expect(sameRoute(practice(), lesson)).toBe(false)
  })
})

/**
 * `restoreRoute` was private to `App.tsx` and only ever exercised through a
 * rendered tree. It is the rule that decides what a reload or a Forward
 * traversal is allowed to bring back, so it is worth stating directly.
 */
describe('restoring a route against the live library', () => {
  const topics = [{ id: 'topic-a' }, { id: 'topic-b' }] as Topic[]
  const library = { kind: 'section', view: 'library' } as const

  it('drops a topic the library no longer holds', () => {
    expect(restoreRoute({ kind: 'topic', topicId: 'topic-a' }, topics, false)).toEqual({
      kind: 'topic',
      topicId: 'topic-a',
    })
    expect(restoreRoute({ kind: 'topic', topicId: 'gone' }, topics, false)).toEqual(library)
  })

  it('declines an in-memory run rather than starting a fresh scored attempt', () => {
    const test: AppRoute = {
      kind: 'run',
      mode: 'test',
      topicIds: ['topic-a'],
      origin: library,
    }
    expect(restoreRoute(test, topics, false)).toEqual(library)
    // Forward into a live run is a different question, and is allowed.
    expect(restoreRoute(test, topics, true)).toEqual(test)
  })

  it('resumes a canonical lesson, whose position is durable', () => {
    const lesson: AppRoute = {
      kind: 'run',
      mode: 'learn',
      topicIds: ['topic-a'],
      origin: library,
      target: { kind: 'lesson' },
    }
    expect(restoreRoute(lesson, topics, false)).toEqual(lesson)
  })

  it('falls back to the origin when the run names a missing topic', () => {
    const lesson: AppRoute = {
      kind: 'run',
      mode: 'learn',
      topicIds: ['gone'],
      origin: library,
      target: { kind: 'lesson' },
    }
    expect(restoreRoute(lesson, topics, false)).toEqual(library)
  })
})

describe('fluency routes', () => {
  const origin = { kind: 'section', view: 'library' } as const
  const run = (mode?: 'sprint' | 'ladder' | 'words' | 'groups') => ({
    kind: 'run' as const,
    mode: 'learn' as const,
    topicIds: ['morse'],
    origin,
    target: { kind: 'fluency' as const, ...(mode ? { mode } : {}) },
  })

  it('accepts the home screen and every named mode', () => {
    expect(isAppRoute(run())).toBe(true)
    for (const mode of ['sprint', 'ladder', 'words', 'groups'] as const) {
      expect(isAppRoute(run(mode))).toBe(true)
    }
  })

  it('rejects a mode that does not exist', () => {
    expect(
      isAppRoute({ ...run(), target: { kind: 'fluency', mode: 'marathon' } }),
    ).toBe(false)
  })

  it('accepts a direct sending stage and rejects an unknown one', () => {
    const send = (stage: string) => ({
      ...run(),
      target: { kind: 'fluency' as const, send: stage as never },
    })
    expect(isAppRoute(send('words'))).toBe(true)
    expect(isAppRoute(send('dispatch'))).toBe(true)
    expect(isAppRoute(send('marathon'))).toBe(false)
    expect(
      sameRoute(send('words'), { ...run(), target: { kind: 'fluency' as const } }),
    ).toBe(false)
  })

  it('accepts direct receiving and free-play routes without conflating them', () => {
    const copy = { ...run(), target: { kind: 'fluency' as const, copy: 'common' as const } }
    const free = { ...run(), target: { kind: 'fluency' as const, free: true as const } }
    expect(isAppRoute(copy)).toBe(true)
    expect(isAppRoute(free)).toBe(true)
    expect(sameRoute(copy, free)).toBe(false)
    expect(sameRoute(copy, { ...run(), target: { kind: 'fluency' as const, copy: 'letters' as const } })).toBe(false)
    expect(sameRoute(free, run())).toBe(false)
    expect(isAppRoute({ ...run(), target: { kind: 'fluency', copy: 'missing' } })).toBe(false)
    expect(isAppRoute({ ...run(), target: { kind: 'fluency', free: false } })).toBe(false)
    expect(isAppRoute({ ...run(), target: { kind: 'fluency', mode: 'sprint', free: true } })).toBe(false)
  })

  it('treats the home screen and a mode as different places', () => {
    expect(sameRoute(run(), run('sprint'))).toBe(false)
    expect(sameRoute(run('sprint'), run('words'))).toBe(false)
    expect(sameRoute(run('sprint'), run('sprint'))).toBe(true)
  })

  /**
   * A Fluency run holds its queue in memory. Restoring the entry would
   * silently start a fresh run the learner did not ask for, exactly as it
   * would for replay and the checkpoints.
   */
  it('is not resumable and falls back to its origin', () => {
    const topics = [{ id: 'morse' } as never]
    expect(restoreRoute(run('sprint'), topics, false)).toEqual(origin)
  })
})

describe('retired Morse hub history', () => {
  it('normalizes live, reloaded and traversed hub entries to the topic', () => {
    const topics = [{ id: 'morse' }] as Topic[]
    const route: AppRoute = { kind: 'run', mode: 'learn', topicIds: ['morse'],
      origin: { kind: 'section', view: 'library' }, target: { kind: 'fluency' } }
    const topic = { kind: 'topic', topicId: 'morse' }
    expect(liveRoute(route, topics)).toEqual(topic)
    expect(restoreRoute(route, topics, false)).toEqual(topic)
    expect(restoreRoute(route, topics, true)).toEqual(topic)
    expect(restoreRoute(route, [], true)).toEqual({ kind: 'section', view: 'library' })
  })
})

it('compares every letter-practice direction including an unspecified direction', () => {
  const route = (direction?: 'key' | 'read' | 'listen'): AppRoute => ({
    kind: 'run', mode: 'learn', topicIds: ['morse'],
    origin: { kind: 'topic', topicId: 'morse' }, target: { kind: 'letter-practice', direction },
  })
  for (const left of ['key', 'read', 'listen', undefined] as const) {
    for (const right of ['key', 'read', 'listen', undefined] as const) {
      expect(sameRoute(route(left), route(right)), `${left} / ${right}`).toBe(left === right)
    }
  }
})

describe('role detail routes (#223)', () => {
  const role = { kind: 'role', roleId: 'navigator' } as const
  const overview = { kind: 'section', view: 'roles' } as const
  const topics = [{ id: 'topic-a' }] as Topic[]

  it('accepts only available role IDs, never staged or malformed identities', () => {
    expect(isAppRoute(role)).toBe(true)
    expect(isAppRoute({ kind: 'role', roleId: 'communicator' })).toBe(true)
    expect(isAppRoute({ kind: 'role', roleId: 'mariner' })).toBe(true)
    for (const invalid of ['diver', 'responder', 'operator', 'analyst', '', null]) {
      expect(isAppRoute({ kind: 'role', roleId: invalid })).toBe(false)
    }
    expect(sameRoute(role, role)).toBe(true)
    expect(sameRoute(role, { kind: 'role', roleId: 'mariner' })).toBe(false)
    expect(sameRoute(role, overview)).toBe(false)
  })

  it('restores valid role detail on refresh and falls back for removed identities', () => {
    expect(restoreRoute(role, topics, false)).toEqual(role)
    expect(liveRoute(role, [])).toEqual(role)
    const removed = { kind: 'role', roleId: 'diver' } as unknown as AppRoute
    expect(restoreRoute(removed, topics, false)).toEqual(overview)
    expect(roleRouteFromSearch('?role=navigator')).toEqual(role)
    expect(roleRouteFromSearch('?role=diver')).toEqual(overview)
    expect(roleRouteFromSearch('?role=unknown')).toEqual(overview)
    expect(roleRouteFromSearch('?role=')).toEqual(overview)
    expect(roleRouteFromSearch('?source=homescreen')).toBeNull()
  })

  it('uses role detail as origin without fabricating a new scored Test attempt', () => {
    expect(parentFor(role)).toEqual(role)
    const test: AppRoute = { kind: 'run', mode: 'test', topicIds: ['topic-a'], origin: role }
    expect(isAppRoute(test)).toBe(true)
    expect(restoreRoute(test, topics, false)).toEqual(role)
    expect(restoreRoute(test, topics, true)).toEqual(test)
    expect(sameRoute(test, { ...test, origin: overview })).toBe(false)
    expect(restoreRoute({ ...test, origin: { kind: 'role', roleId: 'diver' } as never }, topics, false)).toEqual(overview)
  })
})
