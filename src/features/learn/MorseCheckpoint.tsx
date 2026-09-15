import { useEffect, useRef, useState } from 'react'
import { canonicalPattern } from '../../lib/acquisition'
import { MORSE_LETTERS } from '../../lib/morse'
import {
  checkpointTargetKey,
  checkpointTargets,
  withCheckpointRetry,
  type MorseCheckpointTarget,
  type MorseWordCheckpoint,
} from '../../lib/morseWordCheckpoints'
import { MorseKeyInput } from '../morse/MorseKeyInput'
import { useKeyedResponse } from '../morse/useKeyedResponse'
import './MorseCheckpoint.css'

interface MorseCheckpointProps {
  checkpoint: MorseWordCheckpoint
  onExit: () => void
  /** Set only when #88's automatic handoff is waiting to resume the lesson it interrupted. */
  onContinue?: () => void
  continueLabel?: string
}

interface CheckpointFeedback {
  correct: boolean
  target: MorseCheckpointTarget
}

/**
 * Local-only application run for #78/#90. This component deliberately imports no
 * library store, scheduler, lesson-progress or Test-evidence write path.
 *
 * Since #87 the response boundary is owned by `useKeyedResponse` rather than by
 * a private timer, so a checkpoint letter is graded, acknowledged and replaced
 * on exactly the same schedule as a Learn retrieval, and the next letter cannot
 * be keyed by a tap that was still in flight when the previous one landed.
 *
 * #90 adds one bounded local repair rule: a target missed for the first time is
 * inserted once more after up to two intervening targets. The retry queue and
 * completion summary exist only for this mounted run; neither can mutate Learn,
 * Test, scheduler or retention state.
 */
export function MorseCheckpoint({ checkpoint, onExit, onContinue, continueLabel }: MorseCheckpointProps) {
  const [targets, setTargets] = useState<MorseCheckpointTarget[]>(() => checkpointTargets(checkpoint))
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<CheckpointFeedback | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [retries, setRetries] = useState(0)
  const retriedTargets = useRef<Set<string>>(new Set())
  const headingRef = useRef<HTMLHeadingElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)

  const { phase, armed, answered } = useKeyedResponse(() => {
    setFeedback(null)
    setIndex((current) => current + 1)
  })

  const complete = index >= targets.length
  const target = complete ? null : targets[index]

  useEffect(() => {
    if (complete) headingRef.current?.focus({ preventScroll: true })
    // Focus follows readiness, never the render: moving it onto a target that
    // is still mid-transition would hand a keyboard learner a control the
    // pointer learner cannot use yet.
    else if (armed) targetRef.current?.focus({ preventScroll: true })
  }, [complete, armed, index])

  function answer(pattern: string) {
    if (!target || !armed) return
    const correct = pattern === MORSE_LETTERS[target.letter]
    setAttempts((count) => count + 1)
    if (correct) {
      setCorrectAnswers((count) => count + 1)
    } else {
      const key = checkpointTargetKey(target)
      if (!retriedTargets.current.has(key)) {
        retriedTargets.current.add(key)
        setTargets((current) => withCheckpointRetry(current, index, target))
        setRetries((count) => count + 1)
      }
    }
    setFeedback({ correct, target })
    answered(correct)
  }

  const label = `Checkpoint after lesson ${checkpoint.afterLesson}`

  if (complete) {
    return (
      <section className="session morse-lesson morse-checkpoint">
        <div className="session-bar">
          <p>
            <span className="session-topic">{label}</span>
            <span>Complete</span>
          </p>
          <button className="ghost small" type="button" onClick={onExit}>Close</button>
        </div>
        <div className="morse-checkpoint-summary">
          <h1 ref={headingRef} tabIndex={-1}>Word checkpoint complete</h1>
          <p>
            <strong>{correctAnswers} of {attempts} correct</strong>
            {retries > 0
              ? ` · ${retries} ${retries === 1 ? 'target' : 'targets'} revisited once`
              : ' · no misses to revisit'}
          </p>
          <p>You applied letters you already know. This run did not change saved lesson or Test progress.</p>
          {onContinue ? (
            <div className="lesson-exits" inert={!armed}>
              <button type="button" onClick={onContinue}>{continueLabel ?? 'Keep going'}</button>
              <button className="ghost" type="button" onClick={onExit}>Back to lessons</button>
            </div>
          ) : (
            <button type="button" disabled={!armed} onClick={onExit}>Back to lessons</button>
          )}
        </div>
      </section>
    )
  }

  if (!target) return null

  const wordNumber = target.wordIndex === null ? null : target.wordIndex + 1
  const warmupNumber = target.kind === 'warmup' ? checkpoint.warmups.indexOf(target.letter) + 1 : null
  const stepLabel = target.kind === 'warmup'
    ? `Warm-up ${warmupNumber} of ${checkpoint.warmups.length}`
    : `Word ${wordNumber} of ${checkpoint.words.length}`

  return (
    <section className="session morse-lesson morse-checkpoint">
      <div className="session-bar">
        <p>
          <span className="session-topic">{label}</span>
          <span>{stepLabel}</span>
        </p>
        <button className="ghost small" type="button" onClick={onExit}>Close</button>
      </div>

      <div
        className="morse-checkpoint-target"
        key={index}
        data-phase={phase}
        ref={targetRef}
        tabIndex={-1}
        aria-label={target.kind === 'warmup'
          ? `Key the Morse pattern for ${target.letter}`
          : `Key ${target.letter} in the word ${target.word}`}
      >
        <p className="lesson-task">
          {target.kind === 'warmup' ? 'Warm up' : 'Key the highlighted letter'}
        </p>

        {target.kind === 'warmup' ? (
          <>
            <p className="morse-checkpoint-letter" aria-hidden="true">{target.letter}</p>
            <h1 className="sr-only">Key the Morse pattern for {target.letter}.</h1>
          </>
        ) : (
          <>
            <p className="morse-checkpoint-word" aria-hidden="true">
              {Array.from(target.word ?? '').map((letter, characterIndex) => (
                <span
                  className={characterIndex === target.characterIndex ? 'is-current' : undefined}
                  key={`${target.word}-${characterIndex}`}
                >
                  {letter}
                </span>
              ))}
            </p>
            <h1 className="sr-only">
              Key {target.letter}, character {(target.characterIndex ?? 0) + 1} of {target.word}.
            </h1>
          </>
        )}

        {feedback ? (
          <div
            className={`morse-checkpoint-feedback${feedback.correct ? ' is-correct' : ' is-wrong'}`}
            role="status"
            aria-live="assertive"
          >
            <strong>{feedback.correct ? 'Correct' : 'Miss'}</strong>
            {!feedback.correct && (
              <span>
                {feedback.target.letter} is <span className="mono">{canonicalPattern(MORSE_LETTERS[feedback.target.letter])}</span>
              </span>
            )}
          </div>
        ) : (
          // `inert` is the real gate: `pointer-events: none` alone would let the
          // same tap fall through to whatever sits underneath the key.
          <div className="morse-checkpoint-answer" inert={!armed}>
            <MorseKeyInput
              key={`${checkpoint.id}-${index}`}
              expectedLength={MORSE_LETTERS[target.letter].length}
              locked={!armed}
              onSubmit={answer}
            />
          </div>
        )}
      </div>
    </section>
  )
}
