import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MORSE_FEEDBACK_CORRECT_MS,
  MORSE_TRANSITION_MS,
  morseResponseArmed,
  type MorseResponsePhase,
} from '../../../domain/morse/response'

/**
 * The keyed-answer lifecycle shared by Learn and the #78 word checkpoints (#87).
 *
 * The problem this exists to solve is not that advancing was too fast, it is
 * that nothing owned the boundary at all: render speed decided whether the next
 * control was live, so a second tap arriving a few frames after the first could
 * answer a question the learner had not seen yet.
 *
 * `committing` is deliberately absent from what this hook drives. The final
 * element's tone is finished inside `MorseKeyInput`, which does not call
 * `onSubmit` until the audible element has completed, so by the time a surface
 * observes an answer the commit phase is already over. What remains for the
 * surface to own is the part that spans a content swap: the visible result and
 * the transition into the next target.
 *
 * `armed` is the gate. It is state, not a timer, and it stays closed for the
 * whole of `feedback` and `transitioning` including under
 * `prefers-reduced-motion`, where only the animation is dropped.
 *
 * ## A hit is timed; a miss is not
 *
 * A hit dwells for `MORSE_FEEDBACK_CORRECT_MS` and moves on by itself, because
 * there is nothing on it to read and a lesson of correct answers should not
 * need a tap between each one.
 *
 * A miss starts no timer. The correction stands until the surface calls
 * `acknowledge`, which is wired to a control the learner presses. Every
 * previous attempt here was a guess at how long reading a correction takes —
 * 1400ms, then 2000ms, then 2000ms plus a poll that extended it while the
 * sound was replaying — and each one still tore the correction down at some
 * moment the learner had not chosen. The learner is the only one who knows
 * when they are done reading, so they are the one who says so.
 */
export function useKeyedResponse(advance: () => void) {
  const [phase, setPhase] = useState<MorseResponsePhase>('ready')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The surface re-creates its advance callback every render; the lifecycle
  // must read whichever was current at the moment it fires.
  const advanceRef = useRef(advance)
  advanceRef.current = advance
  /**
   * True while a correction is waiting on the learner rather than on a clock.
   *
   * State rather than a ref because the surface renders the control that ends
   * the hold, and a ref would not bring it on screen. It is also the guard that
   * stops a stray press during a hit's own 550ms dwell from advancing twice —
   * once from the press and once from the timer it did not cancel.
   */
  const [holding, setHolding] = useState(false)

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  useEffect(() => clear, [clear])

  const settle = useCallback(() => {
    setHolding(false)
    advanceRef.current()
    setPhase('transitioning')
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setPhase('ready')
    }, MORSE_TRANSITION_MS)
  }, [])

  /**
   * Called once per graded response. The surface shows its own feedback; this
   * decides how long it stands and when the next target becomes answerable.
   */
  const answered = useCallback((correct: boolean) => {
    clear()
    setPhase('feedback')
    if (!correct) {
      // Open-ended. `acknowledge` is the only thing that ends it.
      setHolding(true)
      return
    }
    setHolding(false)
    timerRef.current = setTimeout(settle, MORSE_FEEDBACK_CORRECT_MS)
  }, [clear, settle])

  /** The learner has finished reading a correction and asked to carry on. */
  const acknowledge = useCallback(() => {
    if (!holding) return
    clear()
    settle()
  }, [clear, holding, settle])

  /** Leaving the keyed flow entirely (exit, new sitting, unmount of a run). */
  const reset = useCallback(() => {
    clear()
    setHolding(false)
    setPhase('ready')
  }, [clear])

  return { phase, armed: morseResponseArmed(phase), holding, answered, acknowledge, reset }
}
