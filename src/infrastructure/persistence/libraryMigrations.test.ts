import { describe, expect, it } from 'vitest'
import { catalogDefinition } from '../../domain/library/catalog'
import type { CurrentLibrary } from '../../domain/library/library'
import type { Topic } from '../../domain/library/topic'
import { seedLibrary } from '../../domain/library/catalogSeed'
import { reconcileLoadedLibrary, refreshShippedLearn, refreshShippedScopes, upgradeSeededScubaEquipment } from './libraryMigrations'

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
    expect(topic.learn?.sections?.find((section) => section.heading === 'The scale')?.blocks[0].type).toBe('entries')
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

describe('the #121 scuba expansion', () => {
  const at = '2026-08-01T00:00:00.000Z'
  const V1 = [
    ['SCUBA', 'Self-contained underwater breathing apparatus — equipment that lets a diver breathe underwater from a carried gas supply.'],
    ['BCD', 'Buoyancy control device — the buoyancy bladder/system that helps a diver control buoyancy and commonly holds the cylinder.'],
    ['SPG', 'Submersible pressure gauge — an instrument that displays the pressure, and therefore remaining gas, in a cylinder.'],
    ['LPI', 'Low-pressure inflator — the hose and fitting that supplies low-pressure gas from a regulator to inflate a BCD.'],
    ['DSMB', 'Delayed surface marker buoy — an inflatable surface-signalling buoy deployed from underwater.'],
    ['DPV', 'Diver propulsion vehicle — a powered device used to propel a diver through the water.'],
  ].map(([prompt, answer], index) => ({
    id: `scuba-equipment-abbreviations-item-${String(index + 1).padStart(2, '0')}`,
    kind: 'forward' as const,
    prompt,
    answer,
  }))

  function bankedSixCard(overrides: Partial<Topic> = {}): Topic {
    return {
      ...seedLibrary().topics.find((topic) => topic.id === 'scuba-equipment-abbreviations')!,
      title: 'Recreational scuba equipment abbreviations',
      scope: 'Old six-card boundary.',
      items: V1,
      origin: 'catalog',
      status: 'completed',
      learningAt: at,
      drilledAt: at,
      completedAt: at,
      lastTestedAt: at,
      spotCheckedAt: at,
      history: [{ at, correct: 6, total: 6, resolvedTo: 'completed' }],
      itemEvidence: {
        [V1[0].id]: {
          cue: 'free',
          directions: {
            'prompt-to-answer': {
              attempts: 2, correct: 2, unassistedCorrect: 2, consecutiveCorrect: 2,
              lastAt: at, lastLatencyMs: 900,
            },
          },
        },
      },
      ...overrides,
    }
  }

  it('upgrades the exact six-card baseline, keeps its evidence, and reopens the stronger boundary', () => {
    const old = bankedSixCard()
    const first = upgradeSeededScubaEquipment({ version: 5, topics: [old] })
    const [upgraded] = first.topics

    expect(upgraded.items).toHaveLength(13)
    expect(upgraded.items.slice(0, 6).map((item) => item.id)).toEqual(V1.map((item) => item.id))
    expect(upgraded.itemEvidence).toEqual(old.itemEvidence)
    expect(upgraded.history).toEqual(old.history)
    expect(upgraded).toMatchObject({ status: 'learning', drilledAt: null, completedAt: null, spotCheckedAt: null })
    expect(upgradeSeededScubaEquipment(first)).toEqual(first)
  })

  it('arrives at the short shipped title through the whole load path', () => {
    const { library } = reconcileLoadedLibrary({ version: 5, topics: [bankedSixCard()], catalogDelivered: ['scuba-equipment-abbreviations'] })
    expect(library.topics.find((topic) => topic.id === 'scuba-equipment-abbreviations')?.title).toBe('SCUBA Equipment')
  })

  it('leaves a user-authored or edited six-card topic alone', () => {
    const userOwned = bankedSixCard({ origin: 'user' })
    expect(upgradeSeededScubaEquipment({ version: 5, topics: [userOwned] }).topics[0]).toEqual(userOwned)
    const edited = bankedSixCard({ items: V1.map((item, index) => (index === 5 ? { ...item, answer: 'Scooter.' } : item)) })
    expect(upgradeSeededScubaEquipment({ version: 5, topics: [edited] }).topics[0]).toEqual(edited)
  })

  it('leaves an unstarted six-card topic unstarted', () => {
    const fresh = bankedSixCard({ status: 'unstarted', completedAt: null, drilledAt: null, learningAt: null, history: [] })
    const [upgraded] = upgradeSeededScubaEquipment({ version: 5, topics: [fresh] }).topics
    expect(upgraded.items).toHaveLength(13)
    expect(upgraded.status).toBe('unstarted')
  })
})

