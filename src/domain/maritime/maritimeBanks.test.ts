import { describe, expect, it } from 'vitest'
import { aspectItems, dayShapeItems, lightSignatureItems, shapeState } from './maritimeBanks'
import { maritimeTopics, MARITIME_TOPIC_IDS } from './maritimeTopics'
import { SCORED_ASPECTS } from './lights'
import { VESSEL_STATUSES } from './statuses'
import type { BankItem } from '../navigation/bearingBanks'

/**
 * Fixtures are typed out from the research note, not derived from the code
 * under test, so a wrong rule in the model cannot hide behind itself.
 */
const EXPECTED_ASPECT_ANSWERS = [
  'Masthead light, red sidelight and green sidelight', // 0° dead ahead
  'Masthead light and green sidelight', // 45° starboard bow
  'Masthead light and green sidelight', // 90° starboard beam
  'Sternlight only', // 135° starboard quarter
  'Sternlight only', // 180° dead astern
  'Sternlight only', // 225° port quarter
  'Masthead light and red sidelight', // 270° port beam
  'Masthead light and red sidelight', // 315° port bow
]

/** Research note §B2, in order. `stack` lists top first. */
const EXPECTED_SIGNATURES = [
  { state: 'Power-driven vessel underway (under 50 m)', plan: ['masthead', 'port-sidelight', 'starboard-sidelight', 'sternlight'] },
  { state: 'Sailing vessel underway', plan: ['port-sidelight', 'starboard-sidelight', 'sternlight'] },
  { state: 'Vessel trawling', stack: ['green', 'white'] },
  { state: 'Vessel fishing, other than trawling', stack: ['red', 'white'] },
  { state: 'Vessel not under command', stack: ['red', 'red'] },
  { state: 'Vessel restricted in her ability to manoeuvre', stack: ['red', 'white', 'red'] },
  { state: 'Vessel at anchor (under 50 m)', stack: ['white'] },
  { state: 'Vessel aground (under 50 m)', stack: ['white', 'red', 'red'] },
] as const

/** Research note §C, in order. */
const EXPECTED_SHAPES = [
  { state: 'Vessel at anchor', shapes: ['ball'] },
  { state: 'Vessel not under command', shapes: ['ball', 'ball'] },
  { state: 'Vessel restricted in her ability to manoeuvre', shapes: ['ball', 'diamond', 'ball'] },
  { state: 'Vessel aground', shapes: ['ball', 'ball', 'ball'] },
  { state: 'Vessel engaged in fishing (trawling or other fishing)', shapes: ['cone-apex-down', 'cone-apex-up'] },
] as const

const figureOf = (item: BankItem) => {
  const source = item.stimulus!.source
  if (source.kind !== 'figure') throw new Error('expected a figure')
  return source.figure
}

describe('every Maritime I item is a valid, non-leaking objective choice', () => {
  const banks = { aspect: aspectItems(), signatures: lightSignatureItems(), shapes: dayShapeItems() }
  for (const [name, items] of Object.entries(banks)) {
    it(`${name}: four distinct options including the answer once; stimulus text never states the key`, () => {
      for (const item of items) {
        const { options } = item.choice!
        expect(options).toHaveLength(4)
        expect(new Set(options).size).toBe(4)
        expect(options.filter((o) => o === item.answer)).toHaveLength(1)
        expect(item.stimulus).toBeDefined()
        expect(item.stimulus!.caption).toBeUndefined()
        expect(item.prompt).not.toContain(item.answer)
        expect(item.stimulus!.alt).not.toContain(item.answer)
        // The alt never names any vessel state, which would be the answer.
        for (const status of VESSEL_STATUSES) expect(item.stimulus!.alt).not.toContain(status.state)
      }
    })
  }

  it('never asks that the absence of a signal proves a state', () => {
    for (const item of [...banks.aspect, ...banks.signatures, ...banks.shapes]) {
      expect(item.prompt).not.toMatch(/\b(not displaying|no lights?|without (a|any) (light|shape)|proves?)\b/i)
    }
  })
})

