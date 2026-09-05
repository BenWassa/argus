import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MORSE_LETTERS, type MorseLetter } from '../../lib/morse'
import { patternReading } from '../../lib/acquisition'
import { verbalMnemonic, verbalMnemonicTextEquivalent } from '../../lib/morseVerbalMnemonics'
import type { MorseCharacterLearnItem } from '../../lib/types'
import { MorseCharacterPacket } from './MorseCharacterPacket'

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

/** Visible text of the phrase row, with markup stripped and whitespace
 * collapsed — what a sighted reader actually sees as one line. */
function visiblePhraseText(html: string): string {
  const match = /<span class="morse-phrase-beats"[^>]*>([\s\S]*?)<\/span><\/p>/.exec(html)
  if (!match) throw new Error('morse-phrase-beats markup not found')
  return match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

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

    // The exact worked example from #42/#44: A reads, unmistakably, as the
    // one-line phrase "A LONG" — not as two separately captioned beats.
    expect(visiblePhraseText(html)).toBe('A LONG')
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

      // Visible: exactly the phrase, one line, in beat order.
      expect(visiblePhraseText(html)).toBe(mnemonic.phrase)

      // Accessible: the full short/held reading survives even though it is
      // no longer repeated as a visible per-beat caption.
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
    // The per-card volume note is gone; one packet-level note remains.
    expect((html.match(/media volume/g) ?? [])).toHaveLength(1)
  })
})
