import { MORSE_LETTERS, morsePattern, type MorseLetter, type MorseMark } from './morse'

/**
 * The Argus Morse mnemonic grammar.
 *
 * One grammar, applied identically to every character. The picture is a
 * *rendering of the timing*, not a rebus that has to be decoded: a learner
 * reads `letter + rhythm` as a single unit rather than inspecting elements and
 * traversing a tree to derive the letter (PRD §5.3).
 *
 * Rules, in full:
 *
 *  1. A dit is always the same visual event: a circle one unit wide.
 *  2. A dah is always the same visual event: a bar three units wide, the same
 *     height as the dit. The 1:3 ratio is the ITU ratio, not a style choice.
 *  3. Elements sit left to right in transmission order, separated by exactly
 *     one unit — the canonical intra-character gap.
 *  4. Every character is drawn on the same rail, at the same unit size, from
 *     the same origin. Pattern *length* is therefore directly comparable
 *     between characters: E is visibly the shortest event in the alphabet.
 *  5. The uppercase glyph is the dominant mark and the rail emanates from it,
 *     so the pair is one object rather than a letter beside a diagram.
 *  6. Nothing about the drawing is letter-specific. There are no per-letter
 *     illustrations to interpret, so there is nothing to decode.
 *
 * Everything here is pure geometry. No React, no DOM, no audio.
 */

/** One dit, in SVG user units. Every other measurement derives from it. */
export const MNEMONIC_UNIT = 8

/**
 * The rail is sized for the longest character the grammar must ever carry —
 * five dahs and four gaps — so that adding digits later cannot change the unit
 * size and silently re-scale every existing letter.
 */
export const MNEMONIC_RAIL_UNITS = 19

export const MNEMONIC_GLYPH_BOX = 44
export const MNEMONIC_GUTTER = 14
export const MNEMONIC_HEIGHT = 52

export const MNEMONIC_RAIL_START = MNEMONIC_GLYPH_BOX + MNEMONIC_GUTTER
export const MNEMONIC_RAIL_WIDTH = MNEMONIC_RAIL_UNITS * MNEMONIC_UNIT
export const MNEMONIC_WIDTH = MNEMONIC_RAIL_START + MNEMONIC_RAIL_WIDTH
export const MNEMONIC_CENTER_Y = MNEMONIC_HEIGHT / 2
export const MNEMONIC_VIEW_BOX = `0 0 ${MNEMONIC_WIDTH} ${MNEMONIC_HEIGHT}`

export type MnemonicElementKind = 'dit' | 'dah'

export interface MnemonicElement {
  /** Transmission order, zero-based. Index 0 is keyed first. */
  index: number
  kind: MnemonicElementKind
  mark: MorseMark
  /** Canonical duration in dit units: 1 or 3. */
  units: 1 | 3
  /** Dit units elapsed within the character when this element starts. */
  startUnit: number
  x: number
  width: number
  y: number
  height: number
}

export interface MnemonicGeometry {
  glyph: string
  pattern: string
  elements: MnemonicElement[]
  unit: number
  /** Total dit units the character occupies, gaps included. */
  extentUnits: number
  /** Where the drawn rhythm ends. Always <= the rail end. */
  extentX: number
  railStart: number
  railEnd: number
  centerY: number
  glyphX: number
  glyphY: number
  width: number
  height: number
  viewBox: string
}

const DIT_HEIGHT = MNEMONIC_UNIT

function markUnits(mark: MorseMark): 1 | 3 {
  return mark === '.' ? 1 : 3
}

/** Canonical `·`/`—` notation, per the grammar's "notation beneath" rule. */
export function canonicalNotation(pattern: string): string {
  return Array.from(pattern)
    .map((mark) => (mark === '.' ? '·' : '—'))
    .join(' ')
}

