import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { isCorrectChoice, shuffledOptions } from '../../domain/visual/choice'
import { gradeFields, isCopyCorrect, responseAnswerText, type FieldsResult } from '../../domain/audio/response'
import type { Item } from '../../domain/library/topic'
import { useKeyedResponse } from '../morse/keyedResponse'
import { AudioStimulusView } from './AudioStimulusView'

export interface AudioAnswer {
  /** Whether the response matched the key, however the learner got there. */
  correct: boolean
  /**
   * The transcript was revealed before answering, or the recording could not be
   * played. Such an answer is practice: real, but not evidence of hearing.
   */
  assisted: boolean
  latencyMs: number
  response: string
}

interface CardState {
  key: string
  revealed: boolean
  unavailable: boolean
  text: string
  fieldValues: string[]
  result: null | { correct: boolean; assisted: boolean; given: string; fields?: FieldsResult }
}

function freshState(key: string): CardState {
  return { key, revealed: false, unavailable: false, text: '', fieldValues: [], result: null }
}

interface AudioCardProps {
  item: Item & { audio: NonNullable<Item['audio']> }
  onAnswer: (answer: AudioAnswer) => void
  /** Changes whenever a new card is shown, resetting every local state. */
  cardKey: string
  now?: () => number
}

function defaultNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

/**
 * One objectively graded listening question (#151).
 *
 * The recording and the task come first; the transcript is concealed until the
 * learner asks for it. Asking is allowed at any time and is honest about its
 * cost: from that moment the answer is **transcript-assisted**, and is shown as
 * practice rather than counted as listening. A recording that cannot be played
 * has the same effect, so a device with no audio is never stuck.
 *
 * Grading is deterministic and done here against the item's own content — never
 * self-scored. It uses the same keyed-answer lifecycle as every other objective
 * card: a hit moves on, a miss holds until the learner has read it.
 */