describe('aspect items (8)', () => {
  const items = aspectItems()

  it('cover the eight canonical observer positions, in order', () => {
    expect(items).toHaveLength(8)
    expect(SCORED_ASPECTS).toEqual([0, 45, 90, 135, 180, 225, 270, 315])
    items.forEach((item, i) => {
      const figure = figureOf(item)
      expect(figure).toEqual({ kind: 'vessel-plan', observer: SCORED_ASPECTS[i] })
    })
  })

  it('keys match the research note’s visible-light sets', () => {
    expect(items.map((item) => item.answer)).toEqual(EXPECTED_ASPECT_ANSWERS)
  })

  it('use no sector guides, as the scored stimulus must not draw the answer', () => {
    for (const item of items) expect(figureOf(item)).not.toHaveProperty('sectors')
  })

  it('draw distractors from the same rule family: other positions around the same vessel', () => {
    const family = new Set(EXPECTED_ASPECT_ANSWERS)
    // Plus the fallback sets, which are all combinations of the same four lights.
    const lights = /^(Masthead light|Red sidelight|Green sidelight|Sternlight)/
    for (const item of items) {
      for (const option of item.choice!.options) {
        expect(family.has(option) || lights.test(option)).toBe(true)
      }
    }
  })

  it('states the observer position in the prompt, so the question is operable from text', () => {
    expect(items[1].prompt).toContain('on the starboard bow')
    expect(items[1].prompt).toContain('045° clockwise from the bow')
    expect(items[7].prompt).toContain('on the port bow')
  })
})

describe('light-signature items (8)', () => {
  const items = lightSignatureItems()

  it('match the eight reference signatures of the research note, in order', () => {
    expect(items).toHaveLength(8)
    items.forEach((item, i) => {
      const expected = EXPECTED_SIGNATURES[i]
      expect(item.answer).toBe(expected.state)
      const figure = figureOf(item)
      if ('plan' in expected) expect(figure).toEqual({ kind: 'vessel-plan', lights: expected.plan })
      else expect(figure).toEqual({ kind: 'light-stack', lights: expected.stack })
    })
  })

  it('has eight distinct answers and numbered, distinct prompts', () => {
    expect(new Set(items.map((i) => i.answer)).size).toBe(8)
    expect(new Set(items.map((i) => i.prompt)).size).toBe(8)
  })

  it('offers same-family confusions: trawling against other fishing, NUC against aground, sailing against power-driven', () => {
    const optionsFor = (state: string) => items.find((i) => i.answer === state)!.choice!.options
    expect(optionsFor('Vessel trawling')).toContain('Vessel fishing, other than trawling')
    expect(optionsFor('Vessel fishing, other than trawling')).toContain('Vessel trawling')
    expect(optionsFor('Vessel not under command')).toContain('Vessel aground (under 50 m)')
    expect(optionsFor('Vessel aground (under 50 m)')).toContain('Vessel not under command')
    expect(optionsFor('Sailing vessel underway')).toContain('Power-driven vessel underway (under 50 m)')
  })

  it('describes a stack top to bottom in its text alternative, without naming the state', () => {
    const rams = items.find((i) => i.answer.startsWith('Vessel restricted'))!
    expect(rams.stimulus!.alt).toBe('Three all-round lights in a vertical line: red above white above red.')
    const nuc = items.find((i) => i.answer === 'Vessel not under command')!
    expect(nuc.stimulus!.alt).toBe('Two all-round lights in a vertical line: red above red.')
  })
})

