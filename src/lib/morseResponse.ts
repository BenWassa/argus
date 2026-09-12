import { LEARN_ACQUISITION_MORSE_TIMING } from './morse'

/**
 * One shared response policy for every keyed Morse surface (#87).
 *
 * Before this module Learn and the #78 checkpoints each owned a private
 * feedback duration (1400ms vs 650ms) and a correct answer in Learn advanced
 * synchronously, so its feedback was never perceived at all. The learner
 * experienced the same retrieval as two different interactions depending on
 * which surface they were standing on and whether they happened to be right.
 *
 * These constants are the whole policy. They describe *perception*, not
 * evidence: nothing here reaches the scheduler, the ladder, `DirectionEvidence`
 * or the durable sitting.
 */

/**
 * A hit is acknowledged and then moves on. Long enough to register as an
 * event, short enough that ten retrievals never feel gated behind an animation.
 */
export const MORSE_FEEDBACK_CORRECT_MS = 550

/**
 * A miss has to be read, not just noticed: these surfaces show the correct
 * pattern, and on Learn a whole re-teaching stage. This is the previous Learn
 * reteach dwell, kept, and now applied to checkpoints too so a miss does not
 * flash past in half the time on one surface and linger on the other.
 */
export const MORSE_FEEDBACK_WRONG_MS = 1400

/**
 * The outgoing/incoming swap. Deliberately shorter than `--t-base`: this is
 * orientation between two retrievals, not a screen change. Input stays gated
 * for its whole duration, including under `prefers-reduced-motion`, where the
 * visual part is removed and the gate is not.
 */
export const MORSE_TRANSITION_MS = 180

export function morseFeedbackMs(correct: boolean): number {
  return correct ? MORSE_FEEDBACK_CORRECT_MS : MORSE_FEEDBACK_WRONG_MS
}

/**
 * Canonical audible length of one keyed element at the Learn acquisition rate.
 *
 * This is the bridge that decouples classification from playback. Press
 * duration still chooses *which* element (see `morseElementForPressDuration`),
 * and this decides how long that element sounds, so a 30ms stab and a 280ms
 * press produce the identical, complete dit the learner is supposed to be
 * building an ear for. It reads the same `characterWpm` the sample player and
 * `buildMorseSchedule` use, so keyed and played Morse remain one sound.
 */
export function morseElementDurationMs(element: '.' | '-'): number {
  const ditMs = 1200 / LEARN_ACQUISITION_MORSE_TIMING.characterWpm
  return element === '.' ? ditMs : ditMs * 3
}

/**
 * The keyed-answer lifecycle.
 *
 * `ready` is the only phase that accepts a response. Everything else exists to
 * make the boundary between two retrievals uncrossable by a finger that is
 * still moving: `committing` covers the final element finishing its tone,
 * `feedback` the visible result, `transitioning` the swap itself.
 */
export type MorseResponsePhase = 'ready' | 'committing' | 'feedback' | 'transitioning'

/** The gate. Touch safety comes from this, never from a timer alone. */
export function morseResponseArmed(phase: MorseResponsePhase): boolean {
  return phase === 'ready'
}
