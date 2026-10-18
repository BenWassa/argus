// Owns sound-first run state, latency hygiene, keyed feedback and the final statistics write.
import { useCallback, useEffect, useRef, useState } from 'react'
import { MorseAudioPlayer } from '../../../domain/morse/audio'
import {
  answerFluency,
  currentPrompt,
  fluencyBest,
  fluencyBestKey,
  fluencyComplete,
  fluencyOutcome,
  startFluencyRun,
  type FluencyMode,
  type FluencyRun as FluencyRunState,
} from '../../../domain/morse/fluency/session'
import {
  recordFluencyAnswer,
  recordFluencyBest,
  setFluencyRung,
  type MorseFluencyProgress,
} from '../../../domain/morse/fluency/progress'
import { fluencyTiming, nextRung, previousRung, type FluencyRung } from '../../../domain/morse/fluency/timing'
import type { MorseLetter } from '../../../domain/morse/code'
import { useMorseAudio } from '../useMorseAudio'
import { useKeyedResponse } from '../input/useKeyedResponse'
import { fire } from '../../../shared/haptics'

export interface FluencyRunProps {
  mode: FluencyMode
  rung: FluencyRung
  progress: MorseFluencyProgress
  /** Letters the learner is missing, weighted up (`morseFocusLetters`). */
  focus?: ReadonlySet<MorseLetter>
  /** When non-empty, the only letters this run asks. */
  only?: readonly MorseLetter[]
  /**
   * The single durable write path, handed in rather than reached for.
   *
   * This component imports no library store, no scheduler and no evidence
   * recorder — the same structural guarantee `PracticeRun` and
   * `MorseCheckpoint` give. The difference is that Fluency does keep
   * statistics, so instead of "writes nothing" the boundary is "writes exactly
   * one field, through exactly one function it was given". A Fluency answer
   * cannot reach `itemEvidence`, move `lastTestedAt`, resolve an attempt or
   * qualify a completion, because no function in scope does any of those.
   */
  onProgress: (next: MorseFluencyProgress) => void
  onExit: () => void
}

/**
 * ## Latency hygiene
 *
 * The measurement this surface exists for is only meaningful if the number is
 * clean, so four rules are enforced here rather than trusted to the caller:
 *
 *  - the clock starts when the *stimulus ends*, not when playback begins.
 *    Otherwise every character's latency contains its own audible length and a
 *    four-element letter looks slow because it *is* long;
 *  - a replayed prompt records no latency, because hearing it twice is a
 *    different task;
 *  - a prompt interrupted by backgrounding records no latency;
 *  - a miss records no latency at all. A wrong answer's response time mixes a
 *    fast guess with a long failed search and means neither.
 */
