import { describe, expect, it } from 'vitest'
import { buildMorseSchedule, MORSE_LETTERS, type MorseLetter } from './morse'
import { buildLetterMnemonic } from './morseMnemonics'
import {
  CODA_RULE_EXEMPT_BEATS,
  MORSE_VERBAL_LETTERS,
  beatContrastIsUnambiguous,
  finalSoundClass,
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

  it('never lets a beat blur or invert the dit/dah length contrast', () => {
    for (const letter of letters) {
      for (const beat of verbalMnemonic(letter).beats) {
        expect(
          beatContrastIsUnambiguous(beat),
          `${letter}: "${beat.text}" is marked ${beat.length} but its ending does not force that length`,
        ).toBe(true)
      }
    }
  })

  it('gives every short beat a clipped ending and every long beat a sustainable one', () => {
    for (const letter of letters) {
      for (const beat of verbalMnemonic(letter).beats) {
        if (CODA_RULE_EXEMPT_BEATS.includes(beat.text)) continue
        expect(finalSoundClass(beat.text)).toBe(beat.length === 'short' ? 'stop' : 'continuant')
      }
    }
  })

  it('classifies the spelling quirks the set actually relies on', () => {
    expect(finalSoundClass('TONE')).toBe('continuant')
    expect(finalSoundClass('HOME')).toBe('continuant')
    expect(finalSoundClass('WEAVE')).toBe('continuant')
    expect(finalSoundClass('HIGH')).toBe('continuant')
    expect(finalSoundClass('OH')).toBe('continuant')
    expect(finalSoundClass('LONG')).toBe('continuant')
    expect(finalSoundClass('clicked')).toBe('stop')
    expect(finalSoundClass('quick')).toBe('stop')
    // The words this rule exists to keep out: stop-final "long" beats and
    // sustainable "short" beats, both of which shipped before #42.
    expect(finalSoundClass('KITE')).toBe('stop')
    expect(finalSoundClass('COAST')).toBe('stop')
    expect(finalSoundClass('can')).toBe('continuant')
    expect(finalSoundClass('then')).toBe('continuant')
    expect(finalSoundClass('run')).toBe('continuant')
  })

  it('keeps the exemption list to the single documented seed example', () => {
    expect(CODA_RULE_EXEMPT_BEATS).toEqual(['A'])
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
