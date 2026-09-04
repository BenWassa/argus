import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  buildCuePayload,
  isCorrectResponse,
  morseAcquisitionProfile,
  promptFor,
  type AcquisitionCharacter,
} from '../../lib/acquisition'
import { CUE_RUNGS, UNCUED_RUNGS, recordAnswer, rungFor } from '../../lib/cueLadder'
import { MORSE_LETTERS, type MorseLetter } from '../../lib/morse'
import { parseLibrary } from '../../lib/storage'
import { seedLibrary } from '../../lib/seed'
import type { IdentifiedItem, ItemCueEvidence, Topic } from '../../lib/types'
import { ProgressiveCard } from './ProgressiveCard'

const letters = Object.keys(MORSE_LETTERS) as MorseLetter[]

function character(letter: MorseLetter): AcquisitionCharacter {
  return {
    itemId: `i-${letter}`,
    glyph: letter,
    pattern: MORSE_LETTERS[letter],
    reading: Array.from(MORSE_LETTERS[letter]).map((m) => (m === '.' ? 'dit' : 'dah')).join(' '),
    mnemonicId: `argus-morse-rhythm-v1-${letter}`,
    textLabel: `${letter} is the whole answer spelled out`,
  }
}

function render(letter: MorseLetter, rungIndex: number, options: string[] = []) {
  return renderToStaticMarkup(
    <ProgressiveCard
      character={character(letter)}
      rung={CUE_RUNGS[rungIndex]}
      options={options}
      onAnswer={() => undefined}
      cardKey={`${letter}-${rungIndex}`}
      now={() => 0}
    />,
  )
}

describe('cue-bearing content cannot reach an uncued rung', () => {
  it('produces a payload with nothing in it but the rung id', () => {
    for (const rung of UNCUED_RUNGS) {
      for (const letter of letters) {
        const payload = buildCuePayload(rung, character(letter))
        // Asserted on the payload's own keys, so a cue field added later
        // without a rung check fails here rather than reaching a learner.
        expect(Object.keys(payload)).toEqual(['rungId'])
      }
    }
  })

  it('renders no cue panel, no mnemonic id and no answer text at those rungs', () => {
    for (const rungIndex of [3, 4]) {
      for (const letter of letters) {
        const html = render(letter, rungIndex)
        expect(html).not.toContain('class="test-cue')
        expect(html).not.toContain('argus-morse-rhythm')
        expect(html).not.toContain('the whole answer spelled out')
        expect(html).not.toContain('elements in total')
      }
    }
  })

  it('never shows the answer side of the item before it is answered', () => {
    // Free production asks for the pattern, so the pattern may not appear.
    // The dit and dah keys themselves legend the two marks that exist, which is
    // the keypad's alphabet rather than this item's answer, so the check is on
    // everything above them.
    for (const letter of letters) {
      // Everything above the keypad: the rung, the prompt and any cue panel.
      const above = render(letter, 3).split('class="test-production"')[0]
      const canonical = Array.from(MORSE_LETTERS[letter]).map((m) => (m === '.' ? '·' : '—')).join(' ')
      expect(above).not.toContain(canonical)
      expect(above).not.toContain(character(letter).reading)
    }
    // Free reception asks for the character, so the glyph may not appear as the
    // prompt or anywhere else on the card.
    for (const letter of letters) {
      const reception = render(letter, 4)
      expect(reception).not.toContain(`>${letter}<`)
    }
  })

  it('keeps every cue a strict prefix of the answer at every rung', () => {
    for (const rung of CUE_RUNGS) {
      for (const letter of letters) {
        const payload = buildCuePayload(rung, character(letter))
        if (!payload.revealedPattern) continue
        const revealed = payload.revealedPattern.split(' ').length
        expect(revealed).toBeLessThan(MORSE_LETTERS[letter].length)
        expect(payload.hiddenCount).toBe(MORSE_LETTERS[letter].length - revealed)
      }
    }
  })
})

describe('rung rendering', () => {
  it('offers alternatives immediately at the richest rung', () => {
    const html = render('R', 0, ['.-.', '.--', '-.-', '...'])
    expect(html).toContain('test-option')
    expect(html).toContain('test-cue')
    expect(html).toContain('3 elements in total')
    expect(html).toContain('Prompted recognition')
  })

  it('withholds alternatives until the retrieval opportunity has passed', () => {
    const html = render('R', 1, ['.-.', '.--', '-.-', '...'])
    expect(html).toContain('the alternatives are coming')
    expect(html).not.toContain('class="test-option mono')
    expect(html).toContain('aria-busy="true"')
  })

  it('shows only the length at the reduced rung', () => {
    const html = render('R', 2, ['.-.', '.--', '-.-', '...'])
    expect(html).toContain('3 elements in total')
    expect(html).not.toContain('test-cue-pattern')
  })

  it('gives dit and dah keys plus a keyboard route for production', () => {
    const html = render('R', 3)
    expect(html).toContain('Add a dit')
    expect(html).toContain('Add a dah')
    expect(html).toContain('full stop for a dit')
    expect(html).toContain('test-key')
  })

  it('prompts with the printed pattern and takes a typed character for reception', () => {
    const html = render('Q', 4)
    expect(html).toContain('Which character is this?')
    expect(html).toContain('test-entry-input')
    expect(html).toContain('autoCapitalize="characters"')
    expect(html).toContain('— — · —')
    expect(promptFor(CUE_RUNGS[4], character('Q'))).toBe('— — · —')
  })
})

