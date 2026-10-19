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
import { VisualView } from '../visual/VisualView'
import { AudioStimulusView } from '../audio/AudioStimulusView'
import { SessionFrame } from '../../shared/ui/SessionFrame'
import { GradePair } from '../test/GradePair'
// The miss uses the Test's own feedback layer, so a miss reads the same in both.
import '../test/TestSession.css'
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
  /** Start the scored Test. Practice never becomes one on its own. */
  onCheck: () => void
}

function PracticeAudio({ audio, label }: { audio: NonNullable<Topic['items'][number]['audio']>; label: string }) {
  const [shown, setShown] = useState(false)
  return (
    <AudioStimulusView
      audio={audio}
      showTranscript={shown}
      onRevealTranscript={() => setShown(true)}
      label={label}
    />
  )
}

/**
 * A bounded formative run over what a check just missed (#92 batch 5).
 *
 * The evidence boundary here is structural, not documentary. This module
 * imports no store write path, no scheduler and no evidence recorder — the same
 * guarantee `MorseCheckpoint` gives, arrived at the same way. A practice answer
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

  // Settled of total: a miss re-queues its target, so this only ever advances.
  // Practice takes the action pair. The track tokens have no matching ink, so
  // there is no readable pair to hand the frame.
  const progress = { current: Math.min(state.settled.length, initial.length), total: initial.length }

  if (finished) {
    return (
      <SessionFrame kind="practice" title="Practice" progress={{ current: initial.length, total: initial.length }} onClose={onExit} className="practice-run">
        <div className="practice-summary">
          <h2 ref={headingRef} tabIndex={-1} className="session-prompt-heading">
            Practice done
          </h2>
          <div className="practice-summary-actions">
            <button type="button" onClick={onCheck}>
              Test
            </button>
            <button className="ghost" type="button" onClick={onExit}>
              Not now
            </button>
          </div>
        </div>
      </SessionFrame>
    )
  }

  return (
    <SessionFrame kind="practice" title="Practice" progress={progress} onClose={onExit} className="practice-run" aria-labelledby="practice-heading">
      <h2 id="practice-heading" className="session-prompt-heading sr-only">
        Practice {topic.title}
      </h2>

      {/* Only a miss stops the run. A correct answer moves straight on, because
          the learner has just produced the answer and showing it back to them
          would cost a tap and tell them nothing. */}
      {state.feedback && (
        <div className="test-feedback practice-feedback" role="status" aria-live="assertive">
          <p className="test-verdict">Not that one</p>
          <div className="test-correction">
            <p className="test-correction-row">
              <span className="test-correction-label">Answer</span>
              <span className="test-correction-value practice-feedback-answer">{state.feedback.answer}</span>
            </p>
          </div>
          <button className="test-next" type="button" onClick={next}>
            Continue
          </button>
        </div>
      )}

      {!state.feedback && step && (
        <div className="practice-stage">
          <div className="practice-question" ref={questionRef} tabIndex={-1}>
            <span className="practice-label">
              {step.target.reason === 'missed' ? 'Missed last Test' : 'Not yet tested'}
            </span>
            {/* The picture belongs to the prompt side only. Asked the other way
                round, the prompt is the answer and the picture would give it away. */}
            {step.target.direction === 'prompt-to-answer' && step.target.item.stimulus && (
              <VisualView visual={step.target.item.stimulus} showCaption={false} />
            )}
            {/* Practice is formative and records nothing, so the transcript is
                free to reveal here; nothing about it touches evidence. */}
            {step.target.direction === 'prompt-to-answer' && step.target.item.audio && (
              <PracticeAudio
                key={`${step.target.item.id}-${state.answered}`}
                audio={step.target.item.audio}
                label={step.target.item.prompt}
              />
            )}
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
              <GradePair className="practice-grade" onMiss={() => grade(false)} onHit={() => grade(true)} />
            </>
          ) : (
            <button type="button" className="practice-reveal" onClick={() => setRevealed(true)}>
              Reveal answer
            </button>
          )}
        </div>
      )}
    </SessionFrame>
  )
}
