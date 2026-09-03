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
