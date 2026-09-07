import { describe, expect, it } from 'vitest'
import { absorbSeededMorseBaseline, parseLibrary } from './storage'
import { seedLibrary } from './seed'

const timestamp = '2026-08-01T00:00:00.000Z'

function legacyTopic(overrides: Record<string, unknown> = {}): Record<string, unknown> {
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

function currentTopic(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return legacyTopic({
    items: [{ id: 'item-1', kind: 'forward', prompt: 'p', answer: 'a' }],
    itemEvidence: {},
    ...overrides,
  })
}

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

describe('library import migration', () => {
  it('absorbs the exact #23 seed in place while preserving durable learner state', () => {
    const seeded = seedLibrary()
    const morse = seeded.topics.find((topic) => topic.id === 'international-morse-letters-printed')!
    const forward = {
      ...morse,
      scope: 'The temporary forward-only boundary.',
      items: morse.items.map((item) => ({ ...item, kind: 'forward' as const })),
      status: 'drilled' as const,
      drilledAt: timestamp,
      history: [{ at: timestamp, correct: 26, total: 26, resolvedTo: 'drilled' as const }],
      itemEvidence: {
        [morse.items[0].id!]: {
          cue: 'reduced' as const,
          directions: {
            'prompt-to-answer': {
              attempts: 4, correct: 3, unassistedCorrect: 0, consecutiveCorrect: 1,
              lastAt: timestamp, lastLatencyMs: 700,
            },
          },
        },
      },
    }
    const upgraded = absorbSeededMorseBaseline({ version: 5, topics: [forward] }).topics[0]
    expect(upgraded.items).toHaveLength(26)
    expect(upgraded.items.every((item) => item.kind === 'bidirectional')).toBe(true)
    expect(upgraded.items.map((item) => item.id)).toEqual(forward.items.map((item) => item.id))
    expect(upgraded.history).toEqual(forward.history)
    expect(upgraded.drilledAt).toBe(timestamp)
    expect(upgraded.itemEvidence).toEqual(forward.itemEvidence)
    expect(upgraded.scope).toBe('Can independently recall all A–Z printed Morse mappings in both directions.')
  })

  it('maps v2 practice-named timestamps into the v5 runtime model', () => {
    const parsed = parseLibrary({
      version: 2,
      topics: [legacyTopic({
        id: 'legacy',
        title: 'Legacy',
        status: 'learning',
        lastPracticedAt: timestamp,
      })],
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.library.version).toBe(5)
    expect(parsed.library.topics[0].lastTestedAt).toBe(timestamp)
    expect(parsed.library.topics[0].learningAt).toBe(timestamp)
    expect(parsed.library.topics[0].items).toEqual([
      { id: 'legacy-item-01', kind: 'forward', prompt: 'p', answer: 'a' },
    ])
    expect(parsed.library.topics[0].itemEvidence).toEqual({})
    expect('lastPracticedAt' in parsed.library.topics[0]).toBe(false)
  })

  it('accepts a v3 library with no Learn support as reference-only', () => {
    const parsed = parseLibrary({ version: 3, topics: [legacyTopic()] })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.library.version).toBe(5)
    expect(parsed.library.topics[0].learn).toBeUndefined()
    expect(parsed.library.topics[0].items[0]).toEqual({
      id: 'topic-item-01',
      kind: 'forward',
      prompt: 'p',
      answer: 'a',
    })
  })

  it('migrates any v4 item set deterministically without changing its boundary or scheduler history', () => {
    const input = {
      version: 4,
      topics: [legacyTopic({
        id: 'stable-topic',
        status: 'drilled',
        drilledAt: timestamp,
        history: [{ at: timestamp, correct: 2, total: 2, resolvedTo: 'drilled' }],
        items: [
          { prompt: 'A', answer: 'Alfa' },
          { prompt: 'B', answer: 'Bravo' },
        ],
      })],
    }

    const first = parseLibrary(input)
    const second = parseLibrary(JSON.parse(JSON.stringify(input)))
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    if (!first.ok || !second.ok) return

    expect(first.library.topics[0].items).toEqual([
      { id: 'stable-topic-item-01', kind: 'forward', prompt: 'A', answer: 'Alfa' },
      { id: 'stable-topic-item-02', kind: 'forward', prompt: 'B', answer: 'Bravo' },
    ])
    expect(second.library.topics[0].items).toEqual(first.library.topics[0].items)
    expect(first.library.topics[0].status).toBe('drilled')
    expect(first.library.topics[0].drilledAt).toBe(timestamp)
    expect(first.library.topics[0].history).toEqual(input.topics[0].history)
    expect(first.library.topics[0].itemEvidence).toEqual({})
  })
})

describe('v5 item semantics and lossless portable learning state', () => {
  const v5Topic = currentTopic({
    id: 'morse-letters',
    items: [
      { id: 'morse-a', kind: 'bidirectional', prompt: 'A', answer: '.-' },
      { id: 'morse-b', kind: 'forward', prompt: 'B', answer: '-...' },
    ],
    itemEvidence: {
      'morse-a': {
        cue: 'reduced',
        directions: {
          'prompt-to-answer': {
            attempts: 3,
            correct: 2,
            unassistedCorrect: 1,
            consecutiveCorrect: 2,
            lastAt: timestamp,
            lastLatencyMs: 840,
          },
          'answer-to-prompt': {
            attempts: 2,
            correct: 1,
            unassistedCorrect: 1,
            consecutiveCorrect: 1,
            lastAt: timestamp,
            lastLatencyMs: 1130,
          },
        },
      },
      'morse-b': {
        cue: 'rich',
        directions: {},
      },
    },
    learn: {
      kind: 'concise',
      overview: 'Packet data is portable content, while its waveform is runtime presentation.',
      sections: [
        {
          heading: 'Packet',
          blocks: [
            {
              type: 'morse-character-packet',
              characters: [
                {
                  glyph: 'A',
                  pattern: '.-',
                  mnemonicId: 'morse-a-v1',
                  audioText: 'A',
                  textLabel: 'A: dit dah',
                },
              ],
            },
          ],
        },
      ],
    },
  })

  it('round-trips ids, bidirectional semantics, cue evidence and Morse Learn packets losslessly', () => {
    const first = parseLibrary({ version: 5, topics: [v5Topic] })
    expect(first.ok).toBe(true)
    if (!first.ok) return

    const exported = JSON.parse(JSON.stringify(first.library))
    const second = parseLibrary(exported)
    expect(second.ok).toBe(true)
    if (!second.ok) return

    expect(second.library).toEqual(first.library)
    expect(second.library.version).toBe(5)
    expect(second.library.topics[0].items[0]).toMatchObject({ id: 'morse-a', kind: 'bidirectional' })
    expect(second.library.topics[0].itemEvidence).toEqual(v5Topic.itemEvidence)
    expect(second.library.topics[0].learn).toEqual(v5Topic.learn)
  })

  it('rejects a v5 item without durable identity or typed semantics', () => {
    const missingId = parseLibrary({ version: 5, topics: [currentTopic({ items: [{ kind: 'forward', prompt: 'p', answer: 'a' }] })] })
    expect(missingId.ok).toBe(false)
    if (!missingId.ok) expect(missingId.error).toContain('stable id')

    const missingKind = parseLibrary({ version: 5, topics: [currentTopic({ items: [{ id: 'x', prompt: 'p', answer: 'a' }] })] })
    expect(missingKind.ok).toBe(false)
    if (!missingKind.ok) expect(missingKind.error).toContain('item semantics')
  })

  it('rejects duplicate ids and evidence orphaned from the finite item set', () => {
    const duplicate = parseLibrary({
      version: 5,
      topics: [currentTopic({
        items: [
          { id: 'same', kind: 'forward', prompt: 'p1', answer: 'a1' },
          { id: 'same', kind: 'forward', prompt: 'p2', answer: 'a2' },
        ],
      })],
    })
    expect(duplicate.ok).toBe(false)
    if (!duplicate.ok) expect(duplicate.error).toContain('repeats item id')

    const orphan = parseLibrary({
      version: 5,
      topics: [currentTopic({ itemEvidence: { orphan: { cue: 'rich', directions: {} } } })],
    })
    expect(orphan.ok).toBe(false)
    if (!orphan.ok) expect(orphan.error).toContain('unknown item id')
  })

  it('rejects impossible per-direction evidence rather than corrupting cue state', () => {
    const parsed = parseLibrary({
      version: 5,
      topics: [currentTopic({
        itemEvidence: {
          'item-1': {
            cue: 'free',
            directions: {
              'prompt-to-answer': {
                attempts: 1,
                correct: 2,
                consecutiveCorrect: 2,
                lastAt: timestamp,
                lastLatencyMs: 500,
              },
            },
          },
        },
      })],
    })
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.error).toContain('impossible')
  })
})

