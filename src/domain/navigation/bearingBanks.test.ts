import { describe, expect, it } from 'vitest'
import {
  A1_FIND_BEARINGS,
  A1_READ_BEARINGS,
  A2_CASES,
  A3_CASES,
  A4_DIRECT_CASES,
  A4_MIXED_CASES,
  A4_TWO_STEP_CASES,
  declinationItems,
  directGridItems,
  findBearingItems,
  mixedItems,
  northConceptItems,
  northDiagramItems,
  readBearingItems,
  reciprocalItems,
  twoStepItems,
  type BankItem,
} from './bearingBanks'
import { bearingTopics, BEARING_TOPIC_IDS } from './bearingTopics'
import { angularSeparation } from './bearings'

/**
 * These tests recompute every answer by a route that shares no code with the
 * implementation — plain arithmetic on the authored inputs — and then check the
 * coverage rules the #140 research note fixes for each bank.
 */
const pad = (n: number) => String(((n % 360) + 360) % 360).padStart(3, '0')

const allBanks: Record<string, BankItem[]> = {
  read: readBearingItems(),
  find: findBearingItems(),
  reciprocal: reciprocalItems(),
  concepts: northConceptItems(),
  declination: declinationItems(),
  diagrams: northDiagramItems(),
  direct: directGridItems(),
  mixed: mixedItems(),
  twoStep: twoStepItems(),
}

describe('every bank item is a valid objective choice', () => {
  for (const [name, items] of Object.entries(allBanks)) {
    it(`${name}: answer is exactly one of 2–6 distinct options, and is never leaked`, () => {
      for (const item of items) {
        const { options } = item.choice!
        expect(options.length).toBeGreaterThanOrEqual(2)
        expect(options.length).toBeLessThanOrEqual(6)
        expect(new Set(options).size).toBe(options.length)
        expect(options.filter((option) => option === item.answer)).toHaveLength(1)
        // The prompt and a stimulus's text alternative state the problem, not the key.
        expect(item.prompt).not.toContain(item.answer)
        if (item.stimulus) expect(item.stimulus.alt).not.toContain(item.answer)
        expect(item.stimulus?.caption).toBeUndefined()
      }
    })
  }
})

