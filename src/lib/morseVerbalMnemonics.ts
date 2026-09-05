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
 * - a short beat must end in a stop, so it cannot be held (bat, quick, back);
 * - a long beat must end in a continuant, so it can be (BOOM, FAR, GLOWS);
 * - that contrast is enforced mechanically by `finalSoundClass` rather than
 *   trusted to the author's ear, because a "long" word a learner clips (KITE,
 *   COAST) or a "short" word a learner sustains (can, run, then) teaches the
 *   wrong element and is the one failure mode this set must not have;
 * - first word begins with the target letter where practical (V leans on its
 *   three-shorts-then-VROOM shape and X on the familiar X = cross association);
 * - long words are capitalised in the visible phrase as an extra cue, but
 *   duration labels remain explicit so typography is never load-bearing.
 *
 * `A` is the single deliberate exception to the coda rule: issue #42 specifies
 * the phrase "A LONG" verbatim as the worked example of the whole treatment,
 * and its contrast is carried by the vowel-length difference between the two
 * words rather than by their codas.
 */
const DEFINITIONS = {
  A: [['A', 'short'], ['LONG', 'long']],
  B: [['BOOM', 'long'], ['bat', 'short'], ['zip', 'short'], ['pop', 'short']],
  C: [['COME', 'long'], ['cat', 'short'], ['COME', 'long'], ['quick', 'short']],
  D: [['DOWN', 'long'], ['duck', 'short'], ['dip', 'short']],
  E: [['egg', 'short']],
  F: [['flip', 'short'], ['flap', 'short'], ['FLY', 'long'], ['back', 'short']],
  G: [['GROW', 'long'], ['GREEN', 'long'], ['quick', 'short']],
  H: [['hip', 'short'], ['hop', 'short'], ['hit', 'short'], ['pop', 'short']],
  I: [['it', 'short'], ['clicked', 'short']],
  J: [['jet', 'short'], ['FLIES', 'long'], ['FAR', 'long'], ['HOME', 'long']],
  K: [['KING', 'long'], ['kick', 'short'], ['HIGH', 'long']],
  L: [['lap', 'short'], ['LONG', 'long'], ['lap', 'short'], ['quick', 'short']],
  M: [['MOON', 'long'], ['GLOWS', 'long']],
  N: [['NO', 'long'], ['not', 'short']],
  O: [['OH', 'long'], ['SO', 'long'], ['SLOW', 'long']],
  P: [['pup', 'short'], ['GOES', 'long'], ['FAR', 'long'], ['back', 'short']],
  Q: [['QUEEN', 'long'], ['GOES', 'long'], ['quick', 'short'], ['HOME', 'long']],
  R: [['rat', 'short'], ['RAN', 'long'], ['back', 'short']],
  S: [['sit', 'short'], ['sip', 'short'], ['zip', 'short']],
  T: [['TONE', 'long']],
  U: [['up', 'short'], ['up', 'short'], ['ZOOM', 'long']],
  V: [['quick', 'short'], ['quick', 'short'], ['quick', 'short'], ['VROOM', 'long']],
  W: [['web', 'short'], ['WE', 'long'], ['WEAVE', 'long']],
  X: [['CROSS', 'long'], ['cut', 'short'], ['cut', 'short'], ['CROSS', 'long']],
  Y: [['YAWN', 'long'], ['quit', 'short'], ['GO', 'long'], ['HOME', 'long']],
  Z: [['ZOOM', 'long'], ['ZOOM', 'long'], ['zip', 'short'], ['zip', 'short']],
} as const satisfies Record<MorseLetter, readonly BeatDefinition[]>

export type FinalSoundClass = 'stop' | 'continuant'

/**
 * The mnemonic set's load-bearing phonological rule, expressed as a function so
 * it can be asserted rather than assumed.
 *
 * A short beat has to be a word a learner physically cannot draw out, and a
 * long beat has to be one they can. English spells that contrast reliably at
 * the end of a monosyllable: a final stop (/p t k b d g/) clips the word, while
 * a final vowel, nasal, liquid, glide or fricative can be sustained for as long
 * as breath allows.
 *
 * Only the orthographic quirks that actually appear in — or would plausibly be
 * proposed for — this set are handled: silent terminal `e` (TONE, HOME, WEAVE),
 * `gh` (HIGH), silent post-vowel `h` (OH), the `ng` digraph (LONG, KING) and
 * stop-final `-ed` (clicked). Anything else returns no classification, which
 * fails the guard loudly instead of quietly admitting an ambiguous word.
 */
export function finalSoundClass(word: string): FinalSoundClass | null {
  let stem = word.toLowerCase()
  if (stem.endsWith('gh')) stem = stem.slice(0, -2)
  if (stem.length > 2 && stem.endsWith('h') && 'aeiou'.includes(stem[stem.length - 2] ?? '')) {
    stem = stem.slice(0, -1)
  } else if (stem.length === 2 && stem.endsWith('h') && 'aeiou'.includes(stem[0] ?? '')) {
    stem = stem.slice(0, -1)
  }
  if (stem.length > 2 && stem.endsWith('e') && !'aeiou'.includes(stem[stem.length - 2] ?? '')) {
    stem = stem.slice(0, -1)
  }
  if (stem.length === 0) return null
  if (stem.endsWith('ng')) return 'continuant'
  if (/(ck|ct|pt|kt|ked|cked|ped|ted)$/.test(stem)) return 'stop'
  const last = stem[stem.length - 1] ?? ''
  if ('ptkbdg'.includes(last)) return 'stop'
  if ('aeiouwy'.includes(last)) return 'continuant'
  if ('nmlrszvfj'.includes(last)) return 'continuant'
  return null
}

/**
 * The one documented exception to the coda rule, kept as data so the guard
 * stays total and the exception stays visible instead of being a special case
 * buried in a test.
 */
export const CODA_RULE_EXEMPT_BEATS: readonly string[] = ['A']

export function beatContrastIsUnambiguous(beat: MorseVerbalBeat): boolean {
  if (CODA_RULE_EXEMPT_BEATS.includes(beat.text)) return true
  const coda = finalSoundClass(beat.text)
  if (coda === null) return false
  return beat.length === 'short' ? coda === 'stop' : coda === 'continuant'
}

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
