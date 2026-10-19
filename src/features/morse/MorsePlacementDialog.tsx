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
import { SessionFrame, SessionCorrect } from '../../shared/ui/SessionFrame'
import './MorsePlacement.css'

interface MorsePlacementDialogProps {
  topic: Topic
  onClose: () => void
  onNew: () => void
  onCommit: (result: MorsePlacementResult) => void
  onContinue: (result: MorsePlacementResult) => void
}

/** A three-bar level mark: how much Morse a choice starts from. */
function LevelMark({ level }: { level: 1 | 2 | 3 }) {
  return (
    <svg className="morse-placement-mark" width="24" height="20" viewBox="0 0 24 20" focusable="false" aria-hidden="true">
      {[0, 1, 2].map((bar) => (
        <rect key={bar} x={bar * 9} y={12 - bar * 6} width="6" height={8 + bar * 6} rx="1.5"
          fill={bar < level ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
      ))}
    </svg>
  )
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
          {/* A mark and one or two words each (#257); the names keep the full choice. */}
          <div className="morse-placement-choices">
            <button type="button" aria-label="New to Morse" onClick={onNew}>
              <LevelMark level={1} /><span>New</span>
            </button>
            <button type="button" className="ghost" aria-label="Know some Morse" onClick={() => begin('some')}>
              <LevelMark level={2} /><span>Know some</span>
            </button>
            <button type="button" className="ghost" aria-label="Know most Morse" onClick={() => begin('most')}>
              <LevelMark level={3} /><span>Know most</span>
            </button>
          </div>
        </div>
      </Dialog>
    )
  }

  if (run.complete && result) {
    const full = result.nextLesson === null
    return (
      <Dialog title="Placement complete" onClose={onClose} hideHeader>
        <SessionFrame kind="lesson" title="Placement" onClose={onClose} className="morse-placement-session">
          <div className="morse-placement-result">
            <p className="morse-placement-result-title">
              {full
                ? 'Alphabet lessons complete'
                : `Start at Lesson ${result.nextLesson}`}
            </p>
            <span className="help">Formal Test unchanged</span>
            <p className="help tabular">
              {result.promptCount} prompts · {result.retries} {result.retries === 1 ? 'recheck' : 'rechecks'}
            </p>
            <button type="button" onClick={() => onContinue(result)}>
              {full ? 'Back to course' : `Start Lesson ${result.nextLesson}`}
            </button>
          </div>
        </SessionFrame>
      </Dialog>
    )
  }

  if (!target) return null

  const word = target.kind === 'word' ? target.word ?? '' : null
  return (
    <Dialog title="Morse placement check" onClose={onClose} hideHeader>
      <SessionFrame kind="lesson" title="Placement" onClose={onClose} className="morse-placement-session">
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
            {target.retry ? 'Recheck' : word ? 'Word' : 'Letter'}
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
              {feedback.correct ? <SessionCorrect target={feedback.letter} announce={false} /> : <strong>Not quite</strong>}
              {!feedback.correct && <span>Recheck {feedback.letter}</span>}
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
      </SessionFrame>
    </Dialog>
  )
}