describe('day-shape items (5)', () => {
  const items = dayShapeItems()

  it('match the five arrangements of the research note, in order, as black shapes', () => {
    expect(items).toHaveLength(5)
    items.forEach((item, i) => {
      expect(item.answer).toBe(EXPECTED_SHAPES[i].state)
      expect(figureOf(item)).toEqual({ kind: 'day-shape-stack', shapes: EXPECTED_SHAPES[i].shapes })
    })
  })

  it('name fishing once for both trawling and other fishing, never distinguishing them', () => {
    expect(shapeState('fishing')).toBe('Vessel engaged in fishing (trawling or other fishing)')
    expect(shapeState('trawling')).toBe('Vessel trawling') // not used: trawling has no separate shape item
    expect(items.filter((item) => item.answer.includes('fishing'))).toHaveLength(1)
  })

  it('target the strongest confusions: one/two/three balls, and two cones against ball-diamond-ball', () => {
    const optionsFor = (state: string) => items.find((i) => i.answer === state)!.choice!.options
    expect(optionsFor('Vessel at anchor')).toEqual(expect.arrayContaining(['Vessel not under command', 'Vessel aground']))
    expect(optionsFor('Vessel aground')).toEqual(expect.arrayContaining(['Vessel not under command', 'Vessel at anchor']))
    expect(optionsFor('Vessel engaged in fishing (trawling or other fishing)')).toContain(
      'Vessel restricted in her ability to manoeuvre',
    )
    expect(optionsFor('Vessel restricted in her ability to manoeuvre')).toContain(
      'Vessel engaged in fishing (trawling or other fishing)',
    )
  })

  it('describe shapes top to bottom in text, and keep the cone orientation explicit', () => {
    expect(items[2].stimulus!.alt).toBe('Three black shapes in a vertical line, top to bottom: ball, then diamond, then ball.')
    expect(items[4].stimulus!.alt).toBe(
      'Two black shapes in a vertical line, top to bottom: cone with its apex down, then cone with its apex up, with their apexes together.',
    )
  })
})

describe('the two shipped topics', () => {
  const topics = maritimeTopics()

  it('are Navigation Lights & Aspect (16) and Vessel Day Shapes (5), with orientation Learn-only', () => {
    expect(topics.map((t) => t.id)).toEqual([...MARITIME_TOPIC_IDS])
    expect(topics.map((t) => t.items.length)).toEqual([16, 5])
    expect(topics.some((t) => /orientation/i.test(t.title))).toBe(false)
    const orient = topics[0].learn!.sections!.find((s) => s.heading === 'Orient the vessel')!
    const terms = orient.blocks.find((b) => b.type === 'definitions')
    expect(terms && terms.type === 'definitions' && terms.items).toHaveLength(8)
  })

  it('are deterministic, with stable forward ids and objective choices', () => {
    expect(JSON.stringify(maritimeTopics())).toBe(JSON.stringify(maritimeTopics()))
    for (const topic of topics) {
      topic.items.forEach((item, i) => {
        expect(item.id).toBe(`${topic.id}-item-${String(i + 1).padStart(2, '0')}`)
        expect(item.kind).toBe('forward')
        expect(item.choice).toBeDefined()
        expect(item.stimulus).toBeDefined()
      })
    }
  })

  it('carry source references, the absence caveat, and no qualification claim', () => {
    for (const topic of topics) {
      const limitations = (topic.learn?.limitations ?? []).join(' ')
      expect(limitations).toMatch(/absence of one proves nothing|missing shape proves nothing/)
      expect(limitations).toMatch(/does not show that you can navigate safely/)
      expect(limitations).toMatch(/Argus editorial/)
      expect(topic.learn?.sources?.some((s) => s.url?.includes('laws-lois.justice.gc.ca'))).toBe(true)
      for (const source of topic.learn?.sources ?? []) expect(source.url).toMatch(/^https:\/\//)
    }
  })

  it('give every Learn entry a picture of the signal it describes, with identity in the alt', () => {
    const entries = (topic: (typeof topics)[number]) =>
      topic.learn!.sections!.flatMap((s) => s.blocks).flatMap((b) => (b.type === 'entries' ? b.entries : []))
    expect(entries(topics[0])).toHaveLength(8)
    expect(entries(topics[1])).toHaveLength(5)
    for (const topic of topics) {
      for (const entry of entries(topic)) {
        expect(entry.visual).toBeDefined()
        expect(entry.visual!.alt).toContain(entry.title)
      }
    }
  })

  it('does not teach a deferred or context-dependent signal as scored', () => {
    const scored = JSON.stringify(topics.flatMap((t) => t.items.map((i) => i.answer))).toLowerCase()
    expect(scored).not.toMatch(/constrained by (her )?draught|towing|pushing|dredging|pilot|cylinder|sail.*machinery/)
  })
})
