import { describe, expect, it } from 'vitest'
import { A1_FIND_BEARINGS, A1_READ_BEARINGS, A2_CASES, A3_CASES, A4_DIRECT_CASES, A4_MIXED_CASES, A4_TWO_STEP_CASES } from './bearingBanks'
import { convert, formatBearing, reciprocal } from './bearings'
import { bearingFormativeCase, STAGES, TOPICS } from './formativeCases'

const CASES = TOPICS.flatMap(topic => STAGES[topic].flatMap(stage =>
  Array.from({ length: 6 }, (_, ordinal) => bearingFormativeCase(topic, stage, 23, ordinal))))

const FIXTURES = [
  ['cardinal-bearings', 'mixed-eight', '135°'],
  ['whole-circle-bearings', 'close-to-north', '359°T'],
  ['whole-circle-bearings', 'finding-the-ray', 'Ray A'],
  ['reciprocal-bearings', 'checking-the-return', '000°G'],
  ['north-references-declination', 'wrapping-through-north', '032°T'],
  ['grid-north-map-bearings', 'using-the-map-margin', '018°M'],
  ['grid-north-map-bearings', 'converting-a-back-bearing', '177°G'],
] as const

describe('#323 isolated navigation formative exercise bank', () => {
  it('pins examples for deterministic browser tests and offline replay', () => {
    for (const [topic, stage, answer] of FIXTURES) {
      const item = bearingFormativeCase(topic, stage, 23, 2)
      expect(item.answer, stage).toBe(answer)
      expect(item).toEqual(bearingFormativeCase(topic, stage, 23, 2))
      expect(item.id).toBe(topic + ':' + stage + ':v1:n:2')
      expect(item.evidence).toBe('formative-only')
    }
  })
  it('has identifiable stages, unique cases and diagnosed incorrect answers', () => {
    expect(TOPICS).toHaveLength(5)
    expect(CASES.length).toBeGreaterThan(100)
    expect(new Set(CASES.map(x => x.id)).size).toBe(CASES.length)
    for (const c of CASES) {
      expect(c.options, c.id).toHaveLength(4)
      expect(new Set(c.options).size, c.id).toBe(4)
      expect(c.options.some(option => /360°/.test(option)), c.id).toBe(false)
      expect(c.options.filter(v => v === c.answer), c.id).toHaveLength(1)
      const wrong = c.options.filter(x => x !== c.answer)
      expect(Object.keys(c.wrongFeedback).sort(), c.id).toEqual([...wrong].sort())
      for (const option of wrong) expect(c.wrongFeedback[option].length, c.id).toBeGreaterThan(23)
      expect(c.explanation.length, c.id).toBeGreaterThan(25)
      expect(c.workings.length).toBeGreaterThan(0)
      if (c.figure) {
        expect(c.figureAlt).toBeTruthy()
        expect(c.figureAlt).not.toContain(c.answer)
      }
    }
  })
  it('uses the original mathematics for every arithmetic answer and intermediate', () => {
    for (const c of CASES) {
      const x = c.inputs
      if (typeof x.bearing !== 'number') continue
      if (x.from && x.to) {
        const offsets = typeof x.gd === 'number' ? { D: x.gd, C: 0 } : { D: x.D as number, C: x.C as number }
        const converted = convert(x.bearing, x.from as 'T' | 'M' | 'G', x.to as 'T' | 'M' | 'G', offsets)
        const result = c.kind === 'two-step' ? reciprocal(converted) : converted
        expect(c.answer, c.id).toBe(formatBearing(result, x.to as 'T' | 'M' | 'G'))
        if (c.intermediate) {
          expect(c.intermediate.answer).toBe(formatBearing(converted, x.to as 'T' | 'M' | 'G'))
          expect(c.intermediate.options).toContain(c.intermediate.answer)
          expect(new Set(c.intermediate.options).size).toBe(4)
          expect(Object.keys(c.intermediate.wrongFeedback)).toHaveLength(3)
          expect(convert(reciprocal(x.bearing), x.from as 'T' | 'M' | 'G', x.to as 'T' | 'M' | 'G', offsets)).toBe(result)
        }
      } else if (c.topicId === 'reciprocal-bearings') {
        expect(c.answer).toBe(formatBearing(reciprocal(x.bearing), x.reference as 'T' | 'M' | 'G'))
      }
    }
  })
  it('renders figure inputs through the shipped figure kinds; never infers an answer from pixel positions', () => {
    for (const c of CASES) {
      if (!c.figure) continue
      expect(['angle-dial', 'north-reference']).toContain(c.figure.kind)
      if (c.figure.kind === 'angle-dial') {
        expect(c.figure.pointers.length).toBeGreaterThan(0)
        expect(c.figure.pointers.length).toBeLessThanOrEqual(4)
        if (c.kind === 'read-ray') {
          expect(c.figure.pointers[0].bearing).toBe(c.inputs.bearing)
          expect(c.answer).toBe(formatBearing(c.figure.pointers[0].bearing, 'T'))
        }
        if (c.kind === 'find-ray') {
          const right = c.figure.pointers.find(p => 'Ray ' + p.label === c.answer)
          expect(right?.bearing).toBe(c.inputs.bearing ?? c.inputs.angle)
        }
      }
    }
  })
  it('generates different non-bank exercises without changing any scored items', () => {
    const read = new Set<number>([...A1_READ_BEARINGS, ...A1_FIND_BEARINGS])
    const a2 = new Set(A2_CASES.map(c => c.bearing))
    for (const c of CASES) {
      if (c.topicId === 'whole-circle-bearings') expect(read.has(c.inputs.bearing as number), c.id).toBe(false)
      if (c.topicId === 'reciprocal-bearings') expect(a2.has(c.inputs.bearing as number), c.id).toBe(false)
      if (c.topicId === 'north-references-declination' && c.inputs.from) {
        expect(A3_CASES.some(x => x.from === c.inputs.from && x.bearing === c.inputs.bearing && x.D === c.inputs.D), c.id).toBe(false)
      }
      if (c.topicId === 'grid-north-map-bearings' && c.inputs.from) {
        expect(A4_DIRECT_CASES.some(x => x.from === c.inputs.from && x.bearing === c.inputs.bearing && x.gd === c.inputs.gd), c.id).toBe(false)
        expect(A4_MIXED_CASES.some(x => x.from === c.inputs.from && x.bearing === c.inputs.bearing && x.D === c.inputs.D && x.C === c.inputs.C), c.id).toBe(false)
        expect(A4_TWO_STEP_CASES.some(x => x.from === c.inputs.from && x.bearing === c.inputs.bearing && x.D === c.inputs.D && x.C === c.inputs.C), c.id).toBe(false)
      }
    }
  })
  it('exhausts each finite content cycle before repeating, independently of ids', () => {
    const cycles = [
      [4, 4, 8, 8], [5, 7, 12, 20], [15, 15, 15, 15],
      [3, 24, 6, 6, 16], [6, 16, 6, 6],
    ]
    for (const [t, topic] of TOPICS.entries()) for (const [s, stage] of STAGES[topic].entries()) {
      const length = cycles[t][s]
      for (const seed of [0, 4, 11, 23]) {
        const content = (ordinal: number) => {
          const { id, ...item } = bearingFormativeCase(topic, stage, seed, ordinal)
          expect(id).toBe(topic + ':' + stage + ':v1:' + seed.toString(36) + ':' + ordinal)
          expect(item).toEqual((({ id: _, ...rest }) => rest)(bearingFormativeCase(topic, stage, seed, ordinal)))
          return JSON.stringify(item)
        }
        const samples = Array.from({ length }, (_, ordinal) => content(ordinal))
        expect(new Set(samples).size, stage + ':' + seed).toBe(length)
        expect(content(length), stage).toBe(samples[0])
      }
    }
    const first = bearingFormativeCase('north-references-declination', 'wrapping-through-north', 0, 0)
    const fourth = bearingFormativeCase('north-references-declination', 'wrapping-through-north', 4, 0)
    expect(first.inputs).not.toEqual(fourth.inputs)
  })
  it('pins independently calculated north-crossing and signed conversion fixtures', () => {
    const fixtures = [
      ['north-references-declination', 'wrapping-through-north', { bearing: 350, D: 16, from: 'M' }, '006°T'],
      ['north-references-declination', 'wrapping-through-north', { bearing: 10, D: -16, from: 'M' }, '354°T'],
      ['north-references-declination', 'wrapping-through-north', { bearing: 16, D: 16, from: 'T' }, '000°M'],
      ['whole-circle-bearings', 'close-to-north', { bearing: 0 }, '000°T'],
      ['grid-north-map-bearings', 'using-the-map-margin', { bearing: 7, gd: -11, from: 'G' }, '018°M'],
      ['grid-north-map-bearings', 'using-the-map-margin', { bearing: 16, gd: 12, from: 'M' }, '028°G'],
    ] as const
    for (const [topic, stage, inputs, answer] of fixtures) {
      const samples = Array.from({ length: 32 }, (_, ordinal) => bearingFormativeCase(topic, stage, 23, ordinal))
      const matches = samples.filter(item => Object.entries(inputs).every(([key, value]) => item.inputs[key] === value))
      expect(matches.length, JSON.stringify(inputs)).toBeGreaterThan(1)
      for (const item of matches) expect(item.answer, item.id).toBe(answer)
    }
  })
  it('covers every direction × offset sign × north-crossing combination across seeds and repeats', () => {
    for (const [topic, stage, directions] of [
      ['north-references-declination', 'wrapping-through-north', ['T', 'M']],
      ['grid-north-map-bearings', 'using-the-map-margin', ['G', 'M']],
    ] as const) {
      const coverage = new Set<string>()
      for (let seed = 0; seed < 32; seed++) for (let ordinal = 0; ordinal < 32; ordinal++) {
        const item = bearingFormativeCase(topic, stage, seed, ordinal)
        const { bearing, from } = item.inputs
        const offset = (item.inputs.D ?? item.inputs.gd) as number
        // Independent unnormalized arithmetic identifies a crossing; no convert/normalize call.
        const raw = (bearing as number) + (from === 'M' ? offset : -offset)
        coverage.add(from + ':' + Math.sign(offset) + ':' + (raw < 0 || raw > 359))
        expect(new Set(item.options).size).toBe(4)
        expect(item.options.some(option => /360°/.test(option))).toBe(false)
      }
      for (const from of directions) for (const sign of [-1, 1]) for (const wraps of [false, true])
        expect(coverage.has(from + ':' + sign + ':' + wraps), stage + ':' + from + ':' + sign + ':' + wraps).toBe(true)
    }
  })
  it('includes near-north rays and validates inputs', () => {
    const near = Array.from({ length: 40 }, (_, i) => bearingFormativeCase('whole-circle-bearings', 'close-to-north', 6, i))
    expect(near.some(x => x.inputs.bearing === 1)).toBe(true)
    expect(near.some(x => x.inputs.bearing === 359)).toBe(true)
    expect(near.every(x => x.answer.endsWith('°T'))).toBe(true)
    expect(() => bearingFormativeCase('whole-circle-bearings', 'bad-stage', 1, 0)).toThrow(RangeError)
    expect(() => bearingFormativeCase('whole-circle-bearings', 'close-to-north', -1, 0)).toThrow(RangeError)
    expect(() => bearingFormativeCase('whole-circle-bearings', 'close-to-north', 1, 0.5)).toThrow(RangeError)
  })
})
