import { describe, expect, it } from 'vitest'
import { buildMorseSchedule, MORSE_LETTERS, morsePattern, type MorseLetter } from './morse'
import {
  buildLetterMnemonic,
  buildMnemonic,
  canonicalNotation,
  MNEMONIC_RAIL_UNITS,
  MNEMONIC_UNIT,
  MNEMONIC_VIEW_BOX,
  mnemonicId,
  mnemonicTextEquivalent,
  MORSE_MNEMONIC_LETTERS,
  patternExtentUnits,
  spokenRhythm,
} from './morseMnemonics'

/**
 * The prototype cohort required before the full alphabet is drawn (#26).
 * Ten deliberately dissimilar characters, each present for a stated reason.
 */
const PROTOTYPE_COHORT: { letter: MorseLetter; stresses: string }[] = [
  { letter: 'E', stresses: 'single dit — the shortest event in the alphabet' },
  { letter: 'T', stresses: 'single dah — the other single-element character' },
  { letter: 'H', stresses: 'uniform run of four dits' },
  { letter: 'O', stresses: 'uniform run of three dahs' },
  { letter: 'R', stresses: 'short mixed pattern' },
  { letter: 'F', stresses: 'four-element mixed pattern, dit-heavy' },
  { letter: 'Q', stresses: 'four-element mixed pattern, dah-heavy' },
  { letter: 'J', stresses: 'longest keying time in the alphabet' },
  { letter: 'S', stresses: 'confusable pair, member A' },
  { letter: 'U', stresses: 'confusable pair, member B — differs only in its final element' },
]

function grammarInvariants(letter: MorseLetter) {
  const pattern = morsePattern(letter)
  const geometry = buildLetterMnemonic(letter)

  // Rule 1/2: one visual vocabulary. A dit is always one unit wide and a dah
  // always three, in every character, with no per-letter exceptions.
  for (const element of geometry.elements) {
    expect(element.height).toBe(MNEMONIC_UNIT)
    expect(element.width).toBe(element.kind === 'dit' ? MNEMONIC_UNIT : MNEMONIC_UNIT * 3)
    expect(element.units).toBe(element.kind === 'dit' ? 1 : 3)
  }

  // Rule 3: transmission order, left to right, one unit of silence between.
  expect(geometry.elements.map((element) => element.mark).join('')).toBe(pattern)
  geometry.elements.forEach((element, index) => {
    expect(element.index).toBe(index)
    if (index === 0) return
    const previous = geometry.elements[index - 1]
    expect(element.x - (previous.x + previous.width)).toBe(MNEMONIC_UNIT)
    expect(element.x).toBeGreaterThan(previous.x)
  })

  // Rule 4: same rail, same origin, same unit size for every character.
  expect(geometry.viewBox).toBe(MNEMONIC_VIEW_BOX)
  expect(geometry.elements[0].x).toBe(geometry.railStart)
  expect(geometry.extentX).toBeLessThanOrEqual(geometry.railEnd)

  return geometry
}

describe('mnemonic grammar prototype', () => {
  it('covers single elements, uniform runs, mixed patterns and a confusable pair', () => {
    const patterns = PROTOTYPE_COHORT.map(({ letter }) => morsePattern(letter))
    expect(PROTOTYPE_COHORT).toHaveLength(10)
    expect(patterns).toContain('.')
    expect(patterns).toContain('-')
    expect(patterns.some((pattern) => /^\.+$/.test(pattern) && pattern.length > 1)).toBe(true)
    expect(patterns.some((pattern) => /^-+$/.test(pattern) && pattern.length > 1)).toBe(true)
    expect(patterns.filter((pattern) => /\./.test(pattern) && /-/.test(pattern)).length).toBeGreaterThanOrEqual(4)
    // S and U differ only in the final element: the family the grammar most
    // has to keep apart at a glance.
    expect(morsePattern('S').slice(0, -1)).toBe(morsePattern('U').slice(0, -1))
    expect(morsePattern('S')).not.toBe(morsePattern('U'))
  })

  it.each(PROTOTYPE_COHORT)('holds every grammar rule for $letter ($stresses)', ({ letter }) => {
    grammarInvariants(letter)
  })

  it('renders the confusable pair with a visible difference at the final element', () => {
    const s = buildLetterMnemonic('S')
    const u = buildLetterMnemonic('U')
    const shared = s.elements.slice(0, -1)
    shared.forEach((element, index) => {
      expect(u.elements[index].x).toBe(element.x)
      expect(u.elements[index].width).toBe(element.width)
    })
    const lastS = s.elements[s.elements.length - 1]
    const lastU = u.elements[u.elements.length - 1]
    expect(lastU.x).toBe(lastS.x)
    expect(lastU.width).not.toBe(lastS.width)
    expect(u.extentUnits).toBeGreaterThan(s.extentUnits)
  })

  it('keeps whole-pattern length comparable between characters', () => {
    // Length is information: the shortest character in the alphabet must draw
    // shorter than the longest, at the same unit size.
    expect(buildLetterMnemonic('E').extentX).toBeLessThan(buildLetterMnemonic('J').extentX)
    expect(buildLetterMnemonic('E').unit).toBe(buildLetterMnemonic('J').unit)
  })
})

