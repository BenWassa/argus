import { useEffect, useRef, useState } from 'react'
import { Dialog } from '../../shared/ui/Dialog'
import { canonicalPattern } from '../../domain/morse/testing/acquisitionProfile'
import {
  answerMorsePlacement,
  currentMorsePlacementTarget,
  expectedMorsePlacementPattern,
  startMorsePlacement,
  type MorsePlacementExperience,
  type MorsePlacementResult,
  type MorsePlacementRun,
} from '../../domain/morse/placement'
import type { Topic } from '../../domain/library/topic'
import { MorseKeyInput } from './input/MorseKeyInput'
import { MorseWordKeyInput } from './input/MorseWordKeyInput'
import { useKeyedResponse } from './input/useKeyedResponse'
import './MorsePlacement.css'

interface MorsePlacementDialogProps {
  topic: Topic
  onClose: () => void
  onNew: () => void
  onCommit: (result: MorsePlacementResult) => void
  onContinue: (result: MorsePlacementResult) => void
}

interface Feedback {
  correct: boolean
  letter: string
}

export function MorsePlacementDialog({
  topic,
  onClose,
  onNew,
  onCommit,
  onContinue,
}: MorsePlacementDialogProps) {
  const [run, setRun] = useState<MorsePlacementRun | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const pendingRun = useRef<MorsePlacementRun | null>(null)
  const committed = useRef(false)
  const targetRef = useRef<HTMLDivElement>(null)

  const { phase, armed, answered, reset } = useKeyedResponse(() => {
    const next = pendingRun.current
    pendingRun.current = null
    setFeedback(null)
    if (next) setRun(next)
  })

  const target = run ? currentMorsePlacementTarget(run) : null
  const result = run?.result ?? null

  useEffect(() => {
    if (!run?.complete || !result || committed.current) return
    committed.current = true
    onCommit(result)
  }, [onCommit, result, run?.complete])

  useEffect(() => {
    if (target && armed) targetRef.current?.focus({ preventScroll: true })
  }, [armed, target, run?.index])

  function begin(experience: MorsePlacementExperience) {
    const next = startMorsePlacement(topic, experience)
    if (!next) return
    committed.current = false
    reset()
    setFeedback(null)
    setRun(next)
  }

  function answer(response: string | readonly string[]) {
    if (!run || !target || !armed || feedback) return
    const correct = Array.isArray(response)
      ? response.join(' ') === expectedMorsePlacementPattern(target)
      : response === expectedMorsePlacementPattern(target)
    pendingRun.current = answerMorsePlacement(run, response)
    setFeedback({ correct, letter: target.letter })
    answered(correct)
  }

  if (!run) {
    return (
      <Dialog title="Check your Morse level" onClose={onClose} closeLabel="Close placement check">
        <div className="morse-placement-intro">
          <p>How much Morse have you learned before?</p>
          <p className="help">Your answer only changes how the check is run. It does not grant progress.</p>
          <div className="morse-placement-choices">
            <button type="button" onClick={onNew}>
              <strong>New to Morse</strong>
              <span>Start with the first lesson.</span>
            </button>
            <button type="button" className="ghost" onClick={() => begin('some')}>
              <strong>Know some Morse</strong>
              <span>Check forward until we find the first gap.</span>
            </button>
            <button type="button" className="ghost" onClick={() => begin('most')}>
              <strong>Know most Morse</strong>
              <span>Run a broader, faster A–Z check.</span>
            </button>
          </div>
        </div>
      </Dialog>
    )
  }

  if (run.complete && result) {
    const placedAny = result.throughLesson > 0
    const full = result.nextLesson === null
    return (
      <Dialog title="Placement complete" onClose={onClose} closeLabel="Close placement result">
        <div className="morse-placement-result">
          <p className="morse-placement-result-title">
            {full
              ? 'Alphabet lessons complete'
              : `Start at Lesson ${result.nextLesson}`}
          </p>
          <p>
            {full
              ? 'Your check covered the A–Z lesson material. Formal Test and retention requirements are unchanged.'
              : placedAny
                ? `Lessons 1–${result.throughLesson} are now marked complete from this check.`
                : 'The check found an early gap, so Argus will start with the first lesson.'}
          </p>
          <p className="help tabular">
            {result.promptCount} prompts · {result.retries} {result.retries === 1 ? 'recheck' : 'rechecks'}
          </p>
          <button type="button" onClick={() => onContinue(result)}>
            {full ? 'Back to course' : `Start Lesson ${result.nextLesson}`}
          </button>
        </div>
      </Dialog>
    )
  }

  if (!target) return null

  const word = target.kind === 'word' ? target.word ?? '' : null
  return (
    <Dialog title="Morse placement check" onClose={onClose} closeLabel="Exit placement check">
      <div
        className="morse-placement-question"
        data-phase={phase}
        ref={targetRef}
        tabIndex={-1}
        aria-label={word ? `Key the word ${word}` : `Key the Morse pattern for ${target.letter}`}
      >
        <p className="morse-placement-meta tabular">
          Question {run.promptCount + 1} · {run.experience === 'some' ? 'Some experience' : 'Most letters'}
        </p>
        <p className="lesson-task">
          {target.retry ? 'One more check' : word ? 'Key the whole word' : 'Key this letter'}
        </p>

        {word ? (
          <>
            <p className="morse-placement-word" aria-hidden="true">{word}</p>
            <h3 className="sr-only">Key the whole word {word}.</h3>
          </>
        ) : (
          <>
            <p className="morse-placement-letter" aria-hidden="true">{target.letter}</p>
            <h3 className="sr-only">Key the Morse pattern for {target.letter}.</h3>
          </>
        )}

        {feedback ? (
          <div className={`morse-placement-feedback${feedback.correct ? ' is-correct' : ' is-wrong'}`} role="status" aria-live="assertive">
            <strong>{feedback.correct ? 'Correct' : 'Not quite'}</strong>
            {!feedback.correct && <span>{feedback.letter} will come back after other prompts.</span>}
          </div>
        ) : (
          <div className="morse-placement-key" inert={!armed}>
            {word ? (
              <MorseWordKeyInput
                key={`${run.experience}-${run.index}-${word}`}
                word={word}
                locked={!armed}
                onSubmit={answer}
              />
            ) : (
              <MorseKeyInput
                key={`${run.experience}-${run.index}-${target.letter}`}
                expectedLength={expectedMorsePlacementPattern(target).length}
                locked={!armed}
                onSubmit={answer}
              />
            )}
          </div>
        )}

        {feedback?.correct && (
          <span className="sr-only">{canonicalPattern(expectedMorsePlacementPattern(target))}</span>
        )}
      </div>
    </Dialog>
  )
}
