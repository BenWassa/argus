import { correctionLetter } from '../../../domain/morse/correction'
import { MORSE_LETTERS, type MorseLetter } from '../../../domain/morse/code'
import { nextSendStage, SEND_STAGE_INFO } from '../../../domain/morse/fluency/send'
import type { FreeToken } from '../../../domain/morse/fluency/freePlay'
import { MORSE_MAX_ELEMENTS, MorseKeyInput } from '../input/MorseKeyInput'
import { MorseCharacterSupport } from '../MorseCharacterSupport'
import { flowText, useSendRun, type SendRunProps } from './useSendRun'
import './SendRun.css'

function wordIndex(tokens: readonly FreeToken[]): number {
  return tokens.filter((token) => token.kind === 'space').length
}

/**
 * Printed text → keyed Morse.
 *
 * Spotlight words deliberately disclose the target character's element count:
 * this is the supported bridge from the lesson checkpoints. Every later stage
 * switches to pause-delimited open keying so the key no longer knows the
 * answer length. Press duration still chooses only dit/dah and never leaves
 * the shared control, so none of this can become sending-speed evidence.
 */
export function SendRun({
  stage,
  progress,
  onProgress,
  onStage,
  onExit,
  seed,
}: SendRunProps) {
  const {
    prompts,
    meta,
    correctionAudio,
    phase,
    promptIndex,
    review,
    done,
    characterIndex,
    spotlightGiven,
    spotlightFeedback,
    tokens,
    entry,
    advanceToken,
    target,
    keyed,
    continueSpotlightCorrection,
    clearPause,
    onFlowEntry,
    commitPattern,
    addWordGap,
    answerSpotlight,
    finishMessage,
    nextFromReview,
  } = useSendRun({ stage, progress, onProgress, onStage, onExit, seed })

  function renderTarget() {
    if (meta.interaction === 'spotlight') {
      return (
        <p className="send-target send-target-word" aria-label={`Send ${target}`}>
          {Array.from(target).map((character, index) => (
            <span
              key={`${character}-${index}`}
              className={
                index === characterIndex
                  ? 'is-current'
                  : index < characterIndex
                    ? 'is-done'
                    : undefined
              }
              aria-hidden="true"
            >
              {character}
            </span>
          ))}
        </p>
      )
    }

    const currentWord = wordIndex(tokens)
    const words = target.split(' ')
    return (
      <p
        className={`send-target ${words.length === 1 ? 'send-target-word' : 'send-target-message'}`}
        aria-label={`Send ${target}`}
      >
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className={words.length > 1 && index === currentWord ? 'is-current-word' : undefined}
            aria-hidden="true"
          >
            {word}
          </span>
        ))}
      </p>
    )
  }

  if (phase === 'done' && done) {
    const next = nextSendStage(progress, stage)
    return (
      <section className="session send-run send-summary">
        <div className="session-bar">
          <p><span className="session-topic">Send</span></p>
          <button className="ghost small" type="button" onClick={onExit}>Close</button>
        </div>

        <div className="send-summary-card">
          <p className="send-kicker">Round complete</p>
          <h1>{meta.title}</h1>
          <p className="send-score tabular">{done.score}%</p>
          <p className="send-summary-copy">
            {done.improved ? 'New personal best.' : 'Round saved to your formative bests.'}
          </p>

          <div className="send-summary-actions">
            <button type="button" onClick={() => onStage(next ?? stage)}>
              {next ? `Next: ${SEND_STAGE_INFO[next].title}` : 'Another run'}
            </button>
            <button className="ghost" type="button" onClick={() => onStage(stage)}>
              Repeat
            </button>
            <button className="quiet" type="button" onClick={onExit}>
              Done
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (phase === 'review' && review) {
    return (
      <section className="session send-run send-review">
        <div className="session-bar">
          <p><span className="session-topic">Send</span></p>
          <span className="session-count" aria-label={`Prompt ${promptIndex + 1} of ${prompts.length}`}>
            {promptIndex + 1}<span className="session-count-of">/{prompts.length}</span>
          </span>
          <button className="ghost small" type="button" onClick={onExit}>Close</button>
        </div>

        <div className="send-review-card">
          <p className="send-kicker">{review.correct ? 'Clean transmission' : 'Review'}</p>
          <h1 className={review.correct ? 'is-correct' : undefined}>
            {review.correct ? 'Received as sent' : 'Compare what arrived'}
          </h1>

          <dl className="send-compare">
            <div>
              <dt>Target</dt>
              <dd>{review.expected}</dd>
            </div>
            <div>
              <dt>Received</dt>
              <dd>{review.given || '—'}</dd>
            </div>
          </dl>

          {(() => {
            const glyph = correctionLetter(review.expected, review.given)
            return glyph ? <MorseCharacterSupport glyph={glyph}
              playing={correctionAudio.sounding?.glyph === glyph}
              onToggle={() => correctionAudio.toggle(glyph)} audioError={correctionAudio.audioError} /> : null
          })()}

          <p className="send-review-score tabular">{Math.round(review.accuracy * 100)}% this prompt</p>

          <button type="button" onClick={nextFromReview}>
            {promptIndex + 1 < prompts.length ? 'Next' : 'Finish round'}
          </button>
        </div>
      </section>
    )
  }

  const spotlightLetter =
    meta.interaction === 'spotlight'
      ? (target[characterIndex] as MorseLetter | undefined)
      : undefined

  return (
    <section className="session send-run">
      <div className="session-bar">
        <p><span className="session-topic">Send</span></p>
        <span className="session-count" aria-label={`Prompt ${promptIndex + 1} of ${prompts.length}`}>
          {promptIndex + 1}<span className="session-count-of">/{prompts.length}</span>
        </span>
        <button className="ghost small" type="button" onClick={onExit}>Close</button>
      </div>

      <div className="send-stage" data-kind={meta.interaction}>
        <header className="send-stage-head">
          <p className="send-kicker">{meta.title}</p>
          <h1 className="sr-only">Send {target} in Morse.</h1>
          {renderTarget()}
          <p className="send-purpose">
            {meta.interaction === 'spotlight'
              ? 'Key the highlighted letter. Correct letters advance automatically.'
              : stage === 'flow'
                ? 'Pause to finish each letter. The word is reviewed after its last letter.'
                : 'Pause to finish a letter. Use Space between words, then finish the message.'}
          </p>
        </header>

        <div className="send-output">
          <span className="send-output-label">Sent</span>
          <span className="send-output-value">
            {meta.interaction === 'spotlight'
              ? spotlightGiven || '—'
              : flowText(tokens) || (entry ? '…' : '—')}
          </span>
        </div>

        {meta.interaction === 'spotlight' && spotlightLetter ? (
          <div className="send-key-zone">
            <div className="send-feedback-slot" aria-live="assertive">
              {spotlightFeedback ? (
                <div className={`send-feedback ${spotlightFeedback.correct ? 'is-correct' : 'is-wrong'}`}>
                  <strong>{spotlightFeedback.correct ? 'Correct' : 'Miss'}</strong>
                  {!spotlightFeedback.correct && (
                    <>
                      <MorseCharacterSupport glyph={spotlightFeedback.letter} pattern={MORSE_LETTERS[spotlightFeedback.letter]} playing={correctionAudio.sounding?.glyph === spotlightFeedback.letter} onToggle={() => correctionAudio.toggle(spotlightFeedback.letter)} audioError={correctionAudio.audioError} />
                      <button
                        className="ghost small"
                        type="button"
                        onClick={continueSpotlightCorrection}
                        disabled={!keyed.holding}
                      >
                        Continue
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <span className="send-feedback-placeholder" aria-hidden="true">Ready</span>
              )}
            </div>

            <div inert={!keyed.armed}>
              <MorseKeyInput
                expectedLength={MORSE_LETTERS[spotlightLetter].length}
                advanceToken={`${promptIndex}-${characterIndex}`}
                locked={!keyed.armed}
                onSubmit={answerSpotlight}
              />
            </div>
          </div>
        ) : (
          <div className="send-key-zone">
            <MorseKeyInput
              expectedLength={MORSE_MAX_ELEMENTS}
              advanceToken={advanceToken}
              locked={phase !== 'sending'}
              onEntry={onFlowEntry}
              onPressStart={clearPause}
              onSubmit={commitPattern}
            />

            {stage !== 'flow' && (
              <div className="send-flow-actions">
                <button className="ghost" type="button" onClick={addWordGap}>
                  Space
                </button>
                <button
                  type="button"
                  onClick={finishMessage}
                  disabled={tokens.length === 0 && !entry}
                >
                  Finish
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
