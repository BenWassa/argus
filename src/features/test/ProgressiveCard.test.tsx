import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  buildCuePayload,
  isCorrectResponse,
  morseAcquisitionProfile,
  promptFor,
  type AcquisitionCharacter,
} from '../../domain/morse/testing/acquisitionProfile'
import {
  CUE_RUNGS,
  FREE_RECEPTION_RUNG,
  UNCUED_RUNGS,
  isAssistedRung,
  recordAnswer,
  rungFor,
} from '../../domain/study/cueLadder'
import { MORSE_LETTERS, type MorseLetter } from '../../domain/morse/code'
import { verbalMnemonic } from '../../domain/morse/verbalMnemonics'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { IdentifiedItem, Topic } from '../../domain/library/topic'
import type { ItemCueEvidence } from '../../domain/study/evidence'
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

function render(letter: MorseLetter, rungIndex: number) {
  return renderToStaticMarkup(
    <ProgressiveCard
      character={character(letter)}
      rung={CUE_RUNGS[rungIndex]}
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
        expect(Object.keys(payload)).toEqual(['rungId'])
      }
    }
  })

  it('renders no verbal mnemonic, SVG cue, audio control or answer text at uncued rungs', () => {
    for (const rungIndex of [3, 4]) {
      for (const letter of letters) {
        const html = render(letter, rungIndex)
        expect(html).not.toContain('class="test-support')
        expect(html).not.toContain('argus-morse-rhythm')
        expect(html).not.toContain('the whole answer spelled out')
        expect(html).not.toContain('signals')
        expect(html).not.toContain('Play canonical rhythm')
        expect(html).not.toContain(verbalMnemonic(letter).phrase)
      }
    }
  })

  it('never shows the answer side of the item before it is answered', () => {
    for (const letter of letters) {
      const above = render(letter, 3).split('class="test-answer"')[0]
      const canonical = Array.from(MORSE_LETTERS[letter]).map((m) => (m === '.' ? '·' : '—')).join(' ')
      expect(above).not.toContain(canonical)
      expect(above).not.toContain(character(letter).reading)
      expect(above).not.toContain(verbalMnemonic(letter).phrase)
    }
    for (const letter of letters) {
      const reception = render(letter, 4)
      expect(reception).not.toContain(`>${letter}<`)
      expect(reception).not.toContain(verbalMnemonic(letter).phrase)
    }
  })

  it('keeps every verbal/visual cue a strict prefix of the answer at every rung', () => {
    for (const rung of CUE_RUNGS) {
      for (const letter of letters) {
        const payload = buildCuePayload(rung, character(letter))
        if (!payload.revealedPattern) {
          expect(payload.verbalBeats).toBeUndefined()
          expect(payload.revealedRawPattern).toBeUndefined()
          continue
        }
        const revealed = payload.revealedPattern.split(' ').length
        expect(revealed).toBeLessThan(MORSE_LETTERS[letter].length)
        expect(payload.hiddenCount).toBe(MORSE_LETTERS[letter].length - revealed)
        if (payload.verbalBeats) expect(payload.verbalBeats).toHaveLength(revealed)
        if (payload.mnemonicId) expect(payload.revealedRawPattern).toHaveLength(revealed)
      }
    }
  })
})

const R_BEATS = verbalMnemonic('R').beats.map((beat) => beat.text)

/**
 * The cue is the shared `MorsePhrase`, so a disclosed beat is a phrase word
 * rather than the bespoke captioned chip the Test card used to draw for itself.
 */
function containsBeatWord(html: string, word: string): boolean {
  return html.includes(`<span class="morse-phrase-word">${word.toUpperCase()}</span>`)
}

