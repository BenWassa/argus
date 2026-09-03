import { describe, expect, it } from 'vitest'
import { parseLibrary } from './storage'

const timestamp = '2026-08-01T00:00:00.000Z'

function topic(overrides: Record<string, unknown> = {}) {
  return {
    id: 'topic',
    title: 'Topic',
    scope: 'One finite item.',
    track: 'learning',
    items: [{ prompt: 'p', answer: 'a' }],
    status: 'unstarted',
    createdAt: timestamp,
    drilledAt: null,
    learningAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
    ...overrides,
  }
}

describe('library import migration', () => {
  it('maps v2 practice-named timestamps into the v4 runtime model', () => {
    const parsed = parseLibrary({
      version: 2,
      topics: [topic({
        id: 'legacy',
        title: 'Legacy',
        status: 'learning',
        lastPracticedAt: timestamp,
      })],
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.library.version).toBe(4)
    expect(parsed.library.topics[0].lastTestedAt).toBe(timestamp)
    expect(parsed.library.topics[0].learningAt).toBe(timestamp)
    expect('lastPracticedAt' in parsed.library.topics[0]).toBe(false)
  })

  it('accepts a v3 library with no Learn support as reference-only', () => {
    const parsed = parseLibrary({ version: 3, topics: [topic()] })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.library.version).toBe(4)
    expect(parsed.library.topics[0].learn).toBeUndefined()
    expect(parsed.library.topics[0].items).toEqual([{ prompt: 'p', answer: 'a' }])
  })
})

describe('structured Learn import and export shape', () => {
  const richLearn = {
    kind: 'briefing',
    overview: 'A compact explanation of how the finite set fits together.',
    sections: [
      {
        heading: 'Core relationships',
        blocks: [
          { type: 'paragraph', text: 'The parts interact as one system.' },
          { type: 'bullets', items: ['First relationship', 'Second relationship'] },
          { type: 'steps', items: ['Start here', 'Then continue'] },
          {
            type: 'definitions',
            items: [{ term: 'Boundary', definition: 'What the Test deck claims to cover.' }],
          },
          {
            type: 'table',
            columns: ['Part', 'Role'],
            rows: [['A', 'First role'], ['B', 'Second role']],
          },
        ],
      },
    ],
    caseStudies: [
      {
        title: 'Whole-framework case',
        scenario: 'One scenario exercises the framework as an integrated process.',
        analysis: [
          {
            heading: 'Trace',
            blocks: [{ type: 'paragraph', text: 'Trace the framework across the full situation.' }],
          },
        ],
        takeaway: 'The value comes from the relationships, not isolated stage examples.',
      },
    ],
    limitations: ['This explains the model; it does not certify real-world competence.'],
    sources: [
      {
        label: 'Authoritative source',
        url: 'https://example.com/reference',
        note: 'Primary reference for the bounded explanation.',
      },
    ],
  }

  it('round-trips richer Learn content without changing the scored items', () => {
    const first = parseLibrary({
      version: 4,
      topics: [topic({ learn: richLearn })],
    })
    expect(first.ok).toBe(true)
    if (!first.ok) return

    const exported = JSON.parse(JSON.stringify(first.library))
    const second = parseLibrary(exported)
    expect(second.ok).toBe(true)
    if (!second.ok) return

    expect(second.library.version).toBe(4)
    expect(second.library.topics[0].learn).toEqual(first.library.topics[0].learn)
    expect(second.library.topics[0].items).toEqual([{ prompt: 'p', answer: 'a' }])
  })

  it('accepts concise support without forcing briefing-only structures', () => {
    const parsed = parseLibrary({
      version: 4,
      topics: [topic({
        learn: {
          kind: 'concise',
          overview: 'Only the explanation this topic actually needs.',
          sources: [{ label: 'Reference note' }],
        },
      })],
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.library.topics[0].learn?.kind).toBe('concise')
    expect(parsed.library.topics[0].learn?.sections).toBeUndefined()
  })

  it('rejects arbitrary or unknown content blocks instead of treating them as HTML', () => {
    const parsed = parseLibrary({
      version: 4,
      topics: [topic({
        learn: {
          kind: 'briefing',
          sections: [{ heading: 'Unsafe block', blocks: [{ type: 'html', html: '<b>raw</b>' }] }],
        },
      })],
    })
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error).toContain('unsupported block type')
    expect(parsed.error).toContain('not arbitrary HTML')
  })

  it('rejects malformed tables rather than silently losing comparison structure', () => {
    const parsed = parseLibrary({
      version: 4,
      topics: [topic({
        learn: {
          kind: 'briefing',
          sections: [{
            heading: 'Comparison',
            blocks: [{ type: 'table', columns: ['A', 'B'], rows: [['only one cell']] }],
          }],
        },
      })],
    })
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error).toContain('expected 2')
  })

  it('rejects unsafe source URL protocols', () => {
    const parsed = parseLibrary({
      version: 4,
      topics: [topic({
        learn: {
          kind: 'concise',
          overview: 'Support.',
          sources: [{ label: 'Bad link', url: 'javascript:alert(1)' }],
        },
      })],
    })
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error).toContain('invalid web URL')
  })
})
