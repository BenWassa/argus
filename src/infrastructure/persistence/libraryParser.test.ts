import { describe, expect, it } from 'vitest'
import { absorbSeededMorseBaseline } from './libraryMigrations'
import { parseLibrary } from './libraryParser'
import { seedLibrary } from '../../domain/library/catalogSeed'

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

  it('round-trips retries beyond the former ten-answer budget', () => {
    const sitting = { retrievals: 17, correct: 2, revisitItemIds: ['item-1'] }
    expect(parsed(sitting).lessonSitting).toEqual(sitting)
  })

  it('rejects counters that no sitting could have produced', () => {
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

describe('formative Morse review history is durable and portable (#90)', () => {
  const MORSE_ITEMS = [
    { id: 'item-1', kind: 'bidirectional', prompt: 'E', answer: '.' },
    { id: 'item-2', kind: 'bidirectional', prompt: 'T', answer: '-' },
  ]

  function withReview(morseReview: unknown): Record<string, unknown> {
    return { version: 5, topics: [currentTopic({ items: MORSE_ITEMS, morseReview })] }
  }

  function parsed(morseReview: unknown) {
    const result = parseLibrary(withReview(morseReview))
    if (!result.ok) throw new Error(result.error)
    return result.library.topics[0]
  }

  function rejection(morseReview: unknown): string {
    const result = parseLibrary(withReview(morseReview))
    if (result.ok) throw new Error('Expected the import to be rejected.')
    return result.error
  }

  const ITEM = { introducedIn: 1, lastSeenIn: 2, laterCorrect: 1, printed: 2, heard: 2, heardCorrect: 1 }

  it('round-trips the history losslessly', () => {
    const review = { sittings: 2, items: { 'item-1': ITEM } }
    const topic = parsed(review)
    expect(topic.morseReview).toEqual(review)

    // Export is the stored record, so re-importing it has to be a fixed point.
    const again = parseLibrary(JSON.parse(JSON.stringify({ version: 5, topics: [topic] })))
    expect(again.ok && again.library.topics[0].morseReview).toEqual(review)
  })

  it('round-trips an unrepaired miss, and keeps its absence absent', () => {
    const owed = { sittings: 2, items: { 'item-1': { ...ITEM, missedIn: 2 } } }
    expect(parsed(owed).morseReview).toEqual(owed)

    // A repaired character and one that was never missed have to serialise
    // identically, or "owes nothing" would have two representations.
    expect(parsed({ sittings: 2, items: { 'item-1': ITEM } }).morseReview?.items['item-1'])
      .not.toHaveProperty('missedIn')
  })

  /**
   * The conservative half of this field's migration. Nothing was recording
   * misses before it existed, so a record written then owes nothing — which is
   * the honest reading rather than a generous one.
   */
  it('reads a record written before the repair debt existed as owing nothing', () => {
    expect(parsed({ sittings: 2, items: { 'item-1': ITEM } }).morseReview?.items['item-1'].missedIn)
      .toBeUndefined()
  })

  it('normalises pre-#96 history without a printed counter conservatively', () => {
    const legacy = { ...ITEM }
    delete (legacy as Partial<typeof ITEM>).printed
    expect(parsed({ sittings: 2, items: { 'item-1': legacy } }).morseReview)
      .toEqual({ sittings: 2, items: { 'item-1': { ...legacy, printed: 0 } } })
  })

  /**
   * The conservative half of the migration. A record written before this field
   * existed reads as no history, never as back-filled successes.
   */
  it('treats an older v5 record with no history as having none', () => {
    const result = parseLibrary({ version: 5, topics: [currentTopic({ items: MORSE_ITEMS })] })
    expect(result.ok && result.library.topics[0]).not.toHaveProperty('morseReview')
  })

  it('ignores the field on a pre-v5 record, which had no durable item identity', () => {
    const result = parseLibrary({
      version: 4,
      topics: [legacyTopic({ morseReview: { sittings: 3, items: {} } })],
    })
    expect(result.ok && result.library.topics[0]).not.toHaveProperty('morseReview')
  })

  it('normalises a history that records nothing back to the absent field', () => {
    expect(parsed({ sittings: 0, items: {} })).not.toHaveProperty('morseReview')
  })

  it('rejects counters no run could have produced', () => {
    expect(rejection({ sittings: -1, items: {} })).toContain('sittings must be a non-negative integer')
    // The current sitting is only ever `sittings + 1`, so 4 is unreachable at 2.
    expect(rejection({ sittings: 2, items: { 'item-1': { ...ITEM, introducedIn: 4 } } }))
      .toContain('outside this record')
    expect(rejection({ sittings: 2, items: { 'item-1': { ...ITEM, lastSeenIn: 9 } } }))
      .toContain('outside this record')
    expect(rejection({ sittings: 2, items: { 'item-1': { ...ITEM, introducedIn: 2, lastSeenIn: 1 } } }))
      .toContain('last seen before it was introduced')
    // Introduced in sitting 1 with 2 completed sittings gives at most 2 chances.
    expect(rejection({ sittings: 2, items: { 'item-1': { ...ITEM, laterCorrect: 5 } } }))
      .toContain('more later-sitting successes')
    expect(rejection({ sittings: 2, items: { 'item-1': { ...ITEM, printed: 0 } } }))
      .toContain('more later-sitting successes than printed retrievals')
    expect(rejection({ sittings: 2, items: { 'item-1': { ...ITEM, heard: 1, heardCorrect: 2 } } }))
      .toContain('more correct listening answers')
    expect(rejection({ sittings: 2, items: { 'item-1': { ...ITEM, heard: 1.5 } } }))
      .toContain('non-negative integer counters')
    // A character cannot have been missed before it was introduced, or in a
    // sitting this record has not reached.
    expect(rejection({ sittings: 2, items: { 'item-1': { ...ITEM, introducedIn: 2, lastSeenIn: 2, laterCorrect: 0, missedIn: 1 } } }))
      .toContain('miss outside the sittings it existed for')
    expect(rejection({ sittings: 2, items: { 'item-1': { ...ITEM, missedIn: 9 } } }))
      .toContain('miss outside the sittings it existed for')
    expect(rejection({ sittings: 2, items: { 'item-1': { ...ITEM, missedIn: -1 } } }))
      .toContain('non-negative integer counters')
  })

  it('rejects a record naming an item this topic does not have', () => {
    expect(rejection({ sittings: 1, items: { 'item-9': ITEM } }))
      .toContain('unknown item id "item-9"')
  })

  it('rejects a malformed history rather than silently dropping it', () => {
    expect(rejection('two sittings')).toContain('morseReview must be an object')
    expect(rejection({ sittings: 1, items: 'none' })).toContain('items must be an object')
    expect(rejection({ sittings: 1, items: { 'item-1': 'settled' } }))
      .toContain('must be an object')
  })
})

describe('post-acquisition fluency statistics are durable and portable (#119)', () => {
  function withFluency(morseFluency: unknown): Record<string, unknown> {
    return { version: 5, topics: [currentTopic({ morseFluency })] }
  }

  function parsed(morseFluency: unknown) {
    const result = parseLibrary(withFluency(morseFluency))
    if (!result.ok) throw new Error(result.error)
    return result.library.topics[0]
  }

  function rejection(morseFluency: unknown): string {
    const result = parseLibrary(withFluency(morseFluency))
    if (result.ok) throw new Error('Expected the import to be rejected.')
    return result.error
  }

  const RECORD = {
    rung: 9,
    characters: { E: { heard: 4, correct: 3, recentLatencyMs: [420, 460, 500] } },
    bests: { sprint: 61 },
  }

  it('round-trips losslessly', () => {
    expect(parsed(RECORD).morseFluency).toEqual(RECORD)
  })

  it('reads an absent field as a learner who has done no fluency', () => {
    expect(parsed(undefined).morseFluency).toBeUndefined()
  })

  /**
   * A record that says nothing normalises back to absent, exactly as
   * `morseReview` does, so "no fluency yet" has one representation in a stored
   * or exported library rather than two.
   */
  it('normalises an empty record back to absent', () => {
    expect(parsed({ rung: 6, characters: {}, bests: {} }).morseFluency).toBeUndefined()
  })

  it('rejects a rung that is not on the ladder', () => {
    expect(rejection({ rung: 5, characters: {} })).toContain('rung')
  })

  it('rejects a letter that is not Morse', () => {
    expect(
      rejection({ rung: 6, characters: { '4': { heard: 1, correct: 1, recentLatencyMs: [] } } }),
    ).toContain('unknown letter')
  })

  it('rejects impossible counters', () => {
    expect(
      rejection({ rung: 6, characters: { E: { heard: 1, correct: 4, recentLatencyMs: [] } } }),
    ).toContain('more correct answers than exposures')
  })

  it('rejects more latencies than correct answers', () => {
    expect(
      rejection({ rung: 6, characters: { E: { heard: 2, correct: 1, recentLatencyMs: [1, 2] } } }),
    ).toContain('more latencies than correct answers')
  })

  it('never lets fluency reach evidence, retention or completion', () => {
    const topic = parsed(RECORD)
    expect(topic.itemEvidence).toEqual({})
    expect(topic.lastTestedAt).toBeNull()
    expect(topic.completedAt).toBeNull()
    expect(topic.history).toEqual([])
  })
})

/**
 * The attempt log, validated like every other durable field.
 *
 * It used to be cast straight out of the file, which meant an edited or
 * corrupted export could put anything at all into the record the topic page
 * renders as the learner's test history. It is validated now, and a malformed
 * entry is dropped rather than repaired: dropping loses a line of the account,
 * clamping invents a test result that never happened.
 */
describe('the attempt log is validated rather than trusted', () => {
  const attempt = { at: timestamp, correct: 2, total: 2, resolvedTo: 'drilled' as const }
  const later = { at: '2026-09-01T00:00:00.000Z', correct: 1, total: 2, resolvedTo: 'learning' as const }

  function historyOf(history: unknown) {
    const topic = currentTopic()
    if (history === undefined) delete topic.history
    else topic.history = history
    const result = parseLibrary({ version: 5, topics: [topic] })
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    return result.library.topics[0].history
  }

  it('round-trips a real attempt losslessly', () => {
    expect(historyOf([attempt, later])).toEqual([attempt, later])
  })

  it('reads a missing history field as a topic that has never been tested', () => {
    expect(historyOf(undefined)).toEqual([])
  })

  it('reads a history that is not a list as no attempts at all', () => {
    expect(historyOf('two attempts')).toEqual([])
  })

  it('drops a malformed entry and keeps the sound ones around it', () => {
    // The middle entry has a date and nothing else, which is what a truncated
    // or hand-edited export produces.
    expect(historyOf([attempt, { at: timestamp }, later])).toEqual([attempt, later])
  })

  it('drops an entry whose counters are text rather than numbers', () => {
    expect(historyOf([{ ...attempt, correct: '2' }])).toEqual([])
  })

  it('never fabricates a counter to keep an entry', () => {
    // The failure this guards against is a clamp: a zeroed `correct` would read
    // as a test the learner sat and failed.
    const kept = historyOf([{ at: timestamp, total: 2, resolvedTo: 'drilled' }])
    expect(kept).toEqual([])
  })

  it('drops a score no run could have produced', () => {
    expect(historyOf([{ ...attempt, correct: 3, total: 2 }])).toEqual([])
    expect(historyOf([{ ...attempt, correct: -1 }])).toEqual([])
    expect(historyOf([{ ...attempt, total: Number.NaN }])).toEqual([])
  })

  it('drops an entry whose date does not resolve', () => {
    // An `Invalid Date` in the fold reads as a test that happened at an
    // unknowable time, which is worse than one line fewer.
    expect(historyOf([{ ...attempt, at: 'last Tuesday' }])).toEqual([])
    expect(historyOf([{ ...attempt, at: '' }])).toEqual([])
  })

  it('drops an entry that resolved to a rung the ladder does not have', () => {
    expect(historyOf([{ ...attempt, resolvedTo: 'mastered' }])).toEqual([])
  })
})

describe('parsing is deterministic', () => {
  const fixed = new Date('2027-03-04T05:06:07.000Z')

  it('stamps a record with no createdAt from the clock it was given', () => {
    // `parseLibrary` fabricates this one field, so it has to be told what
    // "now" is rather than reaching for it — otherwise the one place the
    // parser invents a value is the one place it cannot be tested.
    const topic = currentTopic()
    delete topic.createdAt
    const result = parseLibrary({ version: 5, topics: [topic] }, fixed)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.library.topics[0].createdAt).toBe('2027-03-04T05:06:07.000Z')
  })

  it('leaves a record that already has one untouched', () => {
    const result = parseLibrary({ version: 5, topics: [currentTopic()] }, fixed)
    expect(result.ok && result.library.topics[0].createdAt).toBe(timestamp)
  })
})