export function useFluencyRun({ mode, rung, progress, focus, only, onProgress, onExit }: FluencyRunProps) {
  const [run, setRun] = useState<FluencyRunState>(() =>
    startFluencyRun(mode, rung, progress, Date.now(), focus, only),
  )
  // The answered prompt's own patterns travel with the verdict: by the time it
  // renders the run has advanced, and `prompt` is already the next question.
  const [feedback, setFeedback] = useState<
    { correct: boolean; text: string; marks: boolean[]; patterns: string[] } | null
  >(null)
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [characterIndex, setCharacterIndex] = useState(0)
  const [crested, setCrested] = useState(false)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const playerRef = useRef<MorseAudioPlayer | null>(null)
  const stimulusEndedAt = useRef<number | null>(null)
  const replayed = useRef(false)
  const interrupted = useRef(false)
  /** Accumulates across the run and is written once, at the end. */
  const pendingProgress = useRef(progress)

  const prompt = currentPrompt(run)
  const correctionAudio = useMorseAudio()
  const complete = fluencyComplete(run)
  const timing = fluencyTiming(run.rung)

  // `answerFluency` has already advanced the run by the time feedback shows,
  // so the only thing left for the lifecycle to do is clear the result and
  // re-arm. The gate itself is `armed`, exactly as in Learn and the checkpoints.
  const { phase, armed, holding, answered, acknowledge } = useKeyedResponse(() => {
    setFeedback(null)
    setCharacterIndex(0)
  })

  useEffect(() => {
    playerRef.current = new MorseAudioPlayer()
    return () => {
      void playerRef.current?.dispose()
      playerRef.current = null
    }
  }, [])

  // Backgrounding invalidates the current prompt's latency. The answer itself
  // is still accepted; only the timing is dropped, because a learner who left
  // the app and came back was not answering for those seconds.
  useEffect(() => {
    if (typeof document === 'undefined') return
    function onHidden() {
      if (document.hidden) interrupted.current = true
    }
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', onHidden)
    return () => {
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', onHidden)
    }
  }, [])

  useEffect(() => {
    if (complete) headingRef.current?.focus({ preventScroll: true })
  }, [complete])

  const play = useCallback(
    async (isReplay: boolean) => {
      const player = playerRef.current
      const target = currentPrompt(run)
      if (!player || !target) return
      setAudioError(null)
      setPlaying(true)
      stimulusEndedAt.current = null
      if (isReplay) replayed.current = true
      try {
        const schedule = await player.play(target.text, timing)
        // The clock starts when the sound stops. `durationMs` is the schedule's
        // own length, so this is the stimulus end rather than a guess at it.
        window.setTimeout(() => {
          stimulusEndedAt.current = performance.now()
          setPlaying(false)
        }, schedule.durationMs)
      } catch (error) {
        setPlaying(false)
        setAudioError(
          error instanceof Error ? error.message : 'Morse audio could not start.',
        )
      }
    },
    [run, timing],
  )

  function submit(patterns: readonly string[]) {
    const target = currentPrompt(run)
    if (!target || !armed) return

    const startedAt = stimulusEndedAt.current
    const usable = startedAt !== null && !replayed.current && !interrupted.current
    const latencyMs = usable ? Math.max(0, Math.round(performance.now() - startedAt)) : null

    const next = answerFluency(run, patterns, latencyMs, replayed.current || interrupted.current)
    const justAnswered = next.answers[next.answers.length - 1]

    // Statistics are per character, so a word contributes one record per
    // letter. Only the prompt's own correctness decides the haptic.
    let store = pendingProgress.current
    Array.from(target.text).forEach((glyph, index) => {
      store = recordFluencyAnswer(
        store,
        glyph as MorseLetter,
        justAnswered.marks[index] === true,
        // A multi-character prompt has one latency for the whole unit, so it
        // is not attributed to any single letter. Only a single-character
        // prompt produces a per-character latency.
        target.text.length === 1 ? justAnswered.latencyMs : null,
      )
    })
    pendingProgress.current = store

    fire(justAnswered.correct ? (target.text.length > 1 ? 'word' : 'settle') : 'miss')

    setFeedback({
      correct: justAnswered.correct,
      text: target.text,
      marks: justAnswered.marks,
      patterns: target.patterns,
    })
    setRun(next)
    replayed.current = false
    interrupted.current = false
    stimulusEndedAt.current = null
    answered(justAnswered.correct)
  }

  const outcome = fluencyOutcome(run)

  // The run's statistics are committed once, when it finishes. A run abandoned
  // halfway writes nothing, which is the same promise replay and the
  // checkpoints make and keeps an interrupted session from skewing a median.
  const committed = useRef(false)
  useEffect(() => {
    if (!complete || committed.current) return
    committed.current = true
    let store = pendingProgress.current
    const best = fluencyBest(run, outcome)
    let improved = false
    if (best !== null) {
      const result = recordFluencyBest(store, fluencyBestKey(run.mode), best)
      store = result.progress
      improved = result.improved
    }
    if (improved) {
      setCrested(true)
      fire('crest')
    }
    onProgress(store)
  }, [complete, onProgress, outcome, run])

  function advanceRung(direction: 1 | -1) {
    const target = direction === 1 ? nextRung(run.rung) : previousRung(run.rung)
    onProgress(setFluencyRung(pendingProgress.current, target))
    onExit()
  }

  function continueCorrection() {
    correctionAudio.stop()
    acknowledge()
  }

  return {
    run,
    feedback,
    playing,
    audioError,
    characterIndex,
    setCharacterIndex,
    crested,
    headingRef,
    stimulusEndedAt,
    prompt,
    correctionAudio,
    complete,
    phase,
    armed,
    holding,
    play,
    submit,
    outcome,
    advanceRung,
    continueCorrection,
  }
}
