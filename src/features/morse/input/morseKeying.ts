// Owns categorical press timing and bounded Morse entry construction.

/**
 * The dit/dah cutoff: the midpoint between a canonical dit (100ms) and dah
 * (300ms) at the Learn rate, the same 2-unit boundary Morse decoders use.
 *
 * It used to be 300ms, the dah's *full* length, so a dah released even a touch
 * early (a natural 250ms hold) was recorded as a dit. A tap rarely lasts past
 * ~150ms, so 200ms leaves room on both sides.
 */
export const MORSE_HOLD_MS = 200

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

