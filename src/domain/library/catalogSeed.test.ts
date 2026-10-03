import { describe, expect, it } from 'vitest'
import { seedLibrary } from './catalogSeed'

function seededTopic(id: string) {
  const topic = seedLibrary().topics.find((candidate) => candidate.id === id)
  if (!topic) throw new Error(`Missing seeded topic: ${id}`)
  return topic
}

const rows = (items: { prompt: string; answer: string }[]) =>
  items.map(({ prompt, answer }) => ({ prompt, answer }))

describe('researched seeded library', () => {
  it('keeps every declared Test boundary finite and history-compatible', () => {
    const library = seedLibrary()

    expect(library.version).toBe(5)
    expect(library.topics.map((topic) => topic.id)).toEqual([
      'nato-phonetic',
      'international-morse-letters-printed',
      'ooda-loop',
      'primary-survey',
      'cardinal-bearings',
      'whole-circle-bearings',
      'reciprocal-bearings',
      'north-references-declination',
      'grid-north-map-bearings',
      'navigation-lights',
      'vessel-day-shapes',
      'signal-flags',
      'scuba-equipment-abbreviations',
      'radiotelephony-numbers',
      'si-prefixes',
      'greek-alphabet',
      'hex-digits-binary',
      'beaufort-wind-scale',
      'firearm-safety-acts-prove',
    ])

    for (const topic of library.topics) {
      expect(topic.scope.trim().length).toBeGreaterThan(0)
      expect(topic.items.length).toBeGreaterThan(0)
      expect(new Set(topic.items.map((item) => item.prompt)).size).toBe(topic.items.length)
      expect(topic.history.every((attempt) => attempt.total === topic.items.length)).toBe(true)
    }
  })

  it('keeps NATO as the complete official 26-letter mapping', () => {
    const topic = seededTopic('nato-phonetic')

    expect(topic.items).toHaveLength(26)
    expect(rows(topic.items)[0]).toEqual({ prompt: 'A', answer: 'Alfa' })
    expect(rows(topic.items)[9]).toEqual({ prompt: 'J', answer: 'Juliett' })
    expect(rows(topic.items)[25]).toEqual({ prompt: 'Z', answer: 'Zulu' })
    expect(topic.learn?.kind).toBe('concise')
    expect(topic.learn?.caseStudies).toBeUndefined()
    expect(topic.learn?.sources?.[0].url).toContain('nato.int')
  })

  it('seeds exactly 26 ITU A–Z bidirectional logical scoring units', () => {
    const topic = seededTopic('international-morse-letters-printed')

    expect(topic.scope).toBe(
      'Can independently recall all A–Z printed Morse mappings in both directions.',
    )
    expect(topic.items).toEqual([
      ...[
        ['A', '.-'], ['B', '-...'], ['C', '-.-.'], ['D', '-..'], ['E', '.'], ['F', '..-.'],
        ['G', '--.'], ['H', '....'], ['I', '..'], ['J', '.---'], ['K', '-.-'], ['L', '.-..'],
        ['M', '--'], ['N', '-.'], ['O', '---'], ['P', '.--.'], ['Q', '--.-'], ['R', '.-.'],
        ['S', '...'], ['T', '-'], ['U', '..-'], ['V', '...-'], ['W', '.--'], ['X', '-..-'],
        ['Y', '-.--'], ['Z', '--..'],
      ].map(([prompt, answer], index) => ({
        id: `international-morse-letters-printed-item-${String(index + 1).padStart(2, '0')}`,
        kind: 'bidirectional', prompt, answer,
      })),
    ])
    expect(topic.status).toBe('unstarted')
    expect(topic.history).toEqual([])
    expect(topic.learn?.kind).toBe('concise')
    expect(topic.items.every((item) => item.kind === 'bidirectional')).toBe(true)
    expect(topic.learn?.overview).toContain('does not claim auditory reception')
    expect(topic.learn?.sources?.[0].url).toBe('https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en')
  })

  it('makes the four OODA Test items cover both order and core function', () => {
    const topic = seededTopic('ooda-loop')

    expect(topic.items).toHaveLength(4)
    expect(topic.items.map((item) => item.prompt)).toEqual([
      'Stage 1 — name and core function',
      'Stage 2 — name and core function',
      'Stage 3 — name and core function',
      'Stage 4 — name and core function',
    ])
    expect(topic.items.map((item) => item.answer.split(' — ')[0])).toEqual([
      'Observe',
      'Orient',
      'Decide',
      'Act',
    ])
    expect(topic.items.every((item) => item.answer.includes(' — '))).toBe(true)
    expect(topic.learn?.kind).toBe('briefing')
    expect(topic.learn?.caseStudies).toHaveLength(1)
    expect(topic.learn?.sources?.length).toBeGreaterThanOrEqual(1)
    expect(topic.learn?.limitations?.some((note) => note.includes('Test covers only'))).toBe(true)
  })

  it('keeps Primary Survey scoring to the five ABCDE headings and order', () => {
    const topic = seededTopic('primary-survey')

    expect(rows(topic.items)).toEqual([
      { prompt: 'Step 1 (A)', answer: 'Airway' },
      { prompt: 'Step 2 (B)', answer: 'Breathing' },
      { prompt: 'Step 3 (C)', answer: 'Circulation' },
      { prompt: 'Step 4 (D)', answer: 'Disability' },
      { prompt: 'Step 5 (E)', answer: 'Exposure' },
    ])
    expect(topic.scope).toContain('Test covers the headings and order only')
    expect(topic.learn?.kind).toBe('briefing')
    expect(topic.learn?.caseStudies).toHaveLength(1)
    expect(topic.learn?.limitations?.some((note) => note.includes('not first-aid or clinical training'))).toBe(true)
    expect(topic.learn?.sources?.map((source) => source.url)).toEqual([
      'https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines',
      'https://www.resus.org.uk/library/abcde-approach',
    ])
  })

  it('keeps bearings as exactly eight clockwise degree mappings from north', () => {
    const topic = seededTopic('cardinal-bearings')

    expect(rows(topic.items)).toEqual([
      { prompt: 'North', answer: '0°' },
      { prompt: 'Northeast', answer: '45°' },
      { prompt: 'East', answer: '90°' },
      { prompt: 'Southeast', answer: '135°' },
      { prompt: 'South', answer: '180°' },
      { prompt: 'Southwest', answer: '225°' },
      { prompt: 'West', answer: '270°' },
      { prompt: 'Northwest', answer: '315°' },
    ])
    expect(topic.learn?.kind).toBe('concise')
    expect(topic.learn?.caseStudies).toBeUndefined()
    expect(topic.learn?.overview).toContain('360° represents the same direction')
    expect(topic.learn?.sources?.[0].url).toContain('noaa.gov')
  })

  it('keeps scuba gear shorthand to thirteen finite equipment terms with system context (#121)', () => {
    const topic = seededTopic('scuba-equipment-abbreviations')

    expect(topic.title).toBe('SCUBA Equipment')
    expect(topic.items.map((item) => item.prompt)).toEqual([
      'SCUBA', 'BCD', 'SPG', 'LPI', 'DSMB', 'DPV', 'AAS', 'DV', 'HP', 'LP', 'IP', 'SMB', 'DIN',
    ])
    // The six original ids stay put, so evidence for vocabulary a learner
    // already knew survives the expansion.
    expect(topic.items.map((item) => item.id)).toEqual(
      Array.from({ length: 13 }, (_, index) =>
        `scuba-equipment-abbreviations-item-${String(index + 1).padStart(2, '0')}`,
      ),
    )
    expect(topic.items.every((item) => item.answer.includes(' — ') || item.prompt === 'DIN')).toBe(true)
    expect(topic.scope).toContain('Thirteen common recreational-scuba equipment abbreviations and shorthand')
    expect(topic.scope).toContain('Test does not cover equipment selection')
    expect(topic.learn?.kind).toBe('briefing')
    expect(topic.learn?.sections?.map((section) => section.heading)).toEqual([
      'Breathing-gas path',
      'Core recreational kit map',
      'Buoyancy, signalling and propulsion',
      'Connection and naming shorthand',
    ])
    expect(topic.learn?.limitations?.some((note) => note.includes('not diver training'))).toBe(true)
    expect(topic.learn?.sources?.length).toBeGreaterThanOrEqual(9)
  })

  it('keeps radiotelephony numbers to the 13 RIC-21 spoken forms, number → spoken form', () => {
    const topic = seededTopic('radiotelephony-numbers')

    expect(rows(topic.items)).toEqual([
      { prompt: '0', answer: 'ZE-RO' },
      { prompt: '1', answer: 'WUN' },
      { prompt: '2', answer: 'TOO' },
      { prompt: '3', answer: 'TREE' },
      { prompt: '4', answer: 'FOW-er' },
      { prompt: '5', answer: 'FIFE' },
      { prompt: '6', answer: 'SIX' },
      { prompt: '7', answer: 'SEV-en' },
      { prompt: '8', answer: 'AIT' },
      { prompt: '9', answer: 'NIN-er' },
      { prompt: 'Decimal', answer: 'DAY-SEE-MAL' },
      { prompt: 'Hundred', answer: 'HUN-dred' },
      { prompt: 'Thousand', answer: 'TOU-SAND' },
    ])
    expect(topic.items.every((item) => item.kind === 'forward')).toBe(true)
    expect(topic.status).toBe('unstarted')
    expect(topic.history).toEqual([])
    expect(topic.scope).toContain('radio procedure are not scored')
    expect(topic.learn?.kind).toBe('concise')
    expect(topic.learn?.limitations?.some((note) => note.includes('not a radio operator certificate'))).toBe(true)
    expect(topic.learn?.sources?.[0].url).toContain('ric-21')
  })

  it('keeps SI prefixes to the 24 BIPM powers of ten, power → name and symbol', () => {
    const topic = seededTopic('si-prefixes')

    expect(topic.items).toHaveLength(24)
    expect(rows(topic.items)[0]).toEqual({ prompt: '10³⁰', answer: 'quetta (Q)' })
    expect(rows(topic.items)[9]).toEqual({ prompt: '10³', answer: 'kilo (k)' })
    expect(rows(topic.items)[11]).toEqual({ prompt: '10¹', answer: 'deca (da)' })
    expect(rows(topic.items)[15]).toEqual({ prompt: '10⁻⁶', answer: 'micro (µ)' })
    expect(rows(topic.items)[23]).toEqual({ prompt: '10⁻³⁰', answer: 'quecto (q)' })
    // Case is the confusion cost: every paired multiple and sub-multiple symbol
    // must survive as distinct upper/lower-case letters.
    const symbols = topic.items.map((item) => item.answer.match(/\((.+)\)$/)?.[1])
    for (const [upper, lower] of [['M', 'm'], ['P', 'p'], ['Z', 'z'], ['Y', 'y'], ['R', 'r'], ['Q', 'q']]) {
      expect(symbols).toContain(upper)
      expect(symbols).toContain(lower)
    }
    expect(topic.items.every((item) => item.kind === 'forward')).toBe(true)
    expect(topic.status).toBe('unstarted')
    expect(topic.learn?.kind).toBe('concise')
    expect(topic.learn?.limitations?.some((note) => note.includes('binary prefixes'))).toBe(true)
    expect(topic.learn?.sources?.[0].url).toBe('https://www.bipm.org/en/publications/si-brochure')
  })

  it('keeps the Greek alphabet to 24 Greek-code-point letters, letter → name', () => {
    const topic = seededTopic('greek-alphabet')

    expect(topic.items.map((item) => item.answer)).toEqual([
      'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
      'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon',
      'Phi', 'Chi', 'Psi', 'Omega',
    ])
    // No Latin look-alike may stand in for a Greek capital: every glyph must be
    // the Greek code point, capital then small, in alphabetical order.
    const capitals = [...Array(25).keys()].map((i) => 0x391 + i).filter((cp) => cp !== 0x3a2)
    topic.items.forEach((item, index) => {
      const [capital, small, final] = item.prompt.split(' ')
      expect(capital.codePointAt(0)).toBe(capitals[index])
      expect(small.codePointAt(0)).toBe(capitals[index] + 0x20)
      expect(final).toBe(item.answer === 'Sigma' ? 'ς' : undefined)
    })
    expect(topic.items.every((item) => item.kind === 'forward')).toBe(true)
    expect(topic.status).toBe('unstarted')
    expect(topic.learn?.kind).toBe('concise')
    expect(topic.learn?.limitations?.some((note) => note.includes('not reading, writing or speaking Greek'))).toBe(true)
    expect(topic.learn?.sources?.[0].url).toBe('https://www.unicode.org/charts/PDF/U0370.pdf')
  })

  it('keeps hexadecimal digits to the 16 four-bit patterns, hex → binary', () => {
    const topic = seededTopic('hex-digits-binary')

    expect(rows(topic.items)).toEqual([
      { prompt: '0', answer: '0000' }, { prompt: '1', answer: '0001' },
      { prompt: '2', answer: '0010' }, { prompt: '3', answer: '0011' },
      { prompt: '4', answer: '0100' }, { prompt: '5', answer: '0101' },
      { prompt: '6', answer: '0110' }, { prompt: '7', answer: '0111' },
      { prompt: '8', answer: '1000' }, { prompt: '9', answer: '1001' },
      { prompt: 'A', answer: '1010' }, { prompt: 'B', answer: '1011' },
      { prompt: 'C', answer: '1100' }, { prompt: 'D', answer: '1101' },
      { prompt: 'E', answer: '1110' }, { prompt: 'F', answer: '1111' },
    ])
    expect(topic.items.every((item) => item.kind === 'forward')).toBe(true)
    expect(topic.status).toBe('unstarted')
    expect(topic.learn?.kind).toBe('concise')
    expect(topic.learn?.limitations?.some((note) => note.includes('Binary → hex'))).toBe(true)
    expect(topic.learn?.sources?.[0].url).toContain('rfc4648')
  })

  it('keeps Beaufort to forces 0–12 with term and knot range, force 12 unbounded', () => {
    const topic = seededTopic('beaufort-wind-scale')

    expect(topic.items).toHaveLength(13)
    expect(topic.items.map((item) => item.prompt)).toEqual(
      [...Array(13).keys()].map((force) => `Force ${force}`),
    )
    expect(rows(topic.items)[0]).toEqual({ prompt: 'Force 0', answer: 'Calm — less than 1 knot' })
    expect(rows(topic.items)[7]).toEqual({ prompt: 'Force 7', answer: 'Near gale — 28–33 knots' })
    expect(rows(topic.items)[9]).toEqual({ prompt: 'Force 9', answer: 'Strong gale — 41–47 knots' })
    expect(rows(topic.items)[12]).toEqual({ prompt: 'Force 12', answer: 'Hurricane — 64 knots or more' })

    // Knot bands are contiguous: each force starts one knot above the last.
    const lows = topic.items.slice(1, 12).map((item) => Number(item.answer.match(/(\d+)–(\d+)/)?.[1]))
    const highs = topic.items.slice(1, 12).map((item) => Number(item.answer.match(/(\d+)–(\d+)/)?.[2]))
    lows.slice(1).forEach((low, index) => expect(low).toBe(highs[index] + 1))
    expect(highs[10]).toBe(63)

    expect(topic.items.every((item) => item.kind === 'forward')).toBe(true)
    expect(topic.status).toBe('unstarted')
    expect(topic.learn?.kind).toBe('concise')
    // One entry per force (#128): number, term, knots, and the sea and land
    // cues kept together, rather than the same force split across two tables.
    const sections = topic.learn?.sections ?? []
    expect(sections.map((section) => section.heading)).toEqual(['The scale'])
    expect(sections.flatMap((section) => section.blocks).some((block) => block.type === 'table')).toBe(false)
    const block = sections[0].blocks[0]
    if (block.type !== 'entries') throw new Error('The scale should be force entries.')
    expect(block.entries).toHaveLength(13)
    block.entries.forEach((entry, force) => {
      expect(entry.marker).toBe(String(force))
      expect(`${entry.title} — ${entry.meta}`).toBe(topic.items[force].answer)
      expect(entry.fields.map((field) => field.label)).toEqual(['At sea', 'On land'])
      expect(entry.fields.every((field) => field.text.length > 0)).toBe(true)
    })
    expect(block.entries[7]).toMatchObject({ title: 'Near gale', meta: '28–33 knots' })
    // The force 12 rationale belongs to force 12, and only there.
    expect(block.entries[12].note).toMatch(/64–71 knots.*64 knots or more/)
    expect(block.entries.slice(0, 12).every((entry) => entry.note === undefined)).toBe(true)
    expect(topic.learn?.limitations?.some((note) => note.includes('not a forecast'))).toBe(true)
    expect(topic.learn?.sources?.[0].url).toContain('canada.ca')
  })

  it('keeps ACTS & PROVE to the nine handbook rules in order, with firearm limits visible', () => {
    const topic = seededTopic('firearm-safety-acts-prove')

    expect(rows(topic.items)).toEqual([
      { prompt: 'ACTS 1 (A)', answer: 'Assume every firearm is loaded.' },
      { prompt: 'ACTS 2 (C)', answer: 'Control the muzzle direction at all times.' },
      { prompt: 'ACTS 3 (T)', answer: 'Trigger finger must be kept off the trigger and out of the trigger guard.' },
      { prompt: 'ACTS 4 (S)', answer: 'See that the firearm is unloaded — PROVE it safe.' },
      { prompt: 'PROVE 1 (P)', answer: 'Point the firearm in the safest available direction.' },
      { prompt: 'PROVE 2 (R)', answer: 'Remove all ammunition.' },
      { prompt: 'PROVE 3 (O)', answer: 'Observe the chamber.' },
      { prompt: 'PROVE 4 (V)', answer: 'Verify the feeding path.' },
      { prompt: 'PROVE 5 (E)', answer: 'Examine the bore for obstructions.' },
    ])
    // Each prompt's letter is the first letter of its rule, so the acronyms
    // spell themselves out of the scored items.
    const letters = topic.items.map((item) => item.prompt.match(/\((\w)\)$/)?.[1])
    expect(letters.join('')).toBe('ACTSPROVE')
    topic.items.forEach((item, index) => expect(item.answer[0]).toBe(letters[index]))

    expect(topic.scope).toContain('Student Handbook (2014)')
    expect(topic.scope).toContain('not handling a firearm')
    expect(topic.items.every((item) => item.kind === 'forward')).toBe(true)
    expect(topic.status).toBe('unstarted')
    expect(topic.learn?.kind).toBe('briefing')
    expect(topic.learn?.caseStudies).toHaveLength(1)
    const limits = topic.learn?.limitations ?? []
    expect(limits.some((note) => note.includes('not the Canadian Firearms Safety Course'))).toBe(true)
    expect(limits.some((note) => note.includes('nothing about shooting, tactics or use of force'))).toBe(true)
    expect(limits.some((note) => note.includes('follow your course'))).toBe(true)
    expect(topic.learn?.sources?.[0].url).toContain('publications.gc.ca')
  })
})