describe('A1 — whole-circle bearing diagrams (12)', () => {
  it('has six read and six find exercises', () => {
    expect(readBearingItems()).toHaveLength(6)
    expect(findBearingItems()).toHaveLength(6)
  })

  it('covers every quadrant, two near-north wraps, and at most two exact 45° points', () => {
    const all = [...A1_READ_BEARINGS, ...A1_FIND_BEARINGS]
    const quadrant = (b: number) => Math.floor(b / 90)
    expect(new Set(all.map(quadrant))).toEqual(new Set([0, 1, 2, 3]))
    expect(all.filter((b) => b <= 10 || b >= 350).length).toBeGreaterThanOrEqual(2)
    expect(all.filter((b) => b % 45 === 0).length).toBeLessThanOrEqual(2)
    expect(new Set(all).size).toBe(all.length)
  })

  it('reading items: the key is the drawn ray, formatted as a true bearing', () => {
    readBearingItems().forEach((item, index) => {
      const figure = item.stimulus!.source.kind === 'figure' ? item.stimulus!.source.figure : null
      if (figure?.kind !== 'angle-dial') throw new Error('expected a dial')
      expect(figure.pointers).toHaveLength(1)
      expect(figure.pointers[0].label).toBeUndefined() // the answer is withheld
      expect(item.answer).toBe(`${pad(figure.pointers[0].bearing)}°T`)
      expect(figure.pointers[0].bearing).toBe(A1_READ_BEARINGS[index])
    })
  })

  it('finding items: the lettered ray the key names is drawn at the asked bearing, with four distinct, separable rays', () => {
    findBearingItems().forEach((item, index) => {
      const figure = item.stimulus!.source.kind === 'figure' ? item.stimulus!.source.figure : null
      if (figure?.kind !== 'angle-dial') throw new Error('expected a dial')
      expect(figure.pointers).toHaveLength(4)
      const letter = item.answer.replace('Ray ', '')
      const asked = figure.pointers.find((p) => p.label === letter)!
      expect(asked.bearing).toBe(A1_FIND_BEARINGS[index])
      expect(item.prompt).toContain(`${pad(asked.bearing)}°T`)
      expect(new Set(figure.pointers.map((p) => p.label)).size).toBe(4)
      for (let i = 0; i < 4; i += 1) {
        for (let j = i + 1; j < 4; j += 1) {
          expect(angularSeparation(figure.pointers[i].bearing, figure.pointers[j].bearing)).toBeGreaterThanOrEqual(25)
        }
      }
      // Options are the four drawn letters, so every option names a real ray.
      expect([...item.choice!.options].sort()).toEqual(figure.pointers.map((p) => `Ray ${p.label}`).sort())
    })
  })

  it('does not let the correct letter be guessed from its position in the alphabet', () => {
    const answers = findBearingItems().map((item) => item.answer)
    expect(new Set(answers).size).toBe(answers.length)
    const letters = findBearingItems().map((item) => {
      const figure = item.stimulus!.source.kind === 'figure' ? item.stimulus!.source.figure : null
      if (figure?.kind !== 'angle-dial') throw new Error('expected a dial')
      const correct = item.answer.replace('Ray ', '')
      return figure.pointers.map((p) => p.label!).map((l) => l < correct)
    })
    // Sometimes the correct letter is the alphabetically first, sometimes not.
    const firstCount = letters.filter((flags) => flags.every((below) => !below)).length
    expect(firstCount).toBeLessThan(letters.length)
  })
})

describe('A2 — reciprocal bearings (12)', () => {
  const items = reciprocalItems()

  it('has the required coverage', () => {
    expect(A2_CASES).toHaveLength(12)
    const plain = A2_CASES.filter((c) => !c.diagram)
    expect(A2_CASES.filter((c) => c.diagram)).toHaveLength(2)
    // three below 180, three at/above 180 (excluding wrap and round-number cases)
    expect(plain.slice(0, 3).every((c) => c.bearing < 180)).toBe(true)
    expect(plain.slice(3, 6).every((c) => c.bearing >= 180)).toBe(true)
    // two crossing 000: the bearing or its reciprocal lies within 10° of north,
    // and the arithmetic actually wraps (the raw sum passes 360 or the bearing is past 350)
    const nearNorth = (b: number) => b <= 10 || b >= 350
    const wraps = plain.slice(6, 8)
    expect(wraps.every((c) => nearNorth(c.bearing) || nearNorth((c.bearing + 180) % 360))).toBe(true)
    expect(wraps.every((c) => c.bearing + 180 >= 360)).toBe(true)
    // two round-number checks
    expect(plain.slice(8, 10).every((c) => c.bearing % 45 === 0)).toBe(true)
  })

  it('mixes references and keeps the reference on the answer', () => {
    expect(new Set(A2_CASES.map((c) => c.ref))).toEqual(new Set(['T', 'M', 'G']))
    items.forEach((item, i) => expect(item.answer.endsWith(A2_CASES[i].ref)).toBe(true))
  })

  it('keys equal the add-or-subtract-180 shortcut, computed independently', () => {
    items.forEach((item, i) => {
      const { bearing, ref } = A2_CASES[i]
      const back = bearing < 180 ? bearing + 180 : bearing - 180
      expect(item.answer).toBe(`${pad(back)}°${ref}`)
      expect(item.prompt).toContain(`${pad(bearing)}°${ref}`)
    })
  })

  it('draws the forward ray, labelled, for the diagram items only', () => {
    items.forEach((item, i) => {
      expect(Boolean(item.stimulus)).toBe(Boolean(A2_CASES[i].diagram))
    })
  })
})

