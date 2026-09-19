import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MORSE_TRANSITION_MS,
  morseFeedbackMs,
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
 * `isHeld` covers the one thing the policy duration alone cannot: a learner
 * who spends the feedback window replaying the correct sound rather than
 * reading. Without it the fixed timer tore the correction down mid-playback
 * (or a beat after it), which is indistinguishable from the surface simply
 * moving on too fast. The floor still applies — a glance-and-tap cannot skip
 * the dwell — but a genuine replay now finishes before the surface can move.
 */
const HOLD_POLL_MS = 150

export function useKeyedResponse(advance: () => void, isHeld: () => boolean = () => false) {
  const [phase, setPhase] = useState<MorseResponsePhase>('ready')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The surface re-creates its advance/held callbacks every render; the
  // lifecycle must read whichever was current at the moment it fires.
  const advanceRef = useRef(advance)
  advanceRef.current = advance
  const isHeldRef = useRef(isHeld)
  isHeldRef.current = isHeld

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  useEffect(() => clear, [clear])

  /**
   * Called once per graded response. The surface shows its own feedback; this
   * decides how long it stands and when the next target becomes answerable.
   */
  const answered = useCallback((correct: boolean) => {
    clear()
    setPhase('feedback')
    const settle = () => {
      // Only a miss has anything to replay; checking isHeld on a hit would
      // just add fragility to the one path that is supposed to be quick and
      // hands-free, for a case (`sounding` lagging after the keyed press's
      // own tone) that has nothing to do with the learner reading anything.
      if (!correct && isHeldRef.current()) {
        timerRef.current = setTimeout(settle, HOLD_POLL_MS)
        return
      }
      advanceRef.current()
      setPhase('transitioning')
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        setPhase('ready')
      }, MORSE_TRANSITION_MS)
    }
    timerRef.current = setTimeout(settle, morseFeedbackMs(correct))
  }, [clear])

  /** Leaving the keyed flow entirely (exit, new sitting, unmount of a run). */
  const reset = useCallback(() => {
    clear()
    setPhase('ready')
  }, [clear])

  return { phase, armed: morseResponseArmed(phase), answered, reset }
}
