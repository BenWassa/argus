/**
 * The one place Argus is allowed to vibrate, and the whole vocabulary it may
 * vibrate in.
 *
 * Before this module there was a single private `haptic(pattern)` helper inside
 * `TestSession`, called with three bare numbers. That had two consequences. The
 * scored check was the only surface in the product with any tactile feedback,
 * while `MorseKeyInput` — the one interaction that is *physically a key* — had
 * none. And because callers passed raw milliseconds, there was no vocabulary to
 * keep consistent and nothing stopping a fourth caller inventing a fourth
 * rhythm that meant roughly the same thing.
 *
 * So this module exports effects, not durations. A caller says what happened;
 * it never says how long to buzz. Adding a sixth effect is a deliberate edit to
 * `HAPTIC_PATTERNS`, which is the mechanism that stops the set drifting to
 * fifteen subtly different taps.
 *
 * ## Vibration is never the only signal
 *
 * Every effect below accompanies something the learner can also see. That is
 * not a style preference, it is what makes the platform reality survivable:
 *
 *  - Safari has never implemented the Vibration API, on iOS or macOS. There is
 *    no standards-based way to vibrate from a web page on an iPhone. The known
 *    workaround — programmatically clicking a label bound to a hidden
 *    `<input type="checkbox" switch>` — is a quirk of one element's
 *    implementation that Apple patched out in iOS 26.5, and it is deliberately
 *    not used here.
 *  - `navigator.vibrate` returns `false` for a hidden document, may be rate
 *    limited, and may be disabled per origin as a fingerprinting mitigation.
 *
 * A call therefore fails silently and often, and `fire` reports that honestly
 * rather than pretending. Because nothing is conveyed by vibration alone, a
 * failed call costs the learner nothing.
 *
 * ## Why these are not Morse
 *
 * None of these patterns encodes a dit/dah. The spec truncates a pattern past
 * ten entries and makes no timing-fidelity guarantee at all, so the 1:3 ratio
 * that distinguishes the two elements cannot be trusted to survive the trip
 * through the OS scheduler. A vibrated pattern can say *something happened*;
 * it cannot reliably say *what*.
 */

export const HAPTIC_EFFECTS = ['element', 'settle', 'miss', 'word', 'crest'] as const
export type HapticEffect = (typeof HAPTIC_EFFECTS)[number]

/**
 * The vocabulary.
 *
 * `settle` and `miss` are the values the scored check already shipped with,
 * promoted unchanged rather than retuned: they were chosen against a real
 * device and there is no reason to spend the learner's recalibration on a
 * refactor.
 *
 * The set is ordered by rarity, and so is its weight. `element` fires many
 * times a minute and is the lightest thing the hardware can do; `crest` fires
 * at most once a session and is the only pattern over 100ms in total. That
 * ordering is the entire design — a celebration reads as a celebration because
 * the ordinary case stayed quiet, not because the celebration got louder.
 *
 * Every pattern is well inside the spec's ten-entry cap.
 */
export const HAPTIC_PATTERNS: Record<HapticEffect, number | number[]> = {
  /** A keyed element landed. The lightest confirmation the hardware has. */
  element: 8,
  /** One correct character. */
  settle: 12,
  /** Any incorrect answer. Distinguished by rhythm, never by force. */
  miss: [10, 24, 10],
  /** A whole word or group answered correctly. */
  word: [14, 40, 22],
  /** Stage advance, personal best, session complete. At most once a session. */
  crest: [18, 40, 18, 40, 30],
}

const PREFERENCE_KEY = 'argus.haptics.v1'

/**
 * Haptics are on unless the learner turned them off.
 *
 * Default-on rather than default-off because the feedback is restrained by
 * construction and because a tactile key is the point — a learner who has to
 * discover a setting before the key feels like a key has already met the
 * version of the product this module exists to replace.
 */
export function hapticsEnabled(): boolean {
  try {
    return localStorage.getItem(PREFERENCE_KEY) !== 'off'
  } catch {
    // A storage-denied context is not a reason to withhold feedback.
    return true
  }
}

export function setHapticsEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.removeItem(PREFERENCE_KEY)
    else localStorage.setItem(PREFERENCE_KEY, 'off')
  } catch {
    /* The preference is a convenience; failing to store it must not throw. */
  }
}

/** Whether this browser exposes the Vibration API at all. */
export function hapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

/**
 * Fire one named effect.
 *
 * Returns whether the device actually accepted it, which is *not* the same as
 * whether it was felt. Callers are expected to ignore the result; it exists so
 * tests can assert the boundary and so a future diagnostic can report support
 * without a second code path.
 */
export function fire(effect: HapticEffect): boolean {
  if (!hapticsSupported() || !hapticsEnabled()) return false
  try {
    return navigator.vibrate(HAPTIC_PATTERNS[effect]) === true
  } catch {
    // Feedback is optional everywhere it is used. It must never be able to
    // interrupt a keyed answer, a graded check or a celebration.
    return false
  }
}

/** Stop anything currently running. Used when a surface is torn down mid-pattern. */
export function cancelHaptics(): void {
  if (!hapticsSupported()) return
  try {
    navigator.vibrate(0)
  } catch {
    /* as above */
  }
}
