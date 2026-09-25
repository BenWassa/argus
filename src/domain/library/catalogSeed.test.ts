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
      'scuba-equipment-abbreviations',
      'radiotelephony-numbers',
      'si-prefixes',
      'greek-alphabet',
      'hex-digits-binary',
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
    expect(topic.learn?.limitations?.some((note) => note.includes('Test intentionally covers only'))).toBe(true)
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

  it('keeps scuba vocabulary to six equipment abbreviations and reference functions', () => {
    const topic = seededTopic('scuba-equipment-abbreviations')

    expect(rows(topic.items)).toEqual([
      { prompt: 'SCUBA', answer: 'Self-contained underwater breathing apparatus — equipment that lets a diver breathe underwater from a carried gas supply.' },
      { prompt: 'BCD', answer: 'Buoyancy control device — the buoyancy bladder/system that helps a diver control buoyancy and commonly holds the cylinder.' },
      { prompt: 'SPG', answer: 'Submersible pressure gauge — an instrument that displays the pressure, and therefore remaining gas, in a cylinder.' },
      { prompt: 'LPI', answer: 'Low-pressure inflator — the hose and fitting that supplies low-pressure gas from a regulator to inflate a BCD.' },
      { prompt: 'DSMB', answer: 'Delayed surface marker buoy — an inflatable surface-signalling buoy deployed from underwater.' },
      { prompt: 'DPV', answer: 'Diver propulsion vehicle — a powered device used to propel a diver through the water.' },
    ])
    expect(topic.scope).toContain('Test does not cover equipment selection')
    expect(topic.learn?.limitations?.some((note) => note.includes('not diver training'))).toBe(true)
    expect(topic.learn?.sources).toHaveLength(3)
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
})
