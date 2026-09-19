import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildCuePayload,
  canonicalPattern,
  isCorrectResponse,
  patternReading,
  promptFor,
  type AcquisitionCharacter,
} from '../../domain/morse/testing/acquisitionProfile'
import type { CueRung } from '../../domain/study/cueLadder'
import { MorsePhrase } from '../morse/MorsePhrase'
import { MorseKeyInput, useKeyedResponse } from '../morse/keyedResponse'

export interface ProgressiveAnswer {
  correct: boolean
  /** Recorded from the first session. Gates nothing. */
  latencyMs: number
  response: string
}

interface ProgressiveCardProps {
  character: AcquisitionCharacter
  rung: CueRung
  onAnswer: (answer: ProgressiveAnswer) => void
  /** Changes whenever a new card is shown, resetting every local state. */
  cardKey: string
  now?: () => number
}

function defaultNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

/**
 * One graded Morse question.
 *
 * The screen is deliberately four things in one column — what to do, the
 * prompt, at most one piece of support, and the control that answers it — and
 * the ladder decides only whether the third of those exists.
 *
 * It used to be six, and they disagreed with each other. The rung's internal
 * name (`Rhythm support`, `Free production`) headed the screen above an
 * instruction restating what the key's own legend says; the prompt sat in a
 * card of its own; and a dashed `Cue` panel below it rendered the same
 * scaffolding up to four times over — the mnemonic beats with per-word
 * `short ·` / `hold —` captions, a timing SVG that reprinted the prompt letter
 * inside the cue, the revealed notation `· — ?`, and a line counting the
 * elements the marks had already counted. Learn had dropped that per-beat
 * caption grammar as noise; Test kept it. Four readings of one cue is not four
 * times the support — it is a screen the learner has to sort through before
 * they can start recalling anything.
 *
 * So support is now whatever the rung's single strongest disclosure is, and
 * only that: the opening of the mnemonic phrase where the rung allows a verbal
 * cue, otherwise the signal count, otherwise nothing at all. The phrase is the
 * shared `MorsePhrase` — the same component, the same `·`/`—` marks and the
 * same `?` for what is still to recall that the lesson uses — so a cue inside
 * Test reads as the thing the learner already met in Learn rather than as a
 * second notation invented for this screen.
 *
 * What a rung *may* show is unchanged and still lives in `buildCuePayload`;
 * this is a presentation decision about how much of that allowance is worth
 * spending. `isAssistedRung` reads the rung, not this file, so an answer given
 * here is recorded exactly as independent — or not — as it always was.
 */