/** #166: shipped Learn text that has been trimmed stays inside its budget. */
describe('trimmed Learn prose', () => {
  const words = (text: string | undefined) => (text ? text.trim().split(/\s+/).length : 0)
  type Block = NonNullable<NonNullable<ReturnType<typeof seededTopic>['learn']>['sections']>[number]['blocks'][number]
  const blockWords = (block: Block): number =>
    block.type === 'paragraph' ? words(block.text)
      : block.type === 'bullets' ? block.items.reduce((n, i) => n + words(i), 0)
        : block.type === 'table' ? block.rows.flat().reduce((n, c) => n + words(c), 0)
          : 0

  // Briefing budgets from docs/open/LIBRARY_COMPACT_TOPICS.md §3.3.
  it.each(['ooda-loop', 'primary-survey', 'firearm-safety-acts-prove'])('keeps the %s briefing compact', (id) => {
    const learn = seededTopic(id).learn!
    const sections = (learn.sections ?? []).flatMap((section) => section.blocks).reduce((n, b) => n + blockWords(b), 0)
    const cases = (learn.caseStudies ?? []).reduce(
      (n, c) => n + words(c.scenario) + words(c.takeaway) + c.analysis.flatMap((s) => s.blocks).reduce((m, b) => m + blockWords(b), 0),
      0,
    )

    expect(words(learn.overview)).toBeLessThanOrEqual(30)
    expect(sections).toBeLessThanOrEqual(130)
    expect(cases).toBeLessThanOrEqual(90)
    expect(learn.limitations?.length).toBeLessThanOrEqual(3)
    learn.limitations?.forEach((note) => expect(words(note)).toBeLessThanOrEqual(25))
  })
})