describe('formative lesson progress is durable and portable', () => {
  it('gives a record written before the guided lesson an empty store, losslessly', () => {
    // #48 adds `lessonProgress` inside v5 rather than bumping the version,
    // because there is nothing to migrate: no lesson progress is exactly what
    // every pre-#48 record means.
    const parsed = parseLibrary({ version: 5, topics: [currentTopic()] })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.library.topics[0].lessonProgress).toEqual({})

    const again = parseLibrary(JSON.parse(JSON.stringify(parsed.library)))
    expect(again.ok && again.library).toEqual(parsed.library)
  })

  it('carries a real lesson store through export and import unchanged', () => {
    const progress = { 'item-1': 'settled' }
    const parsed = parseLibrary({ version: 5, topics: [currentTopic({ lessonProgress: progress })] })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.library.topics[0].lessonProgress).toEqual(progress)

    const exported = JSON.parse(JSON.stringify(parsed.library))
    const reimported = parseLibrary(exported)
    expect(reimported.ok).toBe(true)
    if (!reimported.ok) return
    expect(reimported.library).toEqual(parsed.library)
    expect(reimported.library.topics[0].lessonProgress).toEqual(progress)
  })

  it('keeps lesson progress strictly separate from cue evidence and history', () => {
    const parsed = parseLibrary({
      version: 5,
      topics: [currentTopic({
        lessonProgress: { 'item-1': 'cued' },
        itemEvidence: { 'item-1': { cue: 'rich', directions: {} } },
      })],
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const topic = parsed.library.topics[0]
    expect(topic.lessonProgress).toEqual({ 'item-1': 'cued' })
    expect(topic.itemEvidence).toEqual({ 'item-1': { cue: 'rich', directions: {} } })
    expect(topic.history).toEqual([])
    expect(topic.status).toBe('unstarted')
  })

  it('rejects lesson progress that references an item the topic does not have', () => {
    const parsed = parseLibrary({
      version: 5,
      topics: [currentTopic({ lessonProgress: { orphan: 'settled' } })],
    })
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.error).toContain('unknown item id')
  })

  it('rejects an unsupported lesson support level rather than guessing one', () => {
    const parsed = parseLibrary({
      version: 5,
      topics: [currentTopic({ lessonProgress: { 'item-1': 'mastered' } })],
    })
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.error).toContain('unsupported lesson support level')

    const notAnObject = parseLibrary({
      version: 5,
      topics: [currentTopic({ lessonProgress: ['item-1'] })],
    })
    expect(notAnObject.ok).toBe(false)
    if (!notAnObject.ok) expect(notAnObject.error).toContain('keyed by item id')
  })

  it('ignores lesson progress on a pre-v5 record, which cannot have had any', () => {
    const parsed = parseLibrary({
      version: 4,
      topics: [legacyTopic({ lessonProgress: { anything: 'settled' } })],
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.library.topics[0].lessonProgress).toEqual({})
  })
})