describe('rung rendering', () => {
  it('discloses the opening of the phrase, and only that, at the richest Test rung', () => {
    const html = render('R', 0)
    expect(html).toContain('class="morse-key"')
    expect(html).toContain('class="test-support"')
    expect(containsBeatWord(html, R_BEATS[0])).toBe(true)
    expect(containsBeatWord(html, R_BEATS[1])).toBe(true)
    expect(containsBeatWord(html, R_BEATS[2])).toBe(false)
    // The phrase marks already carry the timing and the count of what is
    // hidden, so the SVG trace, the notation line and the element tally that
    // used to sit beside them are gone rather than repeating it three times.
    expect(html).not.toContain('<svg')
    expect(html).not.toContain('signals')
    expect(html).not.toContain('elements in total')
  })

  it('uses the same key with one opening beat at the next rung', () => {
    const html = render('R', 1)
    expect(html).toContain('class="morse-key"')
    expect(containsBeatWord(html, R_BEATS[0])).toBe(true)
    expect(containsBeatWord(html, R_BEATS[1])).toBe(false)
    expect(html).not.toContain('<svg')
  })

  it('reduces to signal-count support without target audio or artwork', () => {
    const html = render('R', 2)
    expect(html).toContain('3 signals')
    expect(html).toContain('class="morse-key"')
    expect(html).not.toContain('morse-phrase')
    expect(html).not.toContain('<svg')
    expect(html).not.toContain('Play canonical rhythm')
    const payload = buildCuePayload(CUE_RUNGS[2], character('R'))
    expect(payload.audioText).toBeUndefined()
  })

  it('says what the question wants in one word, and never names the rung', () => {
    for (let rungIndex = 0; rungIndex < FREE_RECEPTION_RUNG; rungIndex += 1) {
      const html = render('R', rungIndex)
      expect(html).toContain('class="test-task">Key it<')
      expect(html).not.toContain(CUE_RUNGS[rungIndex].label)
      expect(html).not.toContain(CUE_RUNGS[rungIndex].instruction)
    }
    const reception = render('Q', FREE_RECEPTION_RUNG)
    expect(reception).toContain('class="test-task">Name it<')
    expect(reception).not.toContain(CUE_RUNGS[FREE_RECEPTION_RUNG].label)
    expect(reception).not.toContain(CUE_RUNGS[FREE_RECEPTION_RUNG].instruction)
  })

  it('shows at most one piece of support, and the prompt exactly once', () => {
    for (let rungIndex = 0; rungIndex < CUE_RUNGS.length; rungIndex += 1) {
      const letter: MorseLetter = rungIndex === FREE_RECEPTION_RUNG ? 'Q' : 'R'
      const html = render(letter, rungIndex)
      expect((html.match(/class="test-support/g) ?? []).length).toBeLessThanOrEqual(1)
      // The SVG cue used to reprint the prompt letter inside the cue panel, so
      // the screen carried the question twice over.
      if (rungIndex !== FREE_RECEPTION_RUNG) {
        expect((html.match(new RegExp(`>${letter}<`, 'g')) ?? [])).toHaveLength(1)
      }
    }
  })

  it('uses the uncluttered shared key for free production', () => {
    const html = render('R', 3)
    expect(html).toContain('class="morse-key"')
    expect(html).toContain('grades automatically when complete')
    expect(html).not.toContain('morse-key-hint')
    expect(html).not.toContain('>Back<')
    expect(html).not.toContain('>Submit<')
    expect(html).not.toContain('class="test-key"')
  })

  it('uses keyed production on every forward rung and typed entry only for reverse recall', () => {
    for (let rungIndex = 0; rungIndex < FREE_RECEPTION_RUNG; rungIndex += 1) {
      const html = render('R', rungIndex)
      expect(html).toContain('class="morse-key"')
      expect(html).not.toContain('class="test-option mono')
      expect(html).not.toContain('Play canonical rhythm')
    }
    const reverse = render('Q', FREE_RECEPTION_RUNG)
    expect(reverse).toContain('Which character is this?')
    expect(reverse).toContain('test-entry-input')
    expect(reverse).not.toContain('class="morse-key"')
  })

  it('prompts with the printed pattern and takes a typed character for reception', () => {
    const html = render('Q', 4)
    // The field is the whole control: it grades on the character, exactly as
    // the key grades on the last element, so there is no second tap to make.
    expect(html).toContain('Which character is this?')
    expect(html).toContain('test-entry-input')
    expect(html).toContain('autoCapitalize="characters"')
    expect(html).not.toContain('>Submit<')
    // Drawn from the canonical notation, mark by mark, in its real proportions.
    expect(promptFor(CUE_RUNGS[4], character('Q'))).toBe('— — · —')
    expect((html.match(/test-pattern-mark is-dah/g) ?? [])).toHaveLength(3)
    expect((html.match(/test-pattern-mark is-dit/g) ?? [])).toHaveLength(1)
    expect(html).toContain('dah dah dit dah')
  })
})

describe('grading a response', () => {
  it('accepts canonical Morse production at supported and free rungs', () => {
    for (const rungIndex of [0, 1, 2, 3]) {
      expect(isCorrectResponse(CUE_RUNGS[rungIndex], character('R'), '.-.')).toBe(true)
      expect(isCorrectResponse(CUE_RUNGS[rungIndex], character('R'), '. - .')).toBe(true)
      expect(isCorrectResponse(CUE_RUNGS[rungIndex], character('R'), '.--')).toBe(false)
      expect(isCorrectResponse(CUE_RUNGS[rungIndex], character('R'), '')).toBe(false)
    }
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
    expect(Object.keys(buildCuePayload(CUE_RUNGS[3], e))).toEqual(['rungId'])
  })
})

describe('a whole item’s journey up the ladder', () => {
  const item: IdentifiedItem = { id: 'i-R', kind: 'bidirectional', prompt: 'R', answer: '.-.' }

  it('moves through supported production, free production and reverse recall', () => {
    let evidence: ItemCueEvidence | undefined
    const seen: string[] = []
    for (let i = 0; i < 10; i += 1) {
      const rung = rungFor(item, evidence)
      seen.push(rung.id)
      evidence = recordAnswer(evidence, {
        direction: rung.direction,
        correct: true,
        assisted: isAssistedRung(rung),
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