export function AudioCard({ item, onAnswer, cardKey, now = defaultNow }: AudioCardProps) {
  const { audio } = item
  const mode: 'choice' | 'copy' | 'fields' = item.choice ? 'choice' : item.response?.mode ?? 'copy'
  // All per-card state lives in one object stamped with the card it belongs to. A
  // new card reads as a fresh one *in the same render*, not after an effect has
  // reset it, so the previous answer's feedback can never show under the next
  // question for even one committed frame.
  const [state, setState] = useState<CardState>(() => freshState(cardKey))
  const card = state.key === cardKey ? state : freshState(cardKey)
  const { revealed, unavailable, text, fieldValues, result } = card
  const patch = (changes: Partial<Omit<CardState, 'key'>>) =>
    setState((previous) => ({ ...(previous.key === cardKey ? previous : freshState(cardKey)), ...changes, key: cardKey }))
  const startedAt = useRef(now())
  const continueRef = useRef<HTMLButtonElement>(null)
  const pending = useRef<AudioAnswer | null>(null)
  const onAnswerRef = useRef(onAnswer)
  onAnswerRef.current = onAnswer

  const { armed, holding, answered, acknowledge } = useKeyedResponse(() => {
    const answer = pending.current
    pending.current = null
    if (answer) onAnswerRef.current(answer)
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => (item.choice ? shuffledOptions(item) : []), [cardKey])

  useEffect(() => {
    startedAt.current = now()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey])

  const assisted = revealed || unavailable
  // An answer the card holds for the learner to read: a miss, or a correct answer
  // that does not count because the transcript was used.
  const held = result !== null && !(result.correct && !result.assisted)

  useEffect(() => {
    if (held) continueRef.current?.focus({ preventScroll: true })
  }, [held])

  function finish(correct: boolean, given: string, fields?: FieldsResult) {
    if (result || !armed) return
    const answer: AudioAnswer = {
      correct,
      assisted,
      latencyMs: Math.max(0, Math.round(now() - startedAt.current)),
      response: given,
    }
    pending.current = answer
    patch({ result: { correct, assisted, given, fields } })
    answered(correct && !assisted)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (mode === 'copy' && item.response?.mode === 'copy') {
      if (!text.trim()) return
      finish(isCopyCorrect(item.answer, text, item.response.normalizer), text)
    } else if (item.response?.mode === 'fields') {
      const fields = gradeFields(item.response.fields, fieldValues)
      if (fieldValues.every((value) => !value?.trim())) return
      finish(fields.correct, fieldValues.join(' · '), fields)
    }
  }

  const keyText = item.response ? responseAnswerText(item.response, item.answer) : item.answer
  const counted = result ? result.correct && !result.assisted : false

  return (
    <section className="choice-card audio-card" aria-labelledby="audio-prompt">
      <p className="test-task">Listen</p>

      <AudioStimulusView
        audio={audio}
        showTranscript={revealed || result !== null}
        onRevealTranscript={result ? undefined : () => patch({ revealed: true })}
        onUnavailable={() => patch({ unavailable: true })}
        label={item.prompt}
      />

      <h1 id="audio-prompt" className="test-prompt is-question">
        {item.prompt}
      </h1>

      {revealed && !result && (
        <p className="audio-assisted" role="status">
          Transcript shown: this answer will be practice, not counted as listening.
        </p>
      )}

      {mode === 'choice' && (
        <div className="choice-options" role="group" aria-labelledby="audio-prompt">
          {options.map((option) => {
            const given = result?.given
            const state =
              given === undefined
                ? ''
                : option === item.answer
                  ? ' is-answer'
                  : option === given
                    ? ' is-wrong'
                    : ''
            return (
              <button
                key={option}
                type="button"
                className={`choice-option${state}`}
                disabled={result !== null || !armed}
                aria-pressed={result?.given === option}
                onClick={() => finish(isCorrectChoice(item, option), option)}
              >
                {option}
              </button>
            )
          })}
        </div>
      )}

      {mode === 'copy' && (
        <form className="audio-response" onSubmit={submit}>
          <label className="audio-label" htmlFor="audio-copy">
            Type what you heard
          </label>
          <input
            id="audio-copy"
            className="field audio-input"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            disabled={result !== null || !armed}
            value={text}
            onChange={(event) => patch({ text: event.target.value })}
          />
          <button type="submit" disabled={result !== null || !armed || !text.trim()}>
            Check
          </button>
        </form>
      )}

      {mode === 'fields' && item.response?.mode === 'fields' && (
        <form className="audio-response" onSubmit={submit}>
          {item.response.fields.map((field, index) => (
            <div className="audio-field" key={field.label}>
              <label className="audio-label" htmlFor={`audio-field-${index}`}>
                {field.label}
              </label>
              <input
                id={`audio-field-${index}`}
                className="field audio-input"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                disabled={result !== null || !armed}
                value={fieldValues[index] ?? ''}
                onChange={(event) => {
                  const next = [...fieldValues]
                  next[index] = event.target.value
                  patch({ fieldValues: next })
                }}
              />
            </div>
          ))}
          <button type="submit" disabled={result !== null || !armed}>
            Check
          </button>
        </form>
      )}

      {result && result.correct && (
        <div className="test-feedback is-correct" role="status" aria-live="polite">
          <p className="test-verdict">{counted ? 'Correct' : 'Correct, as practice'}</p>
          {!counted && (
            <p className="test-ladder">
              {unavailable
                ? 'The recording could not be played, so this is practice and is not counted as listening.'
                : 'You read the transcript first, so this is practice and is not counted as listening.'}
            </p>
          )}
          {!counted && (
            <button ref={continueRef} className="test-next" type="button" onClick={acknowledge} disabled={!holding}>
              Continue
            </button>
          )}
        </div>
      )}

      {result && !result.correct && (
        <div className="test-feedback" role="status" aria-live="assertive">
          <p className="test-verdict">Not that one</p>
          <div className="test-correction">
            {result.fields ? (
              result.fields.fields.map((field) => (
                <p className="test-correction-row" key={field.label}>
                  <span className="test-correction-label">{field.label}</span>
                  <span className="test-correction-value choice-value">
                    {field.correct ? field.expected : `${field.response || '—'} → ${field.expected}`}
                  </span>
                </p>
              ))
            ) : (
              <>
                <p className="test-correction-row">
                  <span className="test-correction-label">You gave</span>
                  <span className="test-correction-value choice-value">{result.given}</span>
                </p>
                <p className="test-correction-row">
                  <span className="test-correction-label">Answer</span>
                  <span className="test-correction-value choice-value">{keyText}</span>
                </p>
              </>
            )}
          </div>
          <button ref={continueRef} className="test-next" type="button" onClick={acknowledge} disabled={!holding}>
            Continue
          </button>
        </div>
      )}
    </section>
  )
}
