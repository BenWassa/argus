import { useEffect, useRef, useState } from 'react'
import { practiceTargets, targetsForItems } from '../../domain/study/practiceTargets'
import {
  advancePractice,
  answerPractice,
  currentTarget,
  practiceComplete,
  practiceStep,
  startPracticeRun,
} from '../../domain/study/practiceSession'
import type { Topic } from '../../domain/library/topic'
import { testCardTextClass } from '../test/textScale'
import './PracticeRun.css'

interface PracticeRunProps {
  topic: Topic
  /**
   * Exactly what to practise, when the caller already knows.
   *
   * A check's end screen does. Left undefined — entering from the topic page —
   * the run derives its own queue from durable evidence instead.
   */
  itemIds?: string[]
  onExit: () => void
  /** Start the scored check. Practice never becomes one on its own. */
  onCheck: () => void
}

/**
 * A bounded formative run over what a check just missed (#92 batch 5).
 *
 * The evidence boundary here is structural, not documentary. This module
 * imports no store write path, no scheduler and no evidence recorder — the same
 * guarantee `MorseReplay` gives, arrived at the same way. A practice answer
 * cannot reach `itemEvidence`, cannot move `lastTestedAt`, cannot resolve an
 * attempt and cannot qualify a completion, because there is no function in
 * scope that does any of those things.
 *
 * That is the decision recorded at §15.5 of the learning-experience design:
 * repair practises, the next check proves. So this run deliberately ends by
 * offering the check rather than by claiming anything itself, and the topic
 * keeps offering practice until a real check answers those items correctly.
 *
 * It is not Morse-specific. It reads the authored prompt/answer pair of any
 * finite topic and asks it in whichever direction the evidence says is weak,
 * which is why it sits outside `LessonRun` and its curriculum gate.
 */
export function PracticeRun({ topic, itemIds, onExit, onCheck }: PracticeRunProps) {
  // Built once from the topic as it stood when the run opened. The queue must
  // not be recomputed underneath the learner; nothing this run does changes the
  // evidence it was derived from anyway, but a topic edited in another tab
  // should not reshuffle a run in progress.
  const [initial] = useState(() =>
    itemIds ? targetsForItems(topic, itemIds) : practiceTargets(topic),
  )
  const [state, setState] = useState(() => startPracticeRun(initial))

  const headingRef = useRef<HTMLHeadingElement>(null)
  const questionRef = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  const target = currentTarget(state)
  const step = target ? practiceStep(target) : null
  const finished = practiceComplete(state)

  useEffect(() => {
    if (finished) headingRef.current?.focus({ preventScroll: true })
    else if (!state.feedback) questionRef.current?.focus({ preventScroll: true })
  }, [finished, state.feedback, target?.item.id, target?.direction])

  // A run with nothing to ask has no reason to be on screen. This is the
  // reload/Forward case: practice is not resumable, so the route falls back to
  // its origin, and this only fires if a route somehow survives with an empty
  // topic.
  useEffect(() => {
    if (initial.length === 0) onExit()
  }, [initial.length, onExit])

  function grade(correct: boolean) {
    if (state.feedback || finished) return
    setRevealed(false)
    setState(answerPractice(state, correct))
  }

  function next() {
    setRevealed(false)
    setState(advancePractice(state))
  }

  if (initial.length === 0) return null

  if (finished) {
    const missedAgain = state.answered - state.settled.length
    return (
      <section className="session practice-run">
        <div className="session-bar">
          <p>
            <span className="session-topic">{topic.title}</span>
            <span className="tabular">Practice</span>
          </p>
          <button className="ghost small" type="button" onClick={onExit}>
            Close
          </button>
        </div>
        <div className="practice-summary">
          <h1 ref={headingRef} tabIndex={-1}>
            Practice done
          </h1>
          <p>
            You went through {state.settled.length}{' '}
            {state.settled.length === 1 ? 'retrieval' : 'retrievals'}
            {missedAgain > 0 ? `, ${missedAgain} of them more than once` : ''}. Nothing was
            recorded and nothing moved: practice is for getting it back, and the check is what
            proves it.
          </p>
          <button type="button" onClick={onCheck}>
            Take the check
          </button>
          <button className="ghost" type="button" onClick={onExit}>
            Not now
          </button>
        </div>
      </section>
    )
  }

  const remaining = state.queue.length

  return (
    <section className="session practice-run" aria-labelledby="practice-heading">
      <div className="session-bar">
        <p>
          <span className="session-topic">{topic.title}</span>
          <span className="tabular">Practice · {remaining} to go</span>
        </p>
        <button className="ghost small" type="button" onClick={onExit}>
          Close
        </button>
      </div>

      <h1 id="practice-heading" className="sr-only">
        Practice {topic.title}
      </h1>

      {/* Only a miss stops the run. A correct answer moves straight on, because
          the learner has just produced the answer and showing it back to them
          would cost a tap and tell them nothing. */}
      {state.feedback && (
        <div className="practice-feedback" role="status" aria-live="assertive">
          <strong>Not that one</strong>
          <span>
            The answer is <span className="mono">{state.feedback.answer}</span>. It comes back
            before the end.
          </span>
          <button type="button" onClick={next}>
            Continue
          </button>
        </div>
      )}

      {!state.feedback && step && (
        <div className="practice-stage">
          <div className="practice-question" ref={questionRef} tabIndex={-1}>
            <span className="practice-label">
              {step.target.reason === 'missed' ? 'Missed last check' : 'Not yet tested'}
            </span>
            <span className={`practice-value${testCardTextClass(step.question)}`}>
              {step.question}
            </span>
          </div>

          {revealed ? (
            <>
              <div className="practice-answer">
                <span className="practice-label">Answer</span>
                <span className={`practice-value${testCardTextClass(step.answer)}`}>
                  {step.answer}
                </span>
              </div>
              <div className="practice-grade">
                <button type="button" onClick={() => grade(false)} className="ghost">
                  Not yet
                </button>
                <button type="button" onClick={() => grade(true)}>
                  Got it
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="practice-reveal" onClick={() => setRevealed(true)}>
              Reveal answer
            </button>
          )}
        </div>
      )}
    </section>
  )
}
