import { describe, expect, it } from 'vitest'
import { seedLibrary } from './seed'

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
})
