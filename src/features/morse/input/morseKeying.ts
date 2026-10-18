// Owns categorical press timing and bounded Morse entry construction.

/** Hold long enough to mean a dah, but short enough to stay comfortable one-handed. */
export const MORSE_HOLD_MS = 300

/** The longest character Argus plays: six elements, the punctuation marks. */
export const MORSE_MAX_ELEMENTS = 6

export function morseElementForPressDuration(durationMs: number): '.' | '-' {
  return durationMs >= MORSE_HOLD_MS ? '-' : '.'
}

export function nextMorseEntry(
  current: string,
  element: '.' | '-',
  expectedLength: number,
): { entry: string; complete: boolean } {
  if (!Number.isInteger(expectedLength) || expectedLength < 1 || expectedLength > MORSE_MAX_ELEMENTS) {
    throw new RangeError(`expectedLength must be an integer from 1 to ${MORSE_MAX_ELEMENTS}.`)
  }
  const entry = current.length < expectedLength ? `${current}${element}` : current
  return { entry, complete: entry.length === expectedLength }
}

/**
 * Keyboard entry has no pointer, but it uses the identical commit path, so it
 * borrows a pointer id that a real pointer can never be assigned.
 */
export const KEYBOARD_POINTER_ID = -1

export interface PressState {
  pointerId: number
  startedAt: number
  releasedElement?: '.' | '-'
}

export function defaultNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

