import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MORSE_LETTERS, type MorseLetter } from '../../lib/morse'
import { patternReading } from '../../lib/acquisition'
import {
  verbalMnemonic,
  verbalMnemonicTextEquivalent,
} from '../../lib/morseVerbalMnemonics'
import type { MorseCharacterLearnItem } from '../../lib/types'
import { MorseCharacterPacket } from './MorseCharacterPacket'
import { MorseBeatGrammarNote, MorsePhrase, beatMarkGlyph } from './MorsePhrase'

const letters = Object.keys(MORSE_LETTERS) as MorseLetter[]

function character(letter: MorseLetter): MorseCharacterLearnItem {
  return {
    glyph: letter,
    pattern: MORSE_LETTERS[letter],
    mnemonicId: `argus-morse-rhythm-v1-${letter}`,
    audioText: letter,
    textLabel: `${letter}: ${patternReading(MORSE_LETTERS[letter])}.`,
  }
}

/** The visible words of the phrase, markup stripped and whitespace collapsed. */
function visibleWords(html: string): string {
  return [...html.matchAll(/<span class="morse-phrase-word">([^<]*)<\/span>/g)]
    .map((match) => match[1])
    .join(' ')
}

/** The visible timing mark under each word, in beat order. */
function visibleMarks(html: string): string[] {
  return [...html.matchAll(/<span class="morse-phrase-mark">([^<]*)<\/span>/g)].map(
    (match) => match[1],
  )
}

describe('the mnemonic phrase grammar', () => {
  it('renders the supplied A LONG exemplar exactly, with its beats marked', () => {
    const html = renderToStaticMarkup(<MorsePhrase glyph="A" />)
    expect(visibleWords(html)).toBe('A LONG')
    // `A` is the short beat despite being a capital letter. The mark says so;
    // the casing cannot, because every word is cased the same way.
    expect(visibleMarks(html)).toEqual(['·', '—'])
  })

  it('gives every A–Z phrase one cohesive line with one mark per Morse element', () => {
    for (const letter of letters) {
      const html = renderToStaticMarkup(<MorsePhrase glyph={letter} />)
      const mnemonic = verbalMnemonic(letter)

      expect(visibleWords(html)).toBe(mnemonic.phrase.toUpperCase())
      expect(visibleMarks(html)).toEqual(
        mnemonic.beats.map((beat) => (beat.length === 'short' ? '·' : '—')),
      )
      // The marks are the pattern: one per element, in transmission order.
      expect(visibleMarks(html).join('')).toBe(
        Array.from(MORSE_LETTERS[letter]).map((mark) => (mark === '.' ? '·' : '—')).join(''),
      )
    }
  })

  it('never lets casing carry the short/held distinction', () => {
    // Casing is constant across the whole visible set, so it discriminates
    // nothing — which is what made `A LONG`, where the capital is the *short*
    // beat, a contradiction under the previous treatment.
    const visible = { short: [] as string[], long: [] as string[] }
    for (const letter of letters) {
      const html = renderToStaticMarkup(<MorsePhrase glyph={letter} />)
      const words = visibleWords(html).split(' ')
      verbalMnemonic(letter).beats.forEach((beat, index) => {
        visible[beat.length].push(words[index])
      })
    }

    expect(visible.short.length).toBeGreaterThan(0)
    expect(visible.long.length).toBeGreaterThan(0)
    for (const word of [...visible.short, ...visible.long]) {
      expect(word).toBe(word.toUpperCase())
    }

    // The authored set is deliberately mixed-case and stays that way, because
    // it is what a screen reader announces. Duration comes from the mark alone.
    const authored = letters.flatMap((letter) => verbalMnemonic(letter).beats)
    expect(authored.some((beat) => beat.text !== beat.text.toUpperCase())).toBe(true)
    expect(beatMarkGlyph('short')).toBe('·')
    expect(beatMarkGlyph('long')).toBe('—')
  })

  it('keeps the authored casing in the accessible reading, with every beat named', () => {
    for (const letter of letters) {
      const html = renderToStaticMarkup(<MorsePhrase glyph={letter} />)
      const equivalent = verbalMnemonicTextEquivalent(letter)
      expect(html).toContain(`aria-label="${equivalent}"`)
      for (const beat of verbalMnemonic(letter).beats) {
        expect(equivalent).toContain(`${beat.text} ${beat.length === 'short' ? 'short, dit' : 'held, dah'}`)
      }
    }
  })

  it('preserves deliberate repetition and marks each repeat as its own beat', () => {
    // #44: repeated words encode repeated Morse elements and must not be
    // deduplicated or look like duplicated data.
    for (const [letter, phrase] of [
      ['U', 'UP UP ZOOM'],
      ['V', 'QUICK QUICK QUICK VROOM'],
      ['X', 'CROSS CUT CUT CROSS'],
      ['Z', 'ZOOM ZOOM ZIP ZIP'],
    ] as const) {
      const html = renderToStaticMarkup(<MorsePhrase glyph={letter} />)
      expect(visibleWords(html)).toBe(phrase)
      expect(visibleMarks(html)).toHaveLength(MORSE_LETTERS[letter].length)
    }
  })

  it('explains the repetition once, in words, without a per-beat caption', () => {
    const html = renderToStaticMarkup(<MorseBeatGrammarNote />)
    expect(html).toContain('One word is one Morse signal')
    expect(html).toContain('repeated word is a deliberately repeated beat')
    expect(html).toContain('ZOOM ZOOM ZIP ZIP')
    // The old noisy per-beat "short ·" / "hold —" captions are gone.
    expect(html).not.toContain('hold —')
  })

  it('shows only a strict prefix when a surface discloses part of a phrase', () => {
    const beats = verbalMnemonic('V').beats.slice(0, 2)
    const html = renderToStaticMarkup(
      <MorsePhrase glyph="V" beats={beats} hiddenCount={2} label="Opening of V" />,
    )
    expect(visibleWords(html)).toBe('QUICK QUICK ??')
    expect(visibleMarks(html)).toEqual(['·', '·', '??'])
    expect(html).toContain('aria-label="Opening of V"')
    expect(html).not.toContain('VROOM')
  })
})

