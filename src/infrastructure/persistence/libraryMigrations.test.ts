import { describe, expect, it } from 'vitest'
import { catalogDefinition } from '../../domain/library/catalog'
import type { CurrentLibrary } from '../../domain/library/library'
import type { Topic } from '../../domain/library/topic'
import { seedLibrary } from '../../domain/library/catalogSeed'
import { reconcileLoadedLibrary, refreshShippedLearn, upgradeSeededScubaEquipment } from './libraryMigrations'

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