/** The spoken rhythm. This is the non-visual acquisition path, not decoration. */
export function spokenRhythm(pattern: string): string {
  return Array.from(pattern)
    .map((mark) => (mark === '.' ? 'dit' : 'dah'))
    .join(' ')
}

/**
 * The semantic equivalent every mnemonic must carry. It names the glyph, the
 * spoken rhythm, the element count and the transmission order, so a learner who
 * never sees the SVG still receives everything the SVG encodes.
 */
export function mnemonicTextEquivalent(glyph: string, pattern: string): string {
  const count = pattern.length
  return `${glyph} is ${spokenRhythm(pattern)} — ${count} ${count === 1 ? 'element' : 'elements'}, keyed in that order.`
}

/** Dit units a character occupies including its intra-character gaps. */
export function patternExtentUnits(pattern: string): number {
  const marks = Array.from(pattern) as MorseMark[]
  const signal = marks.reduce((sum, mark) => sum + markUnits(mark), 0)
  return signal + Math.max(0, marks.length - 1)
}

function assertPattern(pattern: string): MorseMark[] {
  if (!/^[.-]+$/.test(pattern)) {
    throw new RangeError(`A Morse mnemonic needs canonical dot/dash notation, received "${pattern}".`)
  }
  const marks = Array.from(pattern) as MorseMark[]
  if (patternExtentUnits(pattern) > MNEMONIC_RAIL_UNITS) {
    throw new RangeError(`Pattern "${pattern}" is longer than the mnemonic rail supports.`)
  }
  return marks
}

/**
 * Lay one character out on the rail. The result is deterministic: the same
 * pattern always produces byte-identical geometry, which is what lets the
 * grammar be regression-tested rather than eyeballed.
 */
export function buildMnemonic(glyph: string, pattern: string): MnemonicGeometry {
  const marks = assertPattern(pattern)
  const y = MNEMONIC_CENTER_Y - DIT_HEIGHT / 2
  const elements: MnemonicElement[] = []

  let startUnit = 0
  for (let index = 0; index < marks.length; index += 1) {
    const mark = marks[index]
    const units = markUnits(mark)
    elements.push({
      index,
      kind: mark === '.' ? 'dit' : 'dah',
      mark,
      units,
      startUnit,
      x: MNEMONIC_RAIL_START + startUnit * MNEMONIC_UNIT,
      width: units * MNEMONIC_UNIT,
      y,
      height: DIT_HEIGHT,
    })
    // Rule 3: exactly one unit of silence between elements, and none after the
    // last one — the inter-character gap belongs to the schedule, not the card.
    startUnit += units + (index < marks.length - 1 ? 1 : 0)
  }

  return {
    glyph,
    pattern,
    elements,
    unit: MNEMONIC_UNIT,
    extentUnits: startUnit,
    extentX: MNEMONIC_RAIL_START + startUnit * MNEMONIC_UNIT,
    railStart: MNEMONIC_RAIL_START,
    railEnd: MNEMONIC_RAIL_START + MNEMONIC_RAIL_WIDTH,
    centerY: MNEMONIC_CENTER_Y,
    glyphX: MNEMONIC_GLYPH_BOX / 2,
    glyphY: MNEMONIC_CENTER_Y,
    width: MNEMONIC_WIDTH,
    height: MNEMONIC_HEIGHT,
    viewBox: MNEMONIC_VIEW_BOX,
  }
}

export function buildLetterMnemonic(letter: MorseLetter): MnemonicGeometry {
  return buildMnemonic(letter, morsePattern(letter))
}

/**
 * Stable asset identity for a mnemonic. The artwork is generated from the
 * pattern rather than authored per letter, so the id names the grammar and the
 * character rather than pointing at a file that could drift from the mapping.
 */
export function mnemonicId(glyph: string): string {
  return `argus-morse-rhythm-v1-${glyph.toUpperCase()}`
}

export const MORSE_MNEMONIC_LETTERS = Object.keys(MORSE_LETTERS) as MorseLetter[]
