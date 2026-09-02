import { describe, expect, it } from 'vitest'
import { parseLibrary } from './storage'

describe('legacy import migration', () => {
  it('maps v2 practice-named timestamps into the v3 runtime model', () => {
    const timestamp = '2026-08-01T00:00:00.000Z'
    const parsed = parseLibrary({
      version: 2,
      topics: [{
        id: 'legacy', title: 'Legacy', scope: 'One item.', track: 'learning',
        items: [{ prompt: 'p', answer: 'a' }], status: 'learning',
        createdAt: timestamp, drilledAt: null, completedAt: null,
        lastPracticedAt: timestamp, history: [],
      }],
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.library.version).toBe(3)
    expect(parsed.library.topics[0].lastTestedAt).toBe(timestamp)
    expect(parsed.library.topics[0].learningAt).toBe(timestamp)
    expect('lastPracticedAt' in parsed.library.topics[0]).toBe(false)
  })
})
