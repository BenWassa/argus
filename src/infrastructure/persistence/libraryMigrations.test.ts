import { describe, expect, it } from 'vitest'
import { catalogDefinition } from '../../domain/library/catalog'
import type { CurrentLibrary } from '../../domain/library/library'
import type { Topic } from '../../domain/library/topic'
import { refreshShippedLearn } from './libraryMigrations'

const BEAUFORT = 'beaufort-wind-scale'

/** Beaufort as a library that received it before #128 holds it: two tables. */
function beforeTheRewrite(overrides: Partial<Topic> = {}): Topic {
  const shipped = catalogDefinition(BEAUFORT)
  if (!shipped) throw new Error('Beaufort is not shipped')
  return {
    ...shipped,
    origin: 'catalog',
    status: 'drilled',
    drilledAt: '2026-09-20T00:00:00.000Z',
    history: [{ at: '2026-09-20T00:00:00.000Z', correct: 13, total: 13, resolvedTo: 'drilled' }],
    learn: {
      kind: 'concise',
      overview: 'The old overview.',
      sections: [
        { heading: 'What each force looks like at sea', blocks: [{ type: 'table', columns: ['Force', 'At sea'], rows: [['0', 'Mirror.']] }] },
      ],
    },
    ...overrides,
  }
}

function library(topic: Topic): CurrentLibrary {
  return { version: 5, topics: [topic], catalogDelivered: [BEAUFORT] }
}

describe('refreshing a rewritten shipped Learn (#128)', () => {
  it('brings the force entries to a library that already holds Beaufort, and nothing else', () => {
    const old = beforeTheRewrite()
    const [topic] = refreshShippedLearn(library(old)).topics
    expect(topic.learn).toEqual(catalogDefinition(BEAUFORT)?.learn)
    expect(topic.learn?.sections?.[0].blocks[0].type).toBe('entries')
    // Explanation changed; evidence did not.
    expect({ ...topic, learn: old.learn }).toEqual(old)
  })

  it('is idempotent, so two devices arrive at the same record', () => {
    const once = refreshShippedLearn(library(beforeTheRewrite()))
    expect(refreshShippedLearn(once)).toBe(once)
  })

  it('leaves a topic whose scored boundary was edited alone', () => {
    const edited = beforeTheRewrite()
    edited.items = edited.items.map((item, index) => (index === 0 ? { ...item, answer: 'Flat calm' } : item))
    const input = library(edited)
    expect(refreshShippedLearn(input)).toBe(input)
  })

  it('leaves a user-authored topic that happens to share the id alone', () => {
    const input = library(beforeTheRewrite({ origin: 'user' }))
    expect(refreshShippedLearn(input)).toBe(input)
  })
})
