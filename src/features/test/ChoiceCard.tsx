import { useEffect, useMemo, useRef, useState } from 'react'
import { isCorrectChoice, shuffledOptions } from '../../domain/visual/choice'
import type { Item } from '../../domain/library/topic'
import { VisualView } from '../visual/VisualView'
import { useKeyedResponse } from '../morse/keyedResponse'

export interface ChoiceAnswer {
  correct: boolean
  latencyMs: number
  response: string
}

interface ChoiceCardProps {
  item: Item
  onAnswer: (answer: ChoiceAnswer) => void
  /** Changes whenever a new card is shown, resetting every local state. */
  cardKey: string
  now?: () => number
}

function defaultNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

/**
 * One objectively graded single-answer question (#146).
 *
 * The learner picks an option and the answer is graded on the spot, against
 * the item's own answer key — never self-scored. It uses the keyed-answer
 * lifecycle the other objectively graded card uses: a hit is acknowledged
 * briefly and moves on, a miss holds until the learner says they have read it,
 * and the options are gated for the whole of both so a finger still travelling
 * from one answer cannot land on the next question.
 *
 * Options are shuffled once per card. Only their display order varies; the key
 * is compared by text, so shuffling cannot disturb it. The stimulus is shown
 * without its caption, because a caption is teaching text and may say the
 * answer.
 */
export function ChoiceCard({ item, onAnswer, cardKey, now = defaultNow }: ChoiceCardProps) {
  // The chosen option is stamped with the card it was chosen on, so a new card
  // reads as unanswered in the same render rather than after an effect has reset
  // it. Otherwise the previous answer's feedback would show under the next
  // question for one committed frame.
  const [choice, setChoice] = useState<{ key: string; option: string } | null>(null)
  const chosen = choice && choice.key === cardKey ? choice.option : null
  const startedAt = useRef(now())
  const continueRef = useRef<HTMLButtonElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const pending = useRef<ChoiceAnswer | null>(null)
  const onAnswerRef = useRef(onAnswer)
  onAnswerRef.current = onAnswer

  const { armed, holding, answered, acknowledge } = useKeyedResponse(() => {
    const answer = pending.current
    pending.current = null
    if (answer) onAnswerRef.current(answer)
  })

  // A fresh order per question; stable across this card's own re-renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => shuffledOptions(item), [cardKey])

  useEffect(() => {
    startedAt.current = now()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey])

  const correct = chosen !== null && isCorrectChoice(item, chosen)

  useEffect(() => {
    if (chosen === null || correct) return
    continueRef.current?.focus({ preventScroll: true })
    // On a short phone a picture, a long prompt and four options already fill
    // the screen, so the correction and its Continue land below the fold.
    // `nearest` leaves the page still when they are already in view.
    feedbackRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [chosen, correct])

  function choose(option: string) {
    if (chosen !== null || !armed) return
    const answer: ChoiceAnswer = {
      correct: isCorrectChoice(item, option),
      latencyMs: Math.max(0, Math.round(now() - startedAt.current)),
      response: option,
    }
    pending.current = answer
    setChoice({ key: cardKey, option })
    answered(answer.correct)
  }

  return (
    <section className="choice-card" aria-labelledby="choice-prompt">
      <p className="test-task">Choose one</p>

      {item.stimulus && <VisualView visual={item.stimulus} showCaption={false} />}

      <h1 id="choice-prompt" className="test-prompt is-question">
        {item.prompt}
      </h1>

      <div className="choice-options" role="group" aria-labelledby="choice-prompt">
        {options.map((option) => {
          const state =
            chosen === null
              ? ''
              : option === item.answer
                ? ' is-answer'
                : option === chosen
                  ? ' is-wrong'
                  : ''
          return (
            <button
              key={option}
              type="button"
              className={`ghost choice-option${state}`}
              disabled={chosen !== null || !armed}
              aria-pressed={chosen === option}
              onClick={() => choose(option)}
            >
              {option}
            </button>
          )
        })}
      </div>

      {chosen !== null && correct && (
        <div className="test-feedback is-correct" role="status" aria-live="polite">
          <p className="test-verdict">Correct</p>
        </div>
      )}

      {chosen !== null && !correct && (
        <div ref={feedbackRef} className="test-feedback" role="status" aria-live="assertive">
          <p className="test-verdict">Not that one</p>
          <div className="test-correction">
            <p className="test-correction-row">
              <span className="test-correction-label">You chose</span>
              <span className="test-correction-value choice-value">{chosen}</span>
            </p>
            <p className="test-correction-row">
              <span className="test-correction-label">Answer</span>
              <span className="test-correction-value choice-value">{item.answer}</span>
            </p>
          </div>
          <button
            ref={continueRef}
            className="test-next"
            type="button"
            onClick={acknowledge}
            disabled={!holding}
          >
            Continue
          </button>
        </div>
      )}
    </section>
  )
}
