import { describe, expect, it } from 'vitest'
import { buildMorseSchedule, MORSE_LETTERS, type MorseLetter } from './morse'
import { buildLetterMnemonic } from './morseMnemonics'
import {
  MORSE_VERBAL_LETTERS,
  assertCanonicalVerbalMnemonic,
  beatMark,
  verbalMnemonic,
  verbalMnemonicPattern,
  verbalMnemonicTextEquivalent,
} from './morseVerbalMnemonics'

const letters = Object.keys(MORSE_LETTERS) as MorseLetter[]

describe('A-Z rhythmic verbal mnemonics', () => {
  it('contains one deliberate mnemonic for every canonical A-Z letter', () => {
    expect(MORSE_VERBAL_LETTERS).toHaveLength(26)
    expect(new Set(MORSE_VERBAL_LETTERS)).toEqual(new Set(letters))
  })

  it('maps every spoken short/long beat exactly to the canonical ITU pattern', () => {
    for (const letter of letters) {
      const mnemonic = assertCanonicalVerbalMnemonic(letter)
      expect(verbalMnemonicPattern(letter)).toBe(MORSE_LETTERS[letter])
      expect(mnemonic.beats.map((beat) => beatMark(beat.length)).join('')).toBe(MORSE_LETTERS[letter])
      expect(mnemonic.beats).toHaveLength(MORSE_LETTERS[letter].length)
    }
  })

  it('makes verbal, SVG and synthesized audio carry the identical 1:3 signal sequence', () => {
    for (const letter of letters) {
      const verbalUnits = verbalMnemonic(letter).beats.map((beat) => (beat.length === 'short' ? 1 : 3))
      const svgUnits = buildLetterMnemonic(letter).elements.map((element) => element.units)
      const audioUnits = buildMorseSchedule(letter, { characterWpm: 20, effectiveWpm: 20 })
        .events.filter((event) => event.kind === 'signal')
        .map((event) => event.units)
      expect(verbalUnits).toEqual(svgUnits)
      expect(verbalUnits).toEqual(audioUnits)
    }
  })

  it('keeps one spoken word per Morse element and an explicit semantic duration reading', () => {
    for (const letter of letters) {
      const mnemonic = verbalMnemonic(letter)
      expect(mnemonic.phrase.split(/\s+/)).toHaveLength(MORSE_LETTERS[letter].length)
      const equivalent = verbalMnemonicTextEquivalent(letter)
      expect(equivalent).toContain(`${letter} mnemonic:`)
      for (const beat of mnemonic.beats) {
        expect(beat.text.trim()).toBe(beat.text)
        expect(beat.text).not.toMatch(/\s/)
        expect(equivalent).toContain(beat.length === 'short' ? 'short, dit' : 'held, dah')
      }
    }
  })

  it('uses the supplied A example exactly', () => {
    const a = verbalMnemonic('A')
    expect(a.phrase).toBe('A LONG')
    expect(a.beats.map((beat) => beat.length)).toEqual(['short', 'long'])
    expect(verbalMnemonicPattern('A')).toBe('.-')
  })

  it('rejects unsupported characters rather than inventing a phrase', () => {
    expect(() => verbalMnemonic('1')).toThrow(RangeError)
    expect(() => verbalMnemonic('?')).toThrow(RangeError)
  })
})
