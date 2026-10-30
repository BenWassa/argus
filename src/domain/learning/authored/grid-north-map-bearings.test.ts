import { describe, expect, it } from 'vitest'
import { A4_DIAGRAMS, A4_DIRECT_CASES, A4_MIXED_CASES, A4_TWO_STEP_CASES } from '../../navigation/bearingBanks'
import { bearingTopics } from '../../navigation/bearingTopics'
import { convert, formatBearing, gridDeclination, normalize, reciprocal } from '../../navigation/bearings'
import { askedItemIds, checkCurriculum } from '../stages'
import { gridNorthMapBearingsCurriculum as curriculum } from './grid-north-map-bearings'

const topic = bearingTopics().find(topic => topic.id === 'grid-north-map-bearings')!
const steps = curriculum.stages.flatMap(stage => stage.steps)

describe('Grid North & Map Bearings authored curriculum', () => {
  it('covers the real scored boundary and supplies every shown figure’s alt text', () => {
    expect(topic.items).toHaveLength(12)
    const figureItemIds = new Set(topic.items.filter(item => item.stimulus?.source.kind === 'figure').map(item => item.id!))
    expect(figureItemIds.size).toBe(4)
    expect(checkCurriculum(curriculum, new Set(topic.items.map(item => item.id!)), {
      requireFullCoverage: true, figureItemIds,
    })).toEqual([])
    expect(new Set(steps.filter(step => step.kind === 'show' && figureItemIds.has(step.itemId!))
      .map(step => 'itemId' in step && step.itemId))).toEqual(figureItemIds)
  })

  it('uses unique readable ids and closes each short stage over its own items', () => {
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

  it('reads the actual diagram data without measuring exaggerated angles', () => {
    const order = steps.find(step => step.id === 'grid-diagram-order')!
    if (order.kind !== 'order') throw new Error('Expected an order step')
    expect(order.blocks.join(' → ')).toBe(A4_DIAGRAMS[2].answer(A4_DIAGRAMS[2].rays))
    expect(order.blocks.join(' → ')).toBe(topic.items[2].answer)
    const east = A4_DIAGRAMS[0].rays.find(ray => ray.ref === 'M')!
    expect(east.angle).toBeGreaterThan(0)
    const west = A4_DIAGRAMS[1].rays.find(ray => ray.ref === 'G')!
    expect(west.angle).toBeLessThan(0)
  })

  it('verifies every arithmetic answer against real conversions and reciprocals', () => {
    const expected = new Map<string, string>()
    A4_DIRECT_CASES.forEach(({ from, bearing, gd }, index) => {
      const offsets = { D: gd, C: 0 }
      expect(gridDeclination(offsets)).toBe(gd)
      const to = from === 'G' ? 'M' : 'G'
      expected.set(topic.items[index + 4].id!, formatBearing(convert(bearing, from, to, offsets), to))
    })
    A4_MIXED_CASES.forEach(({ from, to, bearing, D, C }, index) => {
      expected.set(topic.items[index + 8].id!, formatBearing(convert(bearing, from, to, { D, C }), to))
    })
    A4_TWO_STEP_CASES.forEach(({ from, to, bearing, D, C }, index) => {
      const converted = convert(bearing, from, to, { D, C })
      const back = reciprocal(converted)
      expect(convert(reciprocal(bearing), from, to, { D, C })).toBe(back)
      expected.set(topic.items[index + 10].id!, formatBearing(back, to))
    })
    const numeric = steps.filter(step => (step.kind === 'choose' || step.kind === 'complete') && /^\d{3}°[TMG]$/.test(step.answer))
    expect(numeric).toHaveLength(9)
    expect(new Set(numeric.map(step => 'itemId' in step && step.itemId))).toEqual(new Set(expected.keys()))
    for (const step of numeric) {
      if (step.kind !== 'choose' && step.kind !== 'complete') throw new Error('Expected an objective step')
      // This scaffold asks for the forward conversion, before the bank's back bearing.
      if (step.id === 'grid-back-forward') {
        expect(step.answer).toBe(formatBearing(convert(60, 'G', 'M', { D: 10, C: 0 }), 'M'))
      } else {
        expect(step.answer, step.id).toBe(expected.get(step.itemId))
        expect(step.answer, step.id).toBe(topic.items.find(item => item.id === step.itemId)!.answer)
      }
    }
  })

  it('verifies each worked trace and both routes to the magnetic back bearing', () => {
    const gm = convert(104, 'G', 'M', { D: 8, C: 0 })
    const mg = convert(47, 'M', 'G', { D: 11, C: 0 })
    const signed = convert(214, 'M', 'G', { D: 9, C: -3 })
    const forward = convert(60, 'G', 'M', { D: 10, C: 0 })
    const back = reciprocal(forward)
    const otherRoute = convert(reciprocal(60), 'G', 'M', { D: 10, C: 0 })
    expect(otherRoute).toBe(back)
    const wrappedForward = convert(330, 'M', 'G', { D: -8, C: 2 })
    const wrappedBack = reciprocal(wrappedForward)
    expect(wrappedBack).toBe(normalize(500))
    const worked: Record<string, string> = {
      'grid-margin-show-to-m': `For magnetic north g degrees east of grid north, M = G − g. With 104°G and g = +8°, 104 − 8 = ${gm}: ${formatBearing(gm, 'M')}.`,
      'grid-margin-show-to-g': `In the other direction, G = M + g. With 047°M and g = +11°, 47 + 11 = ${mg}: ${formatBearing(mg, 'G')}.`,
      'grid-offsets-show-west-c': `G = M + D − C. With 214°M, D = +9° and C = −3°, 214 + 9 − (−3) = ${signed}: ${formatBearing(signed, 'G')}.`,
      'grid-back-show-conversion': `MN is 10° east of GN. Convert the 060°G line: M = G − 10° = ${formatBearing(forward, 'M')}.`,
      'grid-back-show-check': `Convert then reciprocate: ${formatBearing(forward, 'M')} + 180° = ${formatBearing(back, 'M')}. Reciprocate then convert: ${formatBearing(reciprocal(60), 'G')} − 10° = ${formatBearing(otherRoute, 'M')}. Both routes agree.`,
      'grid-back-show-wrap': `G = M + D − C: 330 − 8 − 2 = ${formatBearing(wrappedForward, 'G')}. Its reciprocal is ${wrappedForward} + 180 = ${wrappedForward + 180}°, normalized to ${formatBearing(wrappedBack, 'G')}.`,
    }
    for (const [id, expected] of Object.entries(worked)) {
      const step = steps.find(step => step.id === id)!
      if (step.kind !== 'show') throw new Error('Expected a worked show step')
      expect(step.body, id).toBe(expected)
    }
  })
})
