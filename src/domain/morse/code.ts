export const MORSE_LETTERS = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
} as const

export type MorseLetter = keyof typeof MORSE_LETTERS
export type MorseMark = '.' | '-'

export const DEFAULT_MORSE_TIMING = {
  characterWpm: 20,
  effectiveWpm: 9,
} as const

/**
 * First-exposure acquisition timing for the Learn packet's single-letter Play
 * control. This is deliberately separate from `DEFAULT_MORSE_TIMING`, and
 * from #29's future auditory-reception performance criteria, which must keep
 * using the full-speed default.
 *
 * `DEFAULT_MORSE_TIMING`'s 20/9 WPM split is a Farnsworth split: the
 * character itself sounds at full 20 WPM speed and only the gaps *between*
 * characters/words are stretched, so a receiving operator gets thinking time
 * without the character's own rhythm changing. A Learn card plays exactly one
 * character, so it never reaches an inter-character or inter-word gap — there
 * is nothing for Farnsworth spacing to stretch, and `effectiveWpm` has no
 * audible effect on a single letter. Reusing the default for Learn therefore
 * means the learner hears the raw 20 WPM character speed on their very first
 * exposure: a dit of 60ms and a dah of 180ms, which reads as a fast double
 * click rather than a short/long rhythm they can map onto a mnemonic phrase.
 *
 * The fix has to lower `characterWpm` itself. Candidates considered, judged
 * against "one recognisable rhythm, not counted elements":
 *  - 20 WPM (the default): ditMs 60ms — rejected, too fast to hear as
 *    short-vs-long on a phone speaker.
 *  - 15 WPM: ditMs 80ms, dahMs 240ms — better, but still brief.
 *  - 12 WPM: ditMs 100ms, dahMs 300ms — a clean, round dit/dah pair. Slow
 *    enough that the held tone is unmistakably longer than the short one,
 *    fast enough that a letter's elements still land as one continuous
 *    rhythm instead of separately counted beeps.
 *  - 8 WPM: ditMs 150ms, dahMs 450ms — rejected. At this speed even a
 *    two-element letter starts sounding like counted elements ("dit... ...
 *    dah") rather than one phrase-length event, which is exactly the failure
 *    mode #44 warns against.
 *
 * 12 WPM is the chosen acquisition character speed. `effectiveWpm` is set
 * equal to it (a Farnsworth scale of 1, i.e. no extra spacing) rather than
 * lower, because a lower value would change nothing audible for a single
 * character — the same "effectiveWpm pretending to solve single-letter
 * speed" #44 calls out — and would only matter if this config were ever
 * reused for multi-character playback, which it is not.
 */
export const LEARN_ACQUISITION_MORSE_TIMING = {
  characterWpm: 12,
  effectiveWpm: 12,
} as const

export interface MorseTimingOptions {
  /** Internal character rhythm. One dit is 1200 / characterWpm milliseconds. */
  characterWpm?: number
  /** Overall PARIS-equivalent rate. May be lower than characterWpm via Farnsworth spacing. */
  effectiveWpm?: number
}

export interface MorseSignalEvent {
  kind: 'signal'
  mark: MorseMark
  units: 1 | 3
  durationMs: number
}

export interface MorseGapEvent {
  kind: 'gap'
  gap: 'intra-character' | 'inter-character' | 'inter-word'
  /** Canonical ITU ratio before Farnsworth scaling: 1, 3 or 7 dit units. */
  units: 1 | 3 | 7
  /** Multiplier applied to the canonical units. Always 1 for intra-character gaps. */
  spacingScale: number
  durationMs: number
}

export type MorseEvent = MorseSignalEvent | MorseGapEvent

export interface MorseSchedule {
  text: string
  characterWpm: number
  effectiveWpm: number
  ditMs: number
  farnsworthScale: number
  events: MorseEvent[]
  durationMs: number
}

function finitePositive(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number greater than zero.`)
  }
  return value
}

/**
 * The standard word PARIS occupies 50 canonical dit units: 31 units of
 * character material/intra-character spacing and 19 units of letter/word
 * spacing. Farnsworth keeps the 31 character units at character speed and
 * scales only the 19 spacing units until the requested effective rate is met.
 */
export function farnsworthSpacingScale(characterWpm: number, effectiveWpm: number): number {
  const character = finitePositive(characterWpm, 'characterWpm')
  const effective = finitePositive(effectiveWpm, 'effectiveWpm')
  if (effective > character) {
    throw new RangeError('effectiveWpm cannot exceed characterWpm; Farnsworth spacing may slow spacing but never stretch or accelerate characters.')
  }
  return (50 * character / effective - 31) / 19
}

export function morsePattern(character: string): string {
  const normalized = character.toUpperCase()
  if (normalized.length !== 1 || !(normalized in MORSE_LETTERS)) {
    throw new RangeError(`Unsupported Morse letter: ${character}`)
  }
  return MORSE_LETTERS[normalized as MorseLetter]
}

function normalizeText(text: string): string {
  const normalized = text.trim().toUpperCase().replace(/\s+/g, ' ')
  if (!normalized) throw new RangeError('Morse text must contain at least one A–Z letter.')
  for (const character of normalized) {
    if (character !== ' ' && !(character in MORSE_LETTERS)) {
      throw new RangeError(`Unsupported Morse character: ${character}`)
    }
  }
  return normalized
}

/** Pure schedule generation. It never touches AudioContext or any browser API. */
export function buildMorseSchedule(text: string, options: MorseTimingOptions = {}): MorseSchedule {
  const characterWpm = finitePositive(options.characterWpm ?? DEFAULT_MORSE_TIMING.characterWpm, 'characterWpm')
  const effectiveWpm = finitePositive(options.effectiveWpm ?? DEFAULT_MORSE_TIMING.effectiveWpm, 'effectiveWpm')
  const farnsworthScale = farnsworthSpacingScale(characterWpm, effectiveWpm)
  const ditMs = 1200 / characterWpm
  const normalized = normalizeText(text)
  const events: MorseEvent[] = []

  const addGap = (gap: MorseGapEvent['gap']) => {
    const units = gap === 'intra-character' ? 1 : gap === 'inter-character' ? 3 : 7
    const spacingScale = gap === 'intra-character' ? 1 : farnsworthScale
    events.push({
      kind: 'gap',
      gap,
      units,
      spacingScale,
      durationMs: ditMs * units * spacingScale,
    })
  }

  const words = normalized.split(' ')
  words.forEach((word, wordIndex) => {
    Array.from(word).forEach((letter, letterIndex) => {
      const pattern = morsePattern(letter)
      Array.from(pattern).forEach((mark, markIndex) => {
        const typedMark = mark as MorseMark
        const units = typedMark === '.' ? 1 : 3
        events.push({ kind: 'signal', mark: typedMark, units, durationMs: ditMs * units })
        if (markIndex < pattern.length - 1) addGap('intra-character')
      })
      if (letterIndex < word.length - 1) addGap('inter-character')
    })
    if (wordIndex < words.length - 1) addGap('inter-word')
  })

  return {
    text: normalized,
    characterWpm,
    effectiveWpm,
    ditMs,
    farnsworthScale,
    events,
    durationMs: events.reduce((sum, event) => sum + event.durationMs, 0),
  }
}