describe('A3 — true and magnetic north, declination supplied (16)', () => {
  it('has four concept items and twelve calculations', () => {
    expect(northConceptItems()).toHaveLength(4)
    expect(declinationItems()).toHaveLength(12)
  })

  it('has the required east/west and wrap coverage', () => {
    const cases = [...A3_CASES]
    const toMagnetic = cases.slice(0, 4)
    const toTrue = cases.slice(4, 8)
    const boundary = cases.slice(8)
    expect(toMagnetic.every((c) => c.from === 'T')).toBe(true)
    expect(toTrue.every((c) => c.from === 'M')).toBe(true)
    expect(toMagnetic.filter((c) => c.D > 0)).toHaveLength(2)
    expect(toMagnetic.filter((c) => c.D < 0)).toHaveLength(2)
    expect(toTrue.filter((c) => c.D > 0)).toHaveLength(2)
    expect(toTrue.filter((c) => c.D < 0)).toHaveLength(2)
    // Every boundary case crosses 000 in the arithmetic.
    for (const c of boundary) {
      const raw = c.from === 'T' ? c.bearing - c.D : c.bearing + c.D
      expect(raw < 0 || raw >= 360).toBe(true)
    }
  })

  it('keys match the research note’s independently checked examples and a plain recomputation', () => {
    const items = declinationItems()
    A3_CASES.forEach((c, i) => {
      const raw = c.from === 'T' ? c.bearing - c.D : c.bearing + c.D
      const target = c.from === 'T' ? 'M' : 'T'
      expect(items[i].answer).toBe(`${pad(raw)}°${target}`)
      // D is always stated, with its side.
      expect(items[i].prompt).toContain(`${Math.abs(c.D)}° ${c.D > 0 ? 'E' : 'W'}`)
    })
    const byPrompt = (text: string) => items.find((item) => item.prompt.includes(text))!
    expect(byPrompt('090°T, with declination D = 10° E').answer).toBe('080°M')
    expect(byPrompt('070°T, with declination D = 12° W').answer).toBe('082°M')
    expect(byPrompt('082°M, with declination D = 12° W').answer).toBe('070°T')
  })

  it('never depends on knowing a real declination', () => {
    for (const item of [...northConceptItems(), ...declinationItems()]) {
      expect(item.prompt.toLowerCase()).not.toMatch(/toronto|ottawa|vancouver|current declination in/)
    }
  })
})

