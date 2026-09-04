import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildCuePayload,
  canonicalPattern,
  isCorrectResponse,
  patternReading,
  promptFor,
  type AcquisitionCharacter,
} from '../../lib/acquisition'
import type { CueRung } from '../../lib/cueLadder'

export interface ProgressiveAnswer {
  correct: boolean
  /** Recorded from the first session. Gates nothing. */
  latencyMs: number
  response: string
}

interface ProgressiveCardProps {
  character: AcquisitionCharacter
  rung: CueRung
  /** Alternatives for a choice rung, already including the answer, shuffled. */
  options: string[]
  onAnswer: (answer: ProgressiveAnswer) => void
  /** Changes whenever a new card is shown, resetting every local state. */
  cardKey: string
  now?: () => number
}

function defaultNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function CuePanel({ rung, character }: { rung: CueRung; character: AcquisitionCharacter }) {
  const cue = buildCuePayload(rung, character)
  // An uncued rung produces a payload with nothing in it but its own id, so
  // there is nothing here to render and nothing that could leak.
  if (cue.elementCount === undefined && cue.revealedPattern === undefined) return null

  return (
    <div className="test-cue" data-rung={cue.rungId}>
      <p className="test-cue-label">Cue</p>
      {cue.revealedPattern && (
        <p className="test-cue-pattern">
          <span aria-hidden="true">
            {cue.revealedPattern}
            {cue.hiddenCount ? ` ${'?'.repeat(cue.hiddenCount)}` : ''}
          </span>
          <span className="sr-only">
            {`Starts ${cue.revealedReading}, with ${cue.hiddenCount} more to recall.`}
          </span>
        </p>
      )}
      {cue.elementCount !== undefined && (
        <p className="test-cue-length">
          {cue.elementCount} {cue.elementCount === 1 ? 'element' : 'elements'} in total
        </p>
      )}
    </div>
  )
}

/**
 * One prompt on the acquisition ladder.
 *
 * The rung decides the direction, what scaffolding is shown, how the response
 * is given and whether alternatives are delayed. Nothing here knows about
 * status, history or retention; it reports one answer and its latency upward.
 */
export function ProgressiveCard({
  character,
  rung,
  options,
  onAnswer,
  cardKey,
  now = defaultNow,
}: ProgressiveCardProps) {
  const [entry, setEntry] = useState('')
  const [result, setResult] = useState<ProgressiveAnswer | null>(null)
  const [optionsReady, setOptionsReady] = useState(rung.choiceDelayMs === 0)
  const startedAt = useRef(now())
  const nextRef = useRef<HTMLButtonElement>(null)
  const entryRef = useRef<HTMLInputElement>(null)

  const prompt = useMemo(() => promptFor(rung, character), [rung, character])

  useEffect(() => {
    setEntry('')
    setResult(null)
    setOptionsReady(rung.choiceDelayMs === 0)
    startedAt.current = now()
    if (rung.choiceDelayMs === 0) return
    // van den Broek et al. (2023): the prompt stands alone first, so retrieval
    // is attempted before recognition support arrives.
    const timer = setTimeout(() => setOptionsReady(true), rung.choiceDelayMs)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey])

  useEffect(() => {
    if (result) nextRef.current?.focus({ preventScroll: true })
    else if (rung.response === 'entry') entryRef.current?.focus({ preventScroll: true })
  }, [result, rung.response, cardKey])

  function submit(response: string) {
    if (result) return
    setResult({
      correct: isCorrectResponse(rung, character, response),
      latencyMs: Math.max(0, Math.round(now() - startedAt.current)),
      response,
    })
  }

  function advance() {
    if (result) onAnswer(result)
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
      if (result) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          advance()
        }
        return
      }
      if (rung.response !== 'production' || typing) return
      if (event.key === '.') {
        event.preventDefault()
        setEntry((current) => current + '.')
      } else if (event.key === '-') {
        event.preventDefault()
        setEntry((current) => current + '-')
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        setEntry((current) => current.slice(0, -1))
      } else if (event.key === 'Enter' && entry) {
        event.preventDefault()
        submit(entry)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <section className="progressive-card" aria-labelledby="prompt-heading">
      <p className="test-rung">
        <span className="test-rung-name">{rung.label}</span>
        <span className="test-rung-instruction">{rung.instruction}</span>
      </p>

      <div className="test-prompt">
        <h1 id="prompt-heading" className="test-prompt-value">
          {prompt}
        </h1>
        {rung.direction === 'answer-to-prompt' && (
          <p className="sr-only">{patternReading(character.pattern)}</p>
        )}
      </div>

      {!result && <CuePanel rung={rung} character={character} />}

      {!result && rung.response === 'choice' && (
        <div className="test-options" aria-busy={!optionsReady}>
          {optionsReady ? (
            options.map((option) => (
              <button
                className="test-option mono"
                key={option}
                type="button"
                onClick={() => submit(option)}
              >
                <span aria-hidden="true">
                  {rung.direction === 'prompt-to-answer' ? canonicalPattern(option) : option}
                </span>
                <span className="sr-only">
                  {rung.direction === 'prompt-to-answer' ? patternReading(option) : option}
                </span>
              </button>
            ))
          ) : (
            <p className="test-waiting" role="status">
              Recall it now — the alternatives are coming.
            </p>
          )}
        </div>
      )}

      {!result && rung.response === 'production' && (
        <div className="test-production">
          <p className="test-entry mono" aria-live="polite">
            <span aria-hidden="true">{entry ? canonicalPattern(entry) : '—'}</span>
            <span className="sr-only">{entry ? patternReading(entry) : 'nothing keyed yet'}</span>
          </p>
          <div className="test-keys">
            <button className="test-key" type="button" onClick={() => setEntry((c) => c + '.')}>
              <span aria-hidden="true">·</span>
              <span className="sr-only">Add a dit</span>
            </button>
            <button className="test-key" type="button" onClick={() => setEntry((c) => c + '-')}>
              <span aria-hidden="true">—</span>
              <span className="sr-only">Add a dah</span>
            </button>
            <button
              className="ghost test-key-small"
              type="button"
              onClick={() => setEntry((c) => c.slice(0, -1))}
              disabled={entry.length === 0}
            >
              Back
            </button>
          </div>
          <button
            className="test-submit"
            type="button"
            disabled={entry.length === 0}
            onClick={() => submit(entry)}
          >
            Submit
          </button>
          <p className="test-hint">Keys: full stop for a dit, hyphen for a dah, Enter to submit.</p>
        </div>
      )}

      {!result && rung.response === 'entry' && (
        <form
          className="test-entry-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (entry.trim()) submit(entry)
          }}
        >
          <label className="test-entry-label" htmlFor="character-entry">
            Which character is this?
          </label>
          <input
            ref={entryRef}
            id="character-entry"
            className="field test-entry-input"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={1}
            value={entry}
            onChange={(event) => setEntry(event.target.value)}
          />
          <button className="test-submit" type="submit" disabled={entry.trim().length === 0}>
            Submit
          </button>
        </form>
      )}

      {result && (
        <div className={`test-feedback${result.correct ? ' is-correct' : ''}`} role="status">
          <p className="test-feedback-verdict">{result.correct ? 'Correct' : 'Not this time'}</p>
          <p className="test-feedback-answer">
            <span className="test-feedback-glyph">{character.glyph}</span>
            <span className="mono" aria-hidden="true">{canonicalPattern(character.pattern)}</span>
            <span className="sr-only">{character.reading}</span>
          </p>
          <button ref={nextRef} className="test-next" type="button" onClick={advance}>
            Next
          </button>
        </div>
      )}
    </section>
  )
}
