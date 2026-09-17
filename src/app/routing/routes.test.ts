import { describe, expect, it } from 'vitest'
import { isAppRoute, restoreRoute, sameRoute, type AppRoute } from './routes'
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