describe('Morse Learn acquisition hierarchy', () => {
  it('puts the phrase before the SVG+Play row, then canonical notation', () => {
    const html = renderToStaticMarkup(<MorseCharacterPacket characters={[character('A')]} />)
    const phraseAt = html.indexOf('morse-phrase-row')
    const visualAt = html.indexOf('morse-visual-row')
    const svgAt = html.indexOf('<svg')
    const playAt = html.indexOf('morse-play')
    const canonicalAt = html.indexOf('morse-canonical')

    expect(phraseAt).toBeGreaterThan(-1)
    expect(visualAt).toBeGreaterThan(phraseAt)
    expect(svgAt).toBeGreaterThan(visualAt)
    // The Play control is spatially attached to the SVG: both sit inside the
    // same morse-visual-row, ahead of the canonical notation underneath.
    expect(playAt).toBeGreaterThan(svgAt)
    expect(canonicalAt).toBeGreaterThan(playAt)
    expect(visibleWords(html)).toBe('A LONG')
  })

  it('gives every card an icon Play/Stop control with an accessible name and no color-only state', () => {
    const html = renderToStaticMarkup(<MorseCharacterPacket characters={[character('A')]} />)
    expect(html).toContain('aria-label="Play A Morse"')
    expect(html).toContain('aria-pressed="false"')
    // Stopped state renders a play-triangle path; nothing here is only a
    // colour difference between playing and stopped.
    expect(html).toContain('M8 5l11 7-11 7z')
    expect(html).not.toContain('rx="1.5"')
  })

  it('renders every A-Z mnemonic as one cohesive phrase with the mechanically verified short/held mapping intact', () => {
    for (const letter of letters) {
      const html = renderToStaticMarkup(<MorseCharacterPacket characters={[character(letter)]} />)
      const mnemonic = verbalMnemonic(letter)

      expect(visibleWords(html)).toBe(mnemonic.phrase.toUpperCase())
      expect(html).toContain(`aria-label="${verbalMnemonicTextEquivalent(letter)}"`)
      expect((html.match(/morse-phrase-beat is-/g) ?? [])).toHaveLength(MORSE_LETTERS[letter].length)
    }
  })

  it('keeps a five-card packet finite and gives every card a direct Play control', () => {
    const packet = ['E', 'I', 'T', 'A', 'N'].map((letter) => character(letter as MorseLetter))
    const html = renderToStaticMarkup(<MorseCharacterPacket characters={packet} />)

    // Anchored so the `morse-cards` list wrapper and any future `morse-card-*`
    // class cannot be miscounted as a card.
    expect((html.match(/class="morse-card(?![-a-z])/g) ?? [])).toHaveLength(5)
    for (const letter of ['E', 'I', 'T', 'A', 'N']) expect(html).toContain(`Play ${letter} Morse`)
    expect(html).toContain('The phrase is the first memory hook')
    expect(html).toContain('secondary timing scaffold')
    // The per-card volume note is gone; one packet-level note remains, and the
    // grammar explanation appears exactly once for the whole packet.
    expect((html.match(/media volume/g) ?? [])).toHaveLength(1)
    expect((html.match(/One word is one Morse signal/g) ?? [])).toHaveLength(1)
  })
})