describe('mnemonic grammar across the full alphabet', () => {
  it('applies the identical rules to all 26 characters', () => {
    expect(MORSE_MNEMONIC_LETTERS).toHaveLength(26)
    for (const letter of MORSE_MNEMONIC_LETTERS) grammarInvariants(letter)
  })

  it('draws the same timing the audio engine plays', () => {
    // The picture is a rendering of the schedule, not a separate illustration.
    for (const letter of MORSE_MNEMONIC_LETTERS) {
      const geometry = buildLetterMnemonic(letter)
      const schedule = buildMorseSchedule(letter, { characterWpm: 20, effectiveWpm: 20 })
      expect(geometry.extentUnits * schedule.ditMs).toBeCloseTo(schedule.durationMs, 6)
      expect(geometry.elements.map((element) => element.units)).toEqual(
        schedule.events.filter((event) => event.kind === 'signal').map((event) => event.units),
      )
    }
  })

  it('gives every character a distinct silhouette', () => {
    const silhouettes = MORSE_MNEMONIC_LETTERS.map((letter) =>
      buildLetterMnemonic(letter)
        .elements.map((element) => `${element.kind}@${element.x}`)
        .join('|'),
    )
    expect(new Set(silhouettes).size).toBe(26)
  })

  it('fits every character on the shared rail', () => {
    for (const pattern of Object.values(MORSE_LETTERS)) {
      expect(patternExtentUnits(pattern)).toBeLessThanOrEqual(MNEMONIC_RAIL_UNITS)
    }
  })
})

describe('semantic equivalents', () => {
  it('names the rhythm, the count and the order for every character', () => {
    for (const letter of MORSE_MNEMONIC_LETTERS) {
      const pattern = morsePattern(letter)
      const text = mnemonicTextEquivalent(letter, pattern)
      expect(text.startsWith(`${letter} is `)).toBe(true)
      expect(text).toContain(spokenRhythm(pattern))
      expect(text).toContain(`${pattern.length} element`)
      expect(text).toContain('in that order')
    }
  })

  it('spells the rhythm in transmission order', () => {
    expect(spokenRhythm('.-.')).toBe('dit dah dit')
    expect(spokenRhythm('-')).toBe('dah')
    expect(mnemonicTextEquivalent('E', '.')).toContain('1 element')
  })

  it('writes canonical notation with the plain dot and dash characters', () => {
    expect(canonicalNotation('.-.')).toBe('· — ·')
    expect(canonicalNotation('----')).toBe('— — — —')
  })

  it('derives a stable mnemonic asset id from the character', () => {
    expect(mnemonicId('r')).toBe('argus-morse-rhythm-v1-R')
    expect(mnemonicId('R')).toBe(mnemonicId('r'))
  })
})

describe('mnemonic geometry guards', () => {
  it('rejects notation that is not canonical dots and dashes', () => {
    expect(() => buildMnemonic('A', '.x')).toThrow(RangeError)
    expect(() => buildMnemonic('A', '')).toThrow(RangeError)
  })

  it('rejects a pattern longer than the shared rail', () => {
    expect(() => buildMnemonic('?', '------')).toThrow(RangeError)
  })
})