export function ProgressiveCard({
  character,
  rung,
  onAnswer,
  cardKey,
  now = defaultNow,
}: ProgressiveCardProps) {
  const [entry, setEntry] = useState('')
  const [result, setResult] = useState<ProgressiveAnswer | null>(null)
  const startedAt = useRef(now())
  const continueRef = useRef<HTMLButtonElement>(null)
  const entryRef = useRef<HTMLInputElement>(null)
  /** The answer waiting to be handed over when its feedback is finished with. */
  const pending = useRef<ProgressiveAnswer | null>(null)
  const onAnswerRef = useRef(onAnswer)
  onAnswerRef.current = onAnswer

  /**
   * The same keyed-answer lifecycle Learn and the word checkpoints use: a hit
   * is acknowledged briefly and moves on by itself, a miss holds until the
   * learner says they have read it, and the response control is gated for the
   * whole of both — including across the swap into the next question, which is
   * why this card is not remounted per question.
   *
   * The card used to give every answer the same 800ms and then take the screen
   * away, which is too long to sit through when you were right and nowhere
   * near long enough to read what you got wrong.
   */
  const { armed, holding, answered, acknowledge } = useKeyedResponse(() => {
    const answer = pending.current
    pending.current = null
    if (answer) onAnswerRef.current(answer)
  })

  const keying = rung.direction === 'prompt-to-answer'
  const prompt = useMemo(() => promptFor(rung, character), [rung, character])
  const cue = useMemo(() => buildCuePayload(rung, character), [rung, character])

  useEffect(() => {
    setEntry('')
    setResult(null)
    startedAt.current = now()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey])

  useEffect(() => {
    if (result) {
      // A correction ends on a press, so the press is where focus goes.
      if (!result.correct) continueRef.current?.focus({ preventScroll: true })
    } else if (!keying && armed) {
      entryRef.current?.focus({ preventScroll: true })
    }
  }, [result, keying, armed, cardKey])

  function submit(response: string) {
    if (result) return
    const answer: ProgressiveAnswer = {
      correct: isCorrectResponse(rung, character, response),
      latencyMs: Math.max(0, Math.round(now() - startedAt.current)),
      response,
    }
    pending.current = answer
    setResult(answer)
    answered(answer.correct)
  }

  /**
   * Typed reception grades on the character, with no separate submit.
   *
   * It is the same contract the key has had since #87 — the answer is complete
   * the moment it is complete, and a mis-entry is a miss — so the reverse
   * direction no longer asks for an extra tap the forward direction never
   * wanted, on a field that holds exactly one character.
   */
  function enter(value: string) {
    const next = value.slice(0, 1)
    setEntry(next)
    if (next.trim()) submit(next)
  }

  /**
   * The one thing this rung discloses, or nothing.
   *
   * Ordered by strength rather than accumulated: a phrase prefix already
   * carries the marks and the count of what is still hidden, so the count is
   * support only where the phrase is not.
   */
  const support = cue.verbalBeats?.length
    ? (
        <div className="test-support">
          <MorsePhrase
            glyph={character.glyph}
            beats={cue.verbalBeats}
            hiddenCount={cue.hiddenCount}
            label={`Opening of ${character.glyph}: ${cue.revealedReading}, with ${cue.hiddenCount} more to recall.`}
          />
        </div>
      )
    : cue.elementCount !== undefined
      ? (
          <p className="test-support test-length">
            {cue.elementCount} {cue.elementCount === 1 ? 'signal' : 'signals'}
          </p>
        )
      : null

  return (
    <section className="progressive-card" aria-labelledby="prompt-heading">
      <p className="test-task">{keying ? 'Key it' : 'Name it'}</p>

      {keying ? (
        <h1 id="prompt-heading" className="test-prompt">
          {character.glyph}
        </h1>
      ) : (
        <h1 id="prompt-heading" className="test-prompt is-pattern">
          {/* Drawn from the canonical notation rather than set in it. At the
              size a prompt wants to be, `— — · —` is four rules of arbitrary
              length with a speck in the middle; a dah drawn three times the
              width of a dit is the timing itself, which is what the question
              is actually asking the learner to read. */}
          <span className="test-pattern" aria-hidden="true">
            {prompt.split(' ').map((mark, index) => (
              <span
                className={`test-pattern-mark is-${mark === '·' ? 'dit' : 'dah'}`}
                key={`${mark}-${index}`}
              />
            ))}
          </span>
          <span className="sr-only">{patternReading(character.pattern)}</span>
        </h1>
      )}

      {!result && support}

      {!result && (
        <div className="test-answer">
          {keying ? (
            // Keyed per question, so a pattern can never carry into the next
            // letter, while the response lifecycle above spans the swap.
            <MorseKeyInput
              key={cardKey}
              expectedLength={character.pattern.length}
              locked={!armed}
              onSubmit={submit}
            />
          ) : (
            <div className="test-entry">
              <label className="sr-only" htmlFor="character-entry">
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
                disabled={!armed}
                value={entry}
                onChange={(event) => enter(event.target.value)}
              />
              {/* The instruction on the control, in the same voice the key's own
                  legend uses, rather than as a sentence above the prompt. */}
              <p className="test-entry-legend" aria-hidden="true">
                Type the letter
              </p>
            </div>
          )}
        </div>
      )}

      {result?.correct && (
        <div className="test-feedback is-correct" role="status" aria-live="polite">
          <p className="test-verdict">Correct</p>
        </div>
      )}

      {result && !result.correct && (
        <div className="test-feedback" role="status" aria-live="assertive">
          <p className="test-verdict">Not that one</p>
          {/* What you gave and what it is, on two aligned rows rather than in a
              sentence: the one thing to do with a correction is compare them,
              and notation inside prose picks up stops and commas that read as
              further marks. */}
          <div className="test-correction">
            <p className="test-correction-row">
              <span className="test-correction-label">{keying ? 'You keyed' : 'You said'}</span>
              {keying ? (
                <>
                  <span className="test-correction-value mono" aria-hidden="true">
                    {canonicalPattern(result.response)}
                  </span>
                  <span className="sr-only">{patternReading(result.response)}</span>
                </>
              ) : (
                <span className="test-correction-value test-correction-glyph">
                  {result.response.toUpperCase()}
                </span>
              )}
            </p>
            <p className="test-correction-row">
              <span className="test-correction-label">Answer</span>
              {keying ? (
                <>
                  <span className="test-correction-value mono" aria-hidden="true">
                    {canonicalPattern(character.pattern)}
                  </span>
                  <span className="sr-only">{character.reading}</span>
                </>
              ) : (
                <span className="test-correction-value test-correction-glyph">
                  {character.glyph}
                </span>
              )}
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
