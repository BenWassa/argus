import { MORSE_LETTERS, type MorseLetter, type MorseMark } from './morse'

export type MnemonicBeatLength = 'short' | 'long'

export interface MorseVerbalBeat {
  text: string
  length: MnemonicBeatLength
}

export interface MorseVerbalMnemonic {
  letter: MorseLetter
  beats: readonly MorseVerbalBeat[]
  phrase: string
}

type BeatDefinition = readonly [text: string, length: MnemonicBeatLength]

/**
 * Argus's original verbal acquisition set.
 *
 * Each entry is authored as spoken beats rather than as Morse marks. The tests
 * independently convert short/long back to dot/dash and compare all 26 entries
 * against the canonical ITU table in `morse.ts`; this keeps mnemonic wording
 * from becoming another source of truth for the code itself.
 *
 * Editorial rules:
 * - one monosyllabic word per Morse element;
 * - clipped, stop-heavy words for short beats where practical;
 * - naturally sustain-able vowels/continuants for long beats;
 * - first word begins with the target letter where practical (X uses the
 *   familiar visual association X = cross);
 * - long words are capitalised in the visible phrase as an extra cue, but
 *   duration labels remain explicit so typography is never load-bearing.
 */
const DEFINITIONS = {
  A: [['A', 'short'], ['LONG', 'long']],
  B: [['BOOM', 'long'], ['bat', 'short'], ['zip', 'short'], ['pop', 'short']],
  C: [['COAST', 'long'], ['cat', 'short'], ['CREEPS', 'long'], ['quick', 'short']],
  D: [['DRONE', 'long'], ['dips', 'short'], ['quick', 'short']],
  E: [['egg', 'short']],
  F: [['fish', 'short'], ['can', 'short'], ['FLY', 'long'], ['fast', 'short']],
  G: [['GLOW', 'long'], ['GROWS', 'long'], ['dim', 'short']],
  H: [['hip', 'short'], ['hop', 'short'], ['hit', 'short'], ['pop', 'short']],
  I: [['it', 'short'], ['fits', 'short']],
  J: [['jet', 'short'], ['FLIES', 'long'], ['FAR', 'long'], ['HOME', 'long']],
  K: [['KITE', 'long'], ['dips', 'short'], ['HIGH', 'long']],
  L: [['lamp', 'short'], ['GLOWS', 'long'], ['then', 'short'], ['dims', 'short']],
  M: [['MOON', 'long'], ['GLOWS', 'long']],
  N: [['NO', 'long'], ['not', 'short']],
  O: [['OH', 'long'], ['SO', 'long'], ['SLOW', 'long']],
  P: [['pup', 'short'], ['GOES', 'long'], ['FAR', 'long'], ['back', 'short']],
  Q: [['QUEEN', 'long'], ['GOES', 'long'], ['quick', 'short'], ['HOME', 'long']],
  R: [['run', 'short'], ['FAR', 'long'], ['back', 'short']],
  S: [['sit', 'short'], ['sip', 'short'], ['zip', 'short']],
  T: [['TONE', 'long']],
  U: [['up', 'short'], ['then', 'short'], ['ZOOM', 'long']],
  V: [['van', 'short'], ['can', 'short'], ['zip', 'short'], ['FAR', 'long']],
  W: [['wren', 'short'], ['FLIES', 'long'], ['HOME', 'long']],
  X: [['CROSS', 'long'], ['cut', 'short'], ['cut', 'short'], ['CROSS', 'long']],
  Y: [['YAWN', 'long'], ['then', 'short'], ['GO', 'long'], ['HOME', 'long']],
  Z: [['ZOOM', 'long'], ['ZOOM', 'long'], ['zip', 'short'], ['zip', 'short']],
} as const satisfies Record<MorseLetter, readonly BeatDefinition[]>

export const MORSE_VERBAL_LETTERS = Object.keys(DEFINITIONS) as MorseLetter[]

export function beatMark(length: MnemonicBeatLength): MorseMark {
  return length === 'short' ? '.' : '-'
}

export function verbalMnemonicPattern(letter: MorseLetter): string {
  return DEFINITIONS[letter].map(([, length]) => beatMark(length)).join('')
}

export function verbalMnemonic(letter: string): MorseVerbalMnemonic {
  const normalized = letter.trim().toUpperCase()
  if (normalized.length !== 1 || !(normalized in DEFINITIONS)) {
    throw new RangeError(`Unsupported Morse mnemonic letter: ${letter}`)
  }
  const typed = normalized as MorseLetter
  const beats: MorseVerbalBeat[] = DEFINITIONS[typed].map(([text, length]) => ({ text, length }))
  return { letter: typed, beats, phrase: beats.map((beat) => beat.text).join(' ') }
}

export function verbalMnemonicTextEquivalent(letter: string): string {
  const mnemonic = verbalMnemonic(letter)
  const beatReading = mnemonic.beats
    .map((beat) => `${beat.text} ${beat.length === 'short' ? 'short, dit' : 'held, dah'}`)
    .join('; ')
  return `${mnemonic.letter} mnemonic: “${mnemonic.phrase}”. ${beatReading}.`
}

/**
 * Runtime guard for callers that consume a mnemonic as acquisition content.
 * The canonical mapping remains owned by MORSE_LETTERS; a future editorial
 * change that drifts from it fails loudly rather than teaching the wrong code.
 */
export function assertCanonicalVerbalMnemonic(letter: MorseLetter): MorseVerbalMnemonic {
  const pattern = verbalMnemonicPattern(letter)
  if (pattern !== MORSE_LETTERS[letter]) {
    throw new Error(`Verbal mnemonic for ${letter} encodes ${pattern}, expected ${MORSE_LETTERS[letter]}.`)
  }
  return verbalMnemonic(letter)
}