describe('grading a response', () => {
  it('accepts the canonical pattern for production, whitespace and all', () => {
    expect(isCorrectResponse(CUE_RUNGS[3], character('R'), '.-.')).toBe(true)
    expect(isCorrectResponse(CUE_RUNGS[3], character('R'), '. - .')).toBe(true)
    expect(isCorrectResponse(CUE_RUNGS[3], character('R'), '.--')).toBe(false)
    expect(isCorrectResponse(CUE_RUNGS[3], character('R'), '')).toBe(false)
  })

  it('accepts the character in any case for reception', () => {
    expect(isCorrectResponse(CUE_RUNGS[4], character('Q'), 'q')).toBe(true)
    expect(isCorrectResponse(CUE_RUNGS[4], character('Q'), ' Q ')).toBe(true)
    expect(isCorrectResponse(CUE_RUNGS[4], character('Q'), 'G')).toBe(false)
  })
})

describe('which topics the ladder drives', () => {
  const library = parseLibrary(seedLibrary())
  const topics: Topic[] = library.ok ? library.library.topics : []

  it('recognises the seeded printed Morse topic', () => {
    const morse = topics.find((topic) => topic.id === 'international-morse-letters-printed')!
    const profile = morseAcquisitionProfile(morse)
    expect(profile).not.toBeNull()
    expect(profile!.size).toBe(26)
    for (const item of morse.items) {
      const entry = profile!.get(item.id!)!
      expect(entry.glyph).toBe(item.prompt)
      expect(entry.pattern).toBe(item.answer)
    }
  })

  it('leaves every other seeded topic on the existing self-scored card', () => {
    for (const topic of topics) {
      if (topic.id === 'international-morse-letters-printed') continue
      expect(morseAcquisitionProfile(topic)).toBeNull()
    }
  })

  it('refuses a deck that disagrees with the ITU mapping', () => {
    const morse = topics.find((topic) => topic.id === 'international-morse-letters-printed')!
    const wrong: Topic = {
      ...morse,
      items: morse.items.map((item) => (item.prompt === 'A' ? { ...item, answer: '-.-' } : item)),
    }
    expect(morseAcquisitionProfile(wrong)).toBeNull()

    const partial: Topic = { ...morse, items: [...morse.items, { id: 'x', kind: 'forward', prompt: 'Hello', answer: 'World' }] }
    expect(morseAcquisitionProfile(partial)).toBeNull()
  })

  it('picks up Learn mnemonic metadata when a topic supplies it', () => {
    const morse = topics.find((topic) => topic.id === 'international-morse-letters-printed')!
    const withPacket: Topic = {
      ...morse,
      learn: {
        kind: 'concise',
        sections: [
          {
            heading: 'Packet',
            blocks: [
              {
                type: 'morse-character-packet',
                characters: [
                  { glyph: 'E', pattern: '.', mnemonicId: 'asset-E', audioText: 'E', textLabel: 'E is dit.' },
                ],
              },
            ],
          },
        ],
      },
    }
    const profile = morseAcquisitionProfile(withPacket)!
    const e = [...profile.values()].find((entry) => entry.glyph === 'E')!
    expect(e.mnemonicId).toBe('asset-E')
    expect(e.textLabel).toBe('E is dit.')
    // And it still never reaches an uncued rung.
    expect(Object.keys(buildCuePayload(CUE_RUNGS[3], e))).toEqual(['rungId'])
  })
})

describe('a whole item’s journey up the ladder', () => {
  const item: IdentifiedItem = { id: 'i-R', kind: 'bidirectional', prompt: 'R', answer: '.-.' }

  it('moves through recognition, delay, reduction, free production and reverse recall', () => {
    let evidence: ItemCueEvidence | undefined
    const seen: string[] = []
    for (let i = 0; i < 10; i += 1) {
      const rung = rungFor(item, evidence)
      seen.push(rung.id)
      evidence = recordAnswer(evidence, {
        direction: rung.direction,
        correct: true,
        latencyMs: 700,
        at: '2026-01-01T00:00:00.000Z',
      })
    }
    expect([...new Set(seen)]).toEqual([
      'rich-recognition',
      'delayed-recognition',
      'reduced-recognition',
      'free-production',
      'free-reception',
    ])
  })
})