describe('the active Morse Learn sitting is durable and portable (#66)', () => {
  const MORSE_ITEMS = [
    { id: 'item-1', kind: 'bidirectional', prompt: 'E', answer: '.' },
    { id: 'item-2', kind: 'bidirectional', prompt: 'T', answer: '-' },
  ]

  function withSitting(sitting: unknown): Record<string, unknown> {
    return { version: 5, topics: [currentTopic({ items: MORSE_ITEMS, lessonSitting: sitting })] }
  }

  function parsed(sitting: unknown) {
    const result = parseLibrary(withSitting(sitting))
    if (!result.ok) throw new Error(result.error)
    return result.library.topics[0]
  }

  function rejection(sitting: unknown): string {
    const result = parseLibrary(withSitting(sitting))
    if (result.ok) throw new Error('Expected the import to be rejected.')
    return result.error
  }

  it('round-trips retrievals, correct count and revisit ids losslessly', () => {
    const sitting = { retrievals: 6, correct: 4, revisitItemIds: ['item-2'] }
    const topic = parsed(sitting)
    expect(topic.lessonSitting).toEqual(sitting)

    // Export is the stored record, so re-importing it has to be a fixed point.
    const again = parseLibrary(JSON.parse(JSON.stringify({ version: 5, topics: [topic] })))
    expect(again.ok && again.library.topics[0].lessonSitting).toEqual(sitting)
  })

  it('round-trips the learner\'s listening declination with the sitting', () => {
    const sitting = { retrievals: 3, correct: 3, revisitItemIds: [], listeningSuppressed: true }
    expect(parsed(sitting).lessonSitting).toEqual(sitting)
    // False is the default, and is stored as the absence of the flag.
    expect(parsed({ retrievals: 3, correct: 3, revisitItemIds: [], listeningSuppressed: false }).lessonSitting)
      .toEqual({ retrievals: 3, correct: 3, revisitItemIds: [] })
  })

  it('treats an older v5 record with no sitting as a fresh sitting', () => {
    const result = parseLibrary({ version: 5, topics: [currentTopic({ items: MORSE_ITEMS })] })
    expect(result.ok && result.library.topics[0]).not.toHaveProperty('lessonSitting')
  })

  it('normalises a sitting that records nothing back to the absent field', () => {
    expect(parsed({ retrievals: 0, correct: 0, revisitItemIds: [] })).not.toHaveProperty('lessonSitting')
  })

  it('rejects counters that no sitting could have produced', () => {
    expect(rejection({ retrievals: 11, correct: 0, revisitItemIds: [] })).toContain('finite sitting is 10')
    expect(rejection({ retrievals: 3, correct: 4, revisitItemIds: [] })).toContain('more correct answers than retrievals')
    expect(rejection({ retrievals: 2, correct: -1, revisitItemIds: [] })).toContain('non-negative integers')
    expect(rejection({ retrievals: 1.5, correct: 1, revisitItemIds: [] })).toContain('non-negative integers')
    // Two distinct letters to revisit cannot come out of one missed retrieval.
    expect(rejection({ retrievals: 3, correct: 2, revisitItemIds: ['item-1', 'item-2'] }))
      .toContain('more letters to revisit than it recorded misses')
  })

  it('rejects a revisit id naming an item this topic does not have', () => {
    expect(rejection({ retrievals: 2, correct: 1, revisitItemIds: ['item-9'] }))
      .toContain('unknown item id "item-9"')
  })

  it('rejects a malformed sitting rather than silently dropping it', () => {
    expect(rejection('6/10')).toContain('lessonSitting must be an object')
    expect(rejection({ retrievals: 2, correct: 1 })).toContain('revisitItemIds list')
    expect(rejection({ retrievals: 2, correct: 1, revisitItemIds: ['item-1'], listeningSuppressed: 'yes' }))
      .toContain('listeningSuppressed must be true or false')
  })

  it('deduplicates repeated revisit ids', () => {
    expect(parsed({ retrievals: 4, correct: 2, revisitItemIds: ['item-1', 'item-1'] })?.lessonSitting)
      .toEqual({ retrievals: 4, correct: 2, revisitItemIds: ['item-1'] })
  })

  it('ignores a sitting on a pre-v5 record, which had no item ids to key it by', () => {
    const result = parseLibrary({
      version: 4,
      topics: [legacyTopic({ lessonSitting: { retrievals: 5, correct: 5, revisitItemIds: [] } })],
    })
    expect(result.ok && result.library.topics[0]).not.toHaveProperty('lessonSitting')
  })

  it('keeps the sitting alongside, and independent of, every sibling progress field', () => {
    const result = parseLibrary({
      version: 5,
      topics: [
        currentTopic({
          items: MORSE_ITEMS,
          status: 'drilled',
          drilledAt: timestamp,
          learningAt: timestamp,
          lastTestedAt: timestamp,
          history: [{ at: timestamp, correct: 2, total: 2, resolvedTo: 'drilled' }],
          itemEvidence: {
            'item-1': {
              cue: 'free',
              directions: {
                'prompt-to-answer': {
                  attempts: 3, correct: 3, unassistedCorrect: 2,
                  consecutiveCorrect: 3, lastAt: timestamp, lastLatencyMs: 900,
                },
              },
            },
          },
          lessonProgress: { 'item-1': 'settled' },
          lessonSitting: { retrievals: 5, correct: 5, revisitItemIds: [] },
          acquisitionReadyAt: timestamp,
        }),
      ],
    })
    if (!result.ok) throw new Error(result.error)
    const topic = result.library.topics[0]

    expect(topic.lessonSitting).toEqual({ retrievals: 5, correct: 5, revisitItemIds: [] })
    expect(topic.lessonProgress).toEqual({ 'item-1': 'settled' })
    expect(topic.itemEvidence?.['item-1'].cue).toBe('free')
    expect(topic.acquisitionReadyAt).toBe(timestamp)
    expect(topic.status).toBe('drilled')
    expect(topic.history).toHaveLength(1)
  })

  it('carries the acquisition-readiness anchor, and defaults it to unknown', () => {
    expect(parsed({ retrievals: 1, correct: 1, revisitItemIds: [] })).not.toHaveProperty('acquisitionReadyAt')
    const result = parseLibrary({
      version: 5,
      topics: [currentTopic({ items: MORSE_ITEMS, acquisitionReadyAt: 42 })],
    })
    // A non-string anchor is not a fabricated one: it simply is not recorded.
    expect(result.ok && result.library.topics[0]).not.toHaveProperty('acquisitionReadyAt')
  })
})

