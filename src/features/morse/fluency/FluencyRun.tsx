import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MorseAudioPlayer } from '../../../domain/morse/audio'
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
  type MorseFluencyProgress,
} from '../../../domain/morse/fluency/progress'
import { fluencyTiming, type FluencyRung } from '../../../domain/morse/fluency/timing'
import { decodePattern, type MorseLetter } from '../../../domain/morse/code'
import { MorseWordKeyInput } from '../input/MorseWordKeyInput'
import { MorseCharacterSupport } from '../MorseCharacterSupport'
import { MorseListenPlay } from '../MorseListenPlay'
import { useMorseAudio } from '../useMorseAudio'
import { useKeyedResponse } from '../input/useKeyedResponse'
import { fire } from '../../../shared/haptics'
import { SessionFrame, SessionCorrect, RoundResult } from '../../../shared/ui/SessionFrame'
import './Fluency.css'

interface FluencyRunProps {
  /** Between-round controls on the result screen (Listen's spacing). */
  toolbar?: ReactNode
  mode: FluencyMode
  rung: FluencyRung
  progress: MorseFluencyProgress
  /** Letters the learner is missing, weighted up (`morseFocusLetters`). */
  focus?: ReadonlySet<MorseLetter>
  /** When non-empty, the only letters this run asks. */
  only?: readonly MorseLetter[]
  /** Characters material may contain (#257): the taught roster before acquisition; absent, no limit. */
  allowed?: ReadonlySet<string>
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
export function FluencyRun({ mode, rung, progress, focus, only, allowed, onProgress, onExit, toolbar }: FluencyRunProps) {
  const [run, setRun] = useState<FluencyRunState>(() =>
    startFluencyRun(mode, rung, progress, Object.values(progress.characters).reduce((count, character) => count + (character?.heard ?? 0), 0), focus, only, allowed),
  )
  // The answered prompt's own patterns travel with the verdict: by the time it
  // renders the run has advanced, and `prompt` is already the next question.
  const [feedback, setFeedback] = useState<
    { correct: boolean; text: string; marks: boolean[]; patterns: string[]; response: string[] } | null
  >(null)
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [characterIndex, setCharacterIndex] = useState(0)

  const playerRef = useRef<MorseAudioPlayer | null>(null)
  const stimulusEndedAt = useRef<number | null>(null)
  const replayed = useRef(false)
  const interrupted = useRef(false)
  /** Accumulates across the run and is written once, at the end. */
  const pendingProgress = useRef(progress)

  const prompt = currentPrompt(run) ?? (feedback ? { text: feedback.text, patterns: feedback.patterns } : null)
  const correctionAudio = useMorseAudio()
  const complete = fluencyComplete(run) && feedback === null
  const timing = fluencyTiming(run.rung)

  // `answerFluency` has already advanced the run by the time feedback shows,
  // so the only thing left for the lifecycle to do is clear the result and
  // re-arm. The gate itself is `armed`, exactly as in Learn and the checkpoints.
  const round = useRef(0)
  const { phase, armed, holding, answered, acknowledge, reset: resetResponse } = useKeyedResponse(() => {
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
      response: justAnswered.response,
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
      fire('crest')
    }
    pendingProgress.current = store
    onProgress(store)
  }, [complete, onProgress, outcome, run])

  function continueCorrection() {
    correctionAudio.stop()
    acknowledge()
  }

  const frame = { kind: 'listen' as const, title: 'Listen', onClose: onExit, progress: { current: complete ? fluencyRunLength(mode) : run.at + 1, total: fluencyRunLength(mode) } }

  function again() {
    correctionAudio.stop()
    playerRef.current?.cancel()
    setPlaying(false)
    setAudioError(null)
    stimulusEndedAt.current = null
    replayed.current = false
    interrupted.current = false
    round.current += 1
    setRun(startFluencyRun(mode, rung, pendingProgress.current, round.current, focus, only, allowed))
    setFeedback(null)
    setCharacterIndex(0)
    committed.current = false
    resetResponse()
  }

  if (complete) {
    return <SessionFrame {...frame} className="morse-lesson fluency-run">
      <RoundResult extra={toolbar} correct={outcome.correct} total={outcome.prompts} onAgain={again} onDone={onExit} />
    </SessionFrame>
  }

  if (!prompt) return null

  return (
    <SessionFrame {...frame} className="morse-lesson fluency-run" data-step="check">

      <div className="fluency-target" data-phase={phase}>
        <h2 className="session-prompt-heading sr-only">
          Listen and key back {prompt.text.length === 1 ? 'the character' : prompt.text.length + ' characters'}.
        </h2>

        {/* One or two words: what is being played (#263). */}
        <p className="lesson-task">{prompt.text.length === 1 ? 'Letters' : mode === 'groups' ? 'Groups' : 'Words'}</p>

        {/* The prompt is never shown before the answer. Fluency is a sound-first
            surface; printing the target would make it a reading exercise. */}
        <div className="fluency-listen">
          <MorseListenPlay
            label={stimulusEndedAt.current === null && !playing ? 'Play' : 'Play again'}
            icon={stimulusEndedAt.current === null && !playing ? 'play' : 'replay'}
            onClick={() => void play(stimulusEndedAt.current !== null || playing)}
            disabled={!armed || playing}
          />
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

        {feedback?.correct ? (
          <div className="fluency-feedback is-correct" role="status" aria-live="assertive">
            <SessionCorrect target={feedback.text} announce={false} />
          </div>
        ) : feedback ? (() => {
          // The pattern for the first character that broke. Showing every
          // pattern in a six-letter word buries the one thing the learner
          // needs to look at. The word is still the headline of the answer,
          // with the broken character marked inside it.
          const brokeAt = feedback.marks.findIndex((mark) => !mark)
          const at = brokeAt === -1 ? 0 : brokeAt
          const keyed = feedback.response.map((pattern) => decodePattern(pattern) ?? '?').join('')
          return <SessionCorrect className="fluency-miss" miss={{
            said: keyed,
            saidLabel: 'You keyed',
            answer: <>
              <span className="fluency-answer">
                {Array.from(feedback.text).map((character, index) => (
                  <span key={index} className={feedback.marks[index] === false ? 'is-wrong-char' : undefined}>{character}</span>
                ))}
              </span>
              <MorseCharacterSupport glyph={feedback.text[at]} pattern={feedback.patterns[at] ?? ''} playing={correctionAudio.sounding?.glyph === feedback.text[at]} onToggle={() => correctionAudio.toggle(feedback.text[at])} audioError={correctionAudio.audioError} />
            </>,
            onContinue: continueCorrection,
            continueDisabled: !holding,
          }} />
        })() : (
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
    </SessionFrame>
  )
}
