import { MORSE_LETTERS, type MorseLetter } from '../../../domain/morse/code'
import { correctionLetter } from '../../../domain/morse/correction'
import {
  type FreeToken
} from '../../../domain/morse/fluency/freePlay'
import { spokenRhythm as patternReading } from '../../../domain/morse/mnemonics'
import { LEVEL_REASON_LETTERS } from '../../../domain/morse/modes'
import { RoundResult, SessionCorrect, SessionFrame } from '../../../shared/ui/SessionFrame'
import { MORSE_MAX_ELEMENTS, MorseKeyInput } from '../input/MorseKeyInput'
import { MorseCharacterSupport } from '../MorseCharacterSupport'
import { MorseMarks } from '../MorseMarks'
import './SendRun.css'
import { useSendRun, type SendRunProps } from './useSendRun'
function flowText(tokens: readonly FreeToken[]): string {
  return tokens
    .map((token) => (token.kind === 'space' ? ' ' : token.character ?? '?'))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}
function wordIndex(tokens: readonly FreeToken[]): number {
  return tokens.filter((token) => token.kind === 'space').length
}
export function SendRun({
  stage,
  progress,
  onProgress,
  onStage,
  onExit,
  allowed,
  seed,
}: SendRunProps) {
  const { prompts, meta, correctionAudio, phase, promptIndex, judgements, review, done, characterIndex, spotlightGiven, spotlightFeedback, tokens, entry, advanceToken, target, keyed, continueSpotlightCorrection, clearPause, commitPattern, onFlowEntry, addWordGap, answerSpotlight, finishMessage, nextFromReview } = useSendRun({ stage, progress, onProgress, onStage, onExit, allowed, seed })
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

  if (prompts.length === 0) {
    return <SessionFrame kind="key" title="Key" onClose={onExit}>
      <h2 className="session-prompt-heading">{LEVEL_REASON_LETTERS}</h2>
    </SessionFrame>
  }

  const frame = { kind: 'key' as const, title: 'Key', onClose: onExit, progress: { current: phase === 'done' ? prompts.length : promptIndex + 1, total: prompts.length } }
  if (phase === 'done' && done) {
    return <SessionFrame {...frame} className="send-run send-summary">
      <RoundResult correct={judgements.filter(judgement => judgement.correct).length} total={prompts.length} onAgain={() => onStage(stage)} onDone={onExit} />
    </SessionFrame>
  }

  if (phase === 'review' && review) {
    return (
      <SessionFrame {...frame} className="send-run send-review">

        <div className="send-review-card">
          <p className="send-kicker">{review.correct ? 'Clean transmission' : 'Review'}</p>
          <h2 className={`session-prompt-heading${review.correct ? ' is-correct' : ''}`}>
            {review.correct ? 'Received as sent' : 'Compare what arrived'}
          </h2>
          {review.correct && <SessionCorrect target={review.expected} />}

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
      </SessionFrame>
    )
  }

  const spotlightLetter =
    meta.interaction === 'spotlight'
      ? (target[characterIndex] as MorseLetter | undefined)
      : undefined

  return (
    <SessionFrame {...frame} className="send-run">

      <div className="send-stage" data-kind={meta.interaction}>
        <header className="send-stage-head">
          <p className="send-kicker">{meta.title}</p>
          <h2 className="session-prompt-heading sr-only">Send {target} in Morse.</h2>
          {renderTarget()}
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
            {spotlightFeedback && !spotlightFeedback.correct ? (
              // The shared miss (#263), docked where the key was. The key stays
              // mounted underneath, hidden, so its unlocked audio survives.
              <SessionCorrect className="send-miss" miss={{
                said: spotlightFeedback.pattern ? <MorseMarks pattern={spotlightFeedback.pattern} size="support" label={patternReading(spotlightFeedback.pattern)} /> : undefined,
                saidLabel: 'You keyed',
                answer: <MorseCharacterSupport glyph={spotlightFeedback.letter} pattern={MORSE_LETTERS[spotlightFeedback.letter]} playing={correctionAudio.sounding?.glyph === spotlightFeedback.letter} onToggle={() => correctionAudio.toggle(spotlightFeedback.letter)} audioError={correctionAudio.audioError} />,
                onContinue: continueSpotlightCorrection,
                continueDisabled: !keyed.holding,
              }} />
            ) : (
              <div className="send-feedback-slot" aria-live="assertive">
                {spotlightFeedback ? (
                  <div className="send-feedback is-correct">
                    <SessionCorrect target={spotlightFeedback.letter} announce={false} />
                  </div>
                ) : (
                  <span className="send-feedback-placeholder" aria-hidden="true">Ready</span>
                )}
              </div>
            )}

            <div inert={!keyed.armed} hidden={Boolean(spotlightFeedback && !spotlightFeedback.correct)}>
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
    </SessionFrame>
  )

}
