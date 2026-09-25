import { useCallback, useEffect, useRef, useState } from 'react'
import { MorseAudioPlayer } from '../../../domain/morse/audio'
import { canonicalPattern } from '../../../domain/morse/testing/acquisitionProfile'
import {
  answerFluency,
  currentPrompt,
  fluencyBest,
  fluencyBestKey,
  fluencyComplete,
  fluencyOutcome,
  fluencyRunLength,
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
import { MorseWordKeyInput } from '../input/MorseWordKeyInput'
import { useKeyedResponse } from '../input/useKeyedResponse'
import { fire } from '../../../shared/haptics'
import './Fluency.css'

interface FluencyRunProps {
  mode: FluencyMode
  rung: FluencyRung
  progress: MorseFluencyProgress
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

const MODE_TITLES: Record<FluencyMode, string> = {
  sprint: 'Sprint',
  ladder: 'Ladder',
  words: 'Words',
  groups: 'Groups',
}

/**
 * One post-acquisition run.
 *
 * The loop is the same for every mode: play it, key it back, judge it, move
 * on. What differs is the material and what the end screen offers, which is
 * why there is one component rather than four.
 *
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
export function FluencyRun({ mode, rung, progress, onProgress, onExit }: FluencyRunProps) {
  const [run, setRun] = useState<FluencyRunState>(() =>
    startFluencyRun(mode, rung, progress, Date.now()),
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

  const bar = (position: string | null) => (
    <div className="session-bar">
      <p>
        <span className="session-topic">{MODE_TITLES[mode]}</span>
      </p>
      {position && <span className="session-count tabular">{position}</span>}
      <button className="ghost small" type="button" onClick={onExit}>
        Close
      </button>
    </div>
  )

  if (complete) {
    return (
      <section className="session morse-lesson fluency-run">
        {bar(null)}
        <div className="fluency-summary">
          <h1 ref={headingRef} tabIndex={-1}>
            {MODE_TITLES[mode]} done
          </h1>

          <p className="fluency-score">
            <strong className="tabular">
              {outcome.correct} of {outcome.prompts}
            </strong>{' '}
            correct
          </p>

          {outcome.medianLatencyMs !== null && (
            <p className="fluency-metric tabular">
              {(outcome.medianLatencyMs / 1000).toFixed(2)}s typical response
            </p>
          )}

          {outcome.longestStreak > 1 && (
            <p className="fluency-metric tabular">{outcome.longestStreak} in a row</p>
          )}

          {crested && (
            <p className="fluency-crest" role="status">
              Personal best.
            </p>
          )}

          {/* An offer, never a gate. The learner owns the rung; this only says
              what the run suggests. */}
          {mode === 'ladder' && outcome.cleanForAdvance && (
            <button type="button" onClick={() => advanceRung(1)}>
              Try {nextRung(run.rung)} WPM spacing
            </button>
          )}
          {mode === 'ladder' && !outcome.cleanForAdvance && run.rung > 6 && (
            <button className="ghost" type="button" onClick={() => advanceRung(-1)}>
              Ease back to {previousRung(run.rung)} WPM spacing
            </button>
          )}

          <p className="lesson-foot">
            Nothing here changed your saved progress, your check evidence or your completion.
          </p>

          <button className="ghost" type="button" onClick={onExit}>
            Back to fluency
          </button>
        </div>
      </section>
    )
  }

  if (!prompt) return null

  return (
    <section className="session morse-lesson fluency-run" data-step="check">
      {bar(`${run.at + 1}/${fluencyRunLength(mode)}`)}

      <div className="fluency-target" data-phase={phase}>
        <h1 className="sr-only">
          Listen and key back {prompt.text.length === 1 ? 'the character' : prompt.text.length + ' characters'}.
        </h1>

        <p className="lesson-task">{prompt.text.length === 1 ? 'Hear it' : 'Hear the whole thing'}</p>

        {/* The prompt is never shown before the answer. Fluency is a sound-first
            surface; printing the target would make it a reading exercise. */}
        <div className="fluency-listen">
          <button
            type="button"
            className="fluency-play"
            onClick={() => void play(stimulusEndedAt.current !== null || playing)}
            disabled={!armed || playing}
          >
            {stimulusEndedAt.current === null && !playing ? 'Play' : 'Play again'}
          </button>
          {prompt.text.length > 1 && (
            <p className="fluency-shape tabular" aria-hidden="true">
              {Array.from(prompt.text).map((_, index) => (
                <span key={index} className={index === characterIndex ? 'is-current' : undefined}>
                  ·
                </span>
              ))}
            </p>
          )}
        </div>

        {audioError && (
          <p className="fluency-audio-error" role="status">
            {audioError}
          </p>
        )}

        {feedback ? (
          <div
            className={`fluency-feedback${feedback.correct ? ' is-correct' : ' is-wrong'}`}
            role="status"
            aria-live="assertive"
          >
            <strong>{feedback.correct ? 'Correct' : 'Miss'}</strong>
            {/* The word is the headline of a word miss, and the broken
                character is marked inside it rather than replacing it. */}
            <span className="fluency-answer">
              {Array.from(feedback.text).map((character, index) => (
                <span
                  key={index}
                  className={feedback.marks[index] === false ? 'is-wrong-char' : undefined}
                >
                  {character}
                </span>
              ))}
            </span>
            {!feedback.correct && (
              <>
                {/* The pattern for the first character that broke. Showing
                    every pattern in a six-letter word buries the one thing
                    the learner needs to look at. */}
                <span className="mono fluency-pattern">
                  {(() => {
                    const brokeAt = feedback.marks.findIndex((mark) => !mark)
                    const at = brokeAt === -1 ? 0 : brokeAt
                    return `${feedback.text[at]} is ${canonicalPattern(feedback.patterns[at] ?? '')}`
                  })()}
                </span>
                <button type="button" className="lesson-next" onClick={acknowledge} disabled={!holding}>
                  Continue
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="fluency-answer-area" inert={!armed}>
            <MorseWordKeyInput
              word={prompt.text}
              locked={!armed || playing}
              // One mounted key for the whole run: the token changes per
              // prompt, and nothing is remounted, so the AudioContext that was
              // unlocked by the learner's first tap survives to the end.
              advanceToken={run.at}
              onProgress={setCharacterIndex}
              onSubmit={submit}
            />
          </div>
        )}
      </div>
    </section>
  )
}