describe('structured Learn import and export shape', () => {
  it('migrates richer v4 Learn content without changing the scored items', () => {
    const first = parseLibrary({
      version: 4,
      topics: [legacyTopic({ learn: richLearn })],
    })
    expect(first.ok).toBe(true)
    if (!first.ok) return

    const exported = JSON.parse(JSON.stringify(first.library))
    const second = parseLibrary(exported)
    expect(second.ok).toBe(true)
    if (!second.ok) return

    expect(second.library.version).toBe(5)
    expect(second.library.topics[0].learn).toEqual(first.library.topics[0].learn)
    expect(second.library.topics[0].items.map(({ prompt, answer }) => ({ prompt, answer }))).toEqual([
      { prompt: 'p', answer: 'a' },
    ])
  })

  it('accepts concise support without forcing briefing-only structures', () => {
    const parsed = parseLibrary({
      version: 4,
      topics: [legacyTopic({
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
      topics: [legacyTopic({
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
      topics: [legacyTopic({
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
      topics: [legacyTopic({
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

  it('rejects malformed Morse packet data instead of accepting ambiguous audio/content identity', () => {
    const parsed = parseLibrary({
      version: 5,
      topics: [currentTopic({
        learn: {
          kind: 'concise',
          sections: [{
            heading: 'Packet',
            blocks: [{
              type: 'morse-character-packet',
              characters: [{
                glyph: 'A',
                pattern: '.-',
                mnemonicId: 'a',
                audioText: 'B',
                textLabel: 'A: dit dah',
              }],
            }],
          }],
        },
      })],
    })
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.error).toContain('same glyph')
  })
})
