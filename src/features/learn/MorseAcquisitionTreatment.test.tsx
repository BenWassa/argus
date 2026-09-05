import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MORSE_LETTERS, type MorseLetter } from '../../lib/morse'
import { patternReading } from '../../lib/acquisition'
import { verbalMnemonic } from '../../lib/morseVerbalMnemonics'
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

describe('Morse Learn acquisition hierarchy', () => {
  it('puts the verbal hook before SVG, canonical notation, and audio controls', () => {
    const html = renderToStaticMarkup(<MorseCharacterPacket characters={[character('A')]} />)
    const verbalAt = html.indexOf('morse-verbal-row')
    const svgAt = html.indexOf('<svg')
    const canonicalAt = html.indexOf('morse-canonical')
    const audioAt = html.indexOf('morse-audio-control')

    expect(verbalAt).toBeGreaterThan(-1)
    expect(svgAt).toBeGreaterThan(verbalAt)
    expect(canonicalAt).toBeGreaterThan(svgAt)
    expect(audioAt).toBeGreaterThan(canonicalAt)
    expect(html).toContain('A')
    expect(html).toContain('LONG')
    expect(html).toContain('short ·')
    expect(html).toContain('hold —')
    expect(html).toContain('Play A')
  })

  it('renders one labelled spoken beat per canonical element for all 26 letters', () => {
    for (const letter of letters) {
      const html = renderToStaticMarkup(<MorseCharacterPacket characters={[character(letter)]} />)
      const mnemonic = verbalMnemonic(letter)
      for (const beat of mnemonic.beats) expect(html).toContain(beat.text)
      expect(html).toContain(`aria-label="${letter} mnemonic:`)
      expect((html.match(/morse-verbal-beat is-/g) ?? [])).toHaveLength(MORSE_LETTERS[letter].length)
    }
  })

  it('keeps a five-card packet finite and gives every card a direct Play control', () => {
    const packet = ['E', 'I', 'T', 'A', 'N'].map((letter) => character(letter as MorseLetter))
    const html = renderToStaticMarkup(<MorseCharacterPacket characters={packet} />)

    // Anchored so the `morse-cards` list wrapper and any future `morse-card-*`
    // class cannot be miscounted as a card.
    expect((html.match(/class="morse-card(?![-a-z])/g) ?? [])).toHaveLength(5)
    for (const letter of ['E', 'I', 'T', 'A', 'N']) expect(html).toContain(`Play ${letter}`)
    expect(html).toContain('The phrase is the first memory hook')
    expect(html).toContain('secondary timing scaffold')
  })
})