describe('the #166 prose trims reach libraries that already hold the topic', () => {
  const at = '2026-09-20T00:00:00.000Z'

  /** A trimmed topic as a library received it before its prose was trimmed. */
  function beforeTheTrim(id: string, overrides: Partial<Topic> = {}): Topic {
    const shipped = catalogDefinition(id)
    if (!shipped) throw new Error(`${id} is not shipped`)
    return {
      ...shipped,
      origin: 'catalog',
      status: 'learning',
      learningAt: at,
      lastTestedAt: at,
      history: [{ at, correct: 1, total: shipped.items.length, resolvedTo: 'learning' }],
      learn: { kind: 'briefing', overview: 'The old, longer overview.', limitations: ['An old limitation.'] },
      ...overrides,
    }
  }

  describe.each(['ooda-loop', 'primary-survey', 'firearm-safety-acts-prove', 'whole-circle-bearings', 'reciprocal-bearings', 'north-references-declination', 'grid-north-map-bearings', 'navigation-lights', 'vessel-day-shapes', 'signal-flags', 'beaufort-wind-scale', 'scuba-equipment-abbreviations', 'radiotelephony-numbers', 'si-prefixes', 'greek-alphabet', 'hex-digits-binary', 'international-morse-letters-printed'])('%s', (id) => {
    it('swaps in the trimmed Learn and leaves every learner field exactly as it was', () => {
      const old = beforeTheTrim(id)
      const [topic] = refreshShippedLearn({ version: 5, topics: [old] }).topics

      expect(topic.learn).toEqual(catalogDefinition(id)?.learn)
      expect({ ...topic, learn: old.learn }).toEqual(old)
    })

    it('is idempotent, so two devices agree', () => {
      const once = refreshShippedLearn({ version: 5, topics: [beforeTheTrim(id)] })
      expect(refreshShippedLearn(once)).toBe(once)
    })

    it('does not touch a topic whose scored boundary was edited', () => {
      const edited = beforeTheTrim(id, { items: catalogDefinition(id)!.items.slice(0, -1) })
      const input: CurrentLibrary = { version: 5, topics: [edited] }
      expect(refreshShippedLearn(input)).toBe(input)
    })
  })
})


describe('the visible Primary Survey safety boundary (#166)', () => {
  const oldScope = 'The five ABCDE headings in assessment order — Airway, Breathing, Circulation, Disability, Exposure. Test covers the headings and order only.'
  const old = { ...catalogDefinition('primary-survey')!, origin: 'catalog' as const, scope: oldScope }

  it('updates only the exact former scope, preserves progress, and is idempotent', () => {
    const input: CurrentLibrary = { version: 5, topics: [old] }
    const once = refreshShippedScopes(input)
    expect(once.topics[0].scope).toContain('not first-aid or clinical training')
    expect({ ...once.topics[0], scope: oldScope }).toEqual(old)
    expect(refreshShippedScopes(once)).toBe(once)
    expect(reconcileLoadedLibrary(input).library.topics[0].scope).toBe(once.topics[0].scope)
  })

  it('preserves custom scopes, user ownership, and edited scored items', () => {
    for (const topic of [
      { ...old, scope: 'My own scope.' },
      { ...old, origin: 'user' as const },
      { ...old, items: old.items.slice(1) },
    ]) {
      const input: CurrentLibrary = { version: 5, topics: [topic] }
      expect(refreshShippedScopes(input)).toBe(input)
    }
  })
})

describe('Learn refresh respects the complete scored identity', () => {
  it('preserves explanatory support when the learner edits the scope', () => {
    const input = library(beforeTheRewrite({ scope: 'My narrower scope.' }))
    expect(refreshShippedLearn(input)).toBe(input)
  })

  it.each(['id', 'kind', 'choice'] as const)('preserves support when an item’s %s was edited', (field) => {
    const old = beforeTheRewrite()
    old.items = old.items.map((item, i) => i ? item : {
      ...item,
      ...(field === 'id' ? { id: 'custom-id' } : field === 'kind' ? { kind: 'bidirectional' as const } : {
        choice: { options: [item.answer, 'Custom alternative'] },
      }),
    })
    const input = library(old)
    expect(refreshShippedLearn(input)).toBe(input)
  })
})
