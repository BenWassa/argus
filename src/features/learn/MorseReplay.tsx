import { useEffect, useRef, useState } from 'react'
import { canonicalPattern } from '../../lib/acquisition'
import {
  advanceLesson,
  answerLesson,
  currentStep,
  type LessonRun,
} from '../../lib/morseLesson'
import { VisualCheckStep } from './MorseLesson'
import './MorseReplay.css'

export const MORSE_REPLAY_RETRIEVAL_LIMIT = 10
const REPLAY_FEEDBACK_MS = 850

interface MorseReplayProps {
  initialRun: LessonRun
  onExit: () => void
}

/**
 * Ephemeral refresher for one already-unlocked packet (#75).
 *
 * It deliberately owns only React state. No store/topic/scheduler import exists
 * here, so a replay miss can reteach locally but cannot regress canonical Learn,
 * disturb an active sitting, write Test evidence or move retention state.
 */
export function MorseReplay({ initialRun, onExit }: MorseReplayProps) {
  const [run, setRun] = useState(initialRun)
  const [retrievals, setRetrievals] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const stepRef = useRef<HTMLDivElement>(null)

  const finished = run.complete || retrievals >= MORSE_REPLAY_RETRIEVAL_LIMIT
  const step = run.feedback || finished ? null : currentStep(run)

  useEffect(() => {
    if (finished) headingRef.current?.focus({ preventScroll: true })
    else if (!run.feedback) stepRef.current?.focus({ preventScroll: true })
  }, [finished, run.feedback, run.step])

  useEffect(() => {
    if (!run.feedback) return
    const answered = run
    const timer = setTimeout(() => setRun(advanceLesson(answered)), REPLAY_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [run.feedback])

  function answer(itemId: string, response: string) {
    if (run.feedback || finished) return
    const answered = answerLesson(run, itemId, response)
    if (answered === run || !answered.feedback) return
    setRetrievals((count) => count + 1)
    setRun(answered)
  }

  if (finished && !run.feedback) {
    return (
      <section className="session morse-lesson morse-replay">
        <div className="session-bar">
          <p>
            <span className="session-topic">Lesson {run.packetIndex + 1} replay</span>
            <span className="tabular">{retrievals} retrievals</span>
          </p>
          <button className="ghost small" type="button" onClick={onExit}>Close</button>
        </div>
        <div className="morse-replay-summary">
          <h1 ref={headingRef} tabIndex={-1}>Replay complete</h1>
          <p>
            You refreshed this lesson without changing your saved lesson position or formal Test evidence.
          </p>
          <button type="button" onClick={onExit}>Back to lessons</button>
        </div>
      </section>
    )
  }

  return (
    <section className="session morse-lesson morse-replay">
      <div className="session-bar">
        <p>
          <span className="session-topic">Lesson {run.packetIndex + 1} replay</span>
          <span className="tabular">{retrievals} / {MORSE_REPLAY_RETRIEVAL_LIMIT} max</span>
        </p>
        <button className="ghost small" type="button" onClick={onExit}>Close</button>
      </div>

      <h1 className="sr-only">Replay Morse lesson {run.packetIndex + 1}</h1>

      {run.feedback && (
        <div className={`morse-replay-feedback${run.feedback.correct ? ' is-correct' : ''}`} role="status" aria-live="assertive">
          <strong>{run.feedback.correct ? 'Correct' : 'Not that one'}</strong>
          {!run.feedback.correct && (
            <span>
              {run.feedback.glyph} is <span className="mono">{canonicalPattern(run.feedback.pattern)}</span>. It will come back after another letter.
            </span>
          )}
        </div>
      )}

      {!run.feedback && step?.kind === 'check' && (
        <VisualCheckStep
          key={`replay-${step.entry.itemId}-${run.step}`}
          entry={step.entry}
          format={step.format}
          regionRef={stepRef}
          onAnswer={(response) => answer(step.entry.itemId, response)}
        />
      )}
    </section>
  )
}