describe('A4 — grid north and combined map-bearing application (12)', () => {
  it('has 4 + 4 + 2 + 2 items', () => {
    expect(northDiagramItems()).toHaveLength(4)
    expect(directGridItems()).toHaveLength(4)
    expect(mixedItems()).toHaveLength(2)
    expect(twoStepItems()).toHaveLength(2)
  })

  it('diagram keys are derived from the drawn rays', () => {
    const items = northDiagramItems()
    const figures = items.map((item) => {
      const figure = item.stimulus!.source.kind === 'figure' ? item.stimulus!.source.figure : null
      if (figure?.kind !== 'north-reference') throw new Error('expected a north-reference figure')
      return figure
    })
    // 1: M east of G
    expect(figures[0].rays.find((r) => r.ref === 'M')!.angle).toBeGreaterThan(0)
    expect(items[0].answer).toMatch(/^East of grid north/)
    // 2: G west of T
    expect(figures[1].rays.find((r) => r.ref === 'G')!.angle).toBeLessThan(0)
    expect(items[1].answer).toMatch(/^West of true north/)
    // 3: clockwise order from true north
    const order = [...figures[2].rays].sort((a, b) => a.angle - b.angle).map((r) => `${r.ref}N`).join(' → ')
    expect(items[2].answer).toBe(order)
    // 4: the pair a map margin prints
    expect(items[3].answer).toBe('Grid north and magnetic north')
    for (const item of items) expect(item.prompt).toContain('not to scale')
  })

  it('direct G↔M keys follow M = G − g and G = M + g, recomputed independently', () => {
    const items = directGridItems()
    A4_DIRECT_CASES.forEach((c, i) => {
      const raw = c.from === 'G' ? c.bearing - c.gd : c.bearing + c.gd
      expect(items[i].answer).toBe(`${pad(raw)}°${c.from === 'G' ? 'M' : 'G'}`)
      expect(items[i].prompt).toContain(`${Math.abs(c.gd)}° ${c.gd > 0 ? 'east' : 'west'} of grid north`)
    })
    expect(items.map((item) => item.answer)).toEqual(['096°M', '276°M', '058°G', '357°G'])
  })

  it('mixed T/M/G keys match the research note and a plain alpha-offset recomputation', () => {
    const alpha = { T: 0, M: 0, G: 0 }
    const items = mixedItems()
    A4_MIXED_CASES.forEach((c, i) => {
      alpha.M = c.D
      alpha.G = c.C
      expect(items[i].answer).toBe(`${pad(c.bearing + alpha[c.from] - alpha[c.to])}°${c.to}`)
      expect(items[i].prompt).toContain('D = ')
      expect(items[i].prompt).toContain('C = ')
    })
    expect(items[0].answer).toBe('092°M') // G 100, C +2, D +10
  })

  it('two-step keys convert then take the reciprocal, and agree with reciprocal-then-convert', () => {
    const items = twoStepItems()
    A4_TWO_STEP_CASES.forEach((c, i) => {
      const alphaFrom = c.from === 'M' ? c.D : c.from === 'G' ? c.C : 0
      const alphaTo = c.to === 'M' ? c.D : c.to === 'G' ? c.C : 0
      const converted = c.bearing + alphaFrom - alphaTo
      const viaConvertFirst = `${pad(converted + 180)}°${c.to}`
      // Reciprocal first, then convert: the consistency check the Learn text teaches.
      const viaReciprocalFirst = `${pad(c.bearing + 180 + alphaFrom - alphaTo)}°${c.to}`
      expect(items[i].answer).toBe(viaConvertFirst)
      expect(items[i].answer).toBe(viaReciprocalFirst)
    })
    expect(items.map((item) => item.answer)).toEqual(['230°M', '140°G'])
  })
})

describe('the four shipped topics', () => {
  const topics = bearingTopics()

  it('are the four follow-on topics, in order, with the prerequisite left alone', () => {
    expect(topics.map((topic) => topic.id)).toEqual([...BEARING_TOPIC_IDS])
    expect(topics.map((topic) => topic.items.length)).toEqual([12, 12, 16, 12])
    expect(topics.some((topic) => topic.id === 'cardinal-bearings')).toBe(false)
  })

  it('are deterministic across calls, so catalog identity is stable', () => {
    expect(JSON.stringify(bearingTopics())).toBe(JSON.stringify(bearingTopics()))
  })

  it('give every item a stable forward id and an objective choice', () => {
    for (const topic of topics) {
      topic.items.forEach((item, index) => {
        expect(item.id).toBe(`${topic.id}-item-${String(index + 1).padStart(2, '0')}`)
        expect(item.kind).toBe('forward')
        expect(item.choice).toBeDefined()
      })
    }
  })

  it('keep source-backed facts and Argus editorial choices apart, and disclaim navigation competence', () => {
    for (const topic of topics) {
      const limitations = (topic.learn?.limitations ?? []).join(' ')
      expect(limitations).toMatch(/Argus editorial/)
      expect(limitations).toMatch(/does not show that you can navigate safely/)
      expect(topic.scope).toMatch(/does not cover|not scored|never asks for a real declination/)
      for (const source of topic.learn?.sources ?? []) expect(source.url).toMatch(/^https:\/\//)
    }
  })

  it('never ship a perishable real-world declination', () => {
    const text = JSON.stringify(topics).toLowerCase()
    expect(text).not.toMatch(/declination (in|of) (toronto|ottawa|vancouver|halifax|calgary)/)
  })
})
