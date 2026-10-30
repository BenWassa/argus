import { describe, expect, it } from 'vitest'
import { A3_CASES } from '../../navigation/bearingBanks'
import { bearingTopics } from '../../navigation/bearingTopics'
import { convert, formatBearing, normalize } from '../../navigation/bearings'
import { askedItemIds, checkCurriculum } from '../stages'
import { northReferencesDeclinationCurriculum as curriculum } from './north-references-declination'

const topic = bearingTopics().find(topic => topic.id === 'north-references-declination')!
const steps = curriculum.stages.flatMap(stage => stage.steps)

describe('True & Magnetic North authored curriculum', () => {
  it('covers the real scored boundary with accessible figures', () => {
    expect(topic.items).toHaveLength(16)
    expect(checkCurriculum(curriculum, new Set(topic.items.map(item => item.id!)), {
      requireFullCoverage: true,
      figureItemIds: new Set(topic.items.filter(item => item.stimulus?.source.kind === 'figure').map(item => item.id!)),
    })).toEqual([])
  })

  it('uses stable unique ids and ends every short stage with its own items', () => {
    expect(new Set(curriculum.stages.map(stage => stage.id)).size).toBe(curriculum.stages.length)
    expect(new Set(steps.map(step => step.id)).size).toBe(steps.length)
    for (const stage of curriculum.stages) {
      expect(stage.id).not.toMatch(/^lesson-\d+$/)
      expect(stage.title.length).toBeLessThanOrEqual(40)
      expect(stage.steps.length).toBeGreaterThanOrEqual(6)
      expect(stage.steps.length).toBeLessThanOrEqual(12)
      const checkpoint = stage.steps.at(-1)!
      expect(checkpoint.kind).toBe('checkpoint')
      if (checkpoint.kind !== 'checkpoint') throw new Error('Expected a final checkpoint')
      const earlier = stage.steps.slice(0, -1)
      const asked = new Set(earlier.flatMap(askedItemIds))
      expect(new Set(checkpoint.itemIds)).toEqual(asked)
      for (const step of earlier) {
        if (step.kind === 'show' && step.itemId) expect(asked.has(step.itemId)).toBe(true)
      }
    }
  })

  it('checks every arithmetic choose and complete against convert and the bank', () => {
    const arithmetic = steps.filter(step => (step.kind === 'choose' || step.kind === 'complete') && /^\d{3}°[TM]$/.test(step.answer))
    expect(arithmetic).toHaveLength(A3_CASES.length)
    const cases = new Map(A3_CASES.map((value, index) => [topic.items[index + 4].id!, value]))
    expect(new Set(arithmetic.map(step => 'itemId' in step && step.itemId))).toEqual(new Set(cases.keys()))
    for (const step of arithmetic) {
      if (step.kind !== 'choose' && step.kind !== 'complete') throw new Error('Expected an objective step')
      const spec = cases.get(step.itemId)!
      const to = spec.from === 'T' ? 'M' : 'T'
      const expected = formatBearing(convert(spec.bearing, spec.from, to, { D: spec.D, C: 0 }), to)
      expect(step.answer, step.id).toBe(expected)
      expect(step.answer, step.id).toBe(topic.items.find(item => item.id === step.itemId)!.answer)
    }
  })

  it('verifies the worked examples, including both wrap directions', () => {
    const tm = (bearing: number, D: number) => convert(bearing, 'T', 'M', { D, C: 0 })
    const mt = (bearing: number, D: number) => convert(bearing, 'M', 'T', { D, C: 0 })
    const worked: Record<string, string> = {
      'north-to-m-show-east': `Name the starting and target norths. M = T − D. With 090°T and D = +10°, 90 − 10 = ${tm(90, 10)}: ${formatBearing(tm(90, 10), 'M')}.`,
      'north-to-m-show-west': `M = T − D still applies when D is west. With 070°T and D = −12°, 70 − (−12) = ${tm(70, -12)}: ${formatBearing(tm(70, -12), 'M')}.`,
      'north-to-t-show-east': `For magnetic to true, T = M + D. With 130°M and D = +9°, 130 + 9 = ${mt(130, 9)}: ${formatBearing(mt(130, 9), 'T')}.`,
      'north-to-t-show-west': `T = M + D keeps D’s sign. With 082°M and D = −12°, 82 + (−12) = ${mt(82, -12)}: ${formatBearing(mt(82, -12), 'T')}.`,
      'north-wrap-show-below': `005°T with D = +10° gives 5 − 10 = −${Math.abs(5 - 10)}°. Normalize to 000°–359°: −5° becomes ${formatBearing(tm(5, 10), 'M')}.`,
      'north-wrap-show-above': `358°M with D = +7° gives 358 + 7 = ${358 + 7}°. Normalize to 000°–359°: 365° becomes ${formatBearing(mt(358, 7), 'T')}.`,
    }
    expect(tm(5, 10)).toBe(normalize(-5))
    expect(mt(358, 7)).toBe(normalize(365))
    for (const [id, expected] of Object.entries(worked)) {
      const step = steps.find(step => step.id === id)!
      if (step.kind !== 'show') throw new Error('Expected a worked show step')
      expect(step.body, id).toBe(expected)
    }
  })
})
