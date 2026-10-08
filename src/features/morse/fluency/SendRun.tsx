import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MORSE_LETTERS, decodePattern, type MorseLetter } from '../../../domain/morse/code'
import { canonicalPattern } from '../../../domain/morse/testing/acquisitionProfile'
import { judgeCopy, type CopyJudgement } from '../../../domain/morse/fluency/copy'
import {
  FREE_LETTER_PAUSE_MS,
  addPattern,
  addSpace,
  type FreeToken,
} from '../../../domain/morse/fluency/freePlay'
import {
  SEND_STAGE_INFO,
  nextSendStage,
  sendBestKey,
  sendPrompts,
  sendRunScore,
  type SendStage,
} from '../../../domain/morse/fluency/send'
import {
  recordFluencyBest,
  type MorseFluencyProgress,
} from '../../../domain/morse/fluency/progress'
import { fire } from '../../../shared/haptics'
import { MORSE_MAX_ELEMENTS, MorseKeyInput } from '../input/MorseKeyInput'
import { useKeyedResponse } from '../input/useKeyedResponse'
import './SendRun.css'

interface SendRunProps {
  stage: SendStage
  progress: MorseFluencyProgress
  onProgress: (next: MorseFluencyProgress) => void
  onStage: (stage: SendStage) => void
  onExit: () => void
  /** Deterministic injection for unit tests. One run otherwise gets one seed at mount. */
  seed?: number
}

type RunPhase = 'sending' | 'review' | 'done'

interface DoneState {
  score: number
  improved: boolean
}

function flowText(tokens: readonly FreeToken[]): string {
  return tokens
    .map((token) => (token.kind === 'space' ? ' ' : token.character ?? '?'))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

function nonSpaceTokens(tokens: readonly FreeToken[]): number {
  return tokens.filter((token) => token.kind === 'character').length
}

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
  const [runSeed] = useState(() => seed ?? Date.now())
  const prompts = useMemo(() => sendPrompts(stage, runSeed), [runSeed, stage])
  const meta = SEND_STAGE_INFO[stage]

  const [phase, setPhase] = useState<RunPhase>('sending')
  const [promptIndex, setPromptIndex] = useState(0)
  const [judgements, setJudgements] = useState<CopyJudgement[]>([])
  const [review, setReview] = useState<CopyJudgement | null>(null)
  const [done, setDone] = useState<DoneState | null>(null)

  // Spotlight state.
  const [characterIndex, setCharacterIndex] = useState(0)
  const [spotlightGiven, setSpotlightGiven] = useState('')
  const spotlightGivenRef = useRef('')
  const [spotlightFeedback, setSpotlightFeedback] = useState<{
    correct: boolean
    letter: MorseLetter
  } | null>(null)

  // Open-ended flow state.
  const [tokens, setTokens] = useState<FreeToken[]>([])
  const tokensRef = useRef<FreeToken[]>([])
  const [entry, setEntry] = useState('')
  const entryRef = useRef('')
  const [advanceToken, setAdvanceToken] = useState(0)
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const target = prompts[promptIndex] ?? ''

  const beginReview = useCallback((judgement: CopyJudgement) => {
    setReview(judgement)
    setPhase('review')
    fire(judgement.correct ? 'word' : 'miss')
  }, [])

  const keyed = useKeyedResponse(() => {
    if (meta.interaction !== 'spotlight') return
    const word = prompts[promptIndex]
    if (!word) return

    setSpotlightFeedback(null)
    if (characterIndex + 1 < word.length) {
      setCharacterIndex((current) => current + 1)
      return
    }

    beginReview(judgeCopy(word, spotlightGivenRef.current))
  })

  const clearPause = useCallback(() => {
    if (pauseTimer.current !== null) clearTimeout(pauseTimer.current)
    pauseTimer.current = null
  }, [])

  useEffect(() => clearPause, [clearPause])

  const setFlowTokens = useCallback((next: FreeToken[]) => {
    tokensRef.current = next
    setTokens(next)
  }, [])

  const clearFlow = useCallback(() => {
    clearPause()
    tokensRef.current = []
    setTokens([])
    entryRef.current = ''
    setEntry('')
    setAdvanceToken((value) => value + 1)
  }, [clearPause])

  const finishFlowPrompt = useCallback((withTokens?: readonly FreeToken[]) => {
    const finalTokens = withTokens ?? tokensRef.current
    beginReview(judgeCopy(target, flowText(finalTokens)))
  }, [beginReview, target])

  const commitPattern = useCallback((pattern: string): FreeToken[] => {
    clearPause()
    if (!pattern || phase !== 'sending') return [...tokensRef.current]

    entryRef.current = ''
    setEntry('')
    const next = addPattern(tokensRef.current, pattern)
    setFlowTokens(next)
    setAdvanceToken((value) => value + 1)

    // Word Flow has no explicit submit control. Once the learner has sent the
    // same number of letter units as the target, review the whole transmission.
    // The key did not know any individual answer length; a pause ended each one.
    if (
      stage === 'flow' &&
      !target.includes(' ') &&
      nonSpaceTokens(next) >= target.length
    ) {
      finishFlowPrompt(next)
    }

    return next
  }, [clearPause, finishFlowPrompt, phase, setFlowTokens, stage, target])

  const finishLetter = useCallback((): FreeToken[] => {
    clearPause()
    const pattern = entryRef.current
    if (!pattern) return [...tokensRef.current]
    return commitPattern(pattern)
  }, [clearPause, commitPattern])

  const onFlowEntry = useCallback((next: string) => {
    entryRef.current = next
    setEntry(next)
    clearPause()
    pauseTimer.current = setTimeout(finishLetter, FREE_LETTER_PAUSE_MS)
  }, [clearPause, finishLetter])

  const addWordGap = useCallback(() => {
    if (phase !== 'sending') return
    const current = finishLetter()
    const next = addSpace(current)
    if (next.length !== current.length) {
      setFlowTokens(next)
      fire('settle')
    }
  }, [finishLetter, phase, setFlowTokens])

  function answerSpotlight(pattern: string) {
    if (meta.interaction !== 'spotlight' || !keyed.armed) return
    const word = prompts[promptIndex]
    const letter = word?.[characterIndex] as MorseLetter | undefined
    if (!letter) return

    const correct = pattern === MORSE_LETTERS[letter]
    const decoded = decodePattern(pattern) ?? '?'
    const nextGiven = `${spotlightGivenRef.current}${decoded}`
    spotlightGivenRef.current = nextGiven
    setSpotlightGiven(nextGiven)
    setSpotlightFeedback({ correct, letter })
    fire(correct ? 'settle' : 'miss')
    keyed.answered(correct)
  }

  function finishMessage() {
    if (phase !== 'sending') return
    const current = finishLetter()
    if (current.length === 0) return
    finishFlowPrompt(current)
  }

  function resetForNextPrompt() {
    setReview(null)
    setPhase('sending')
    setCharacterIndex(0)
    spotlightGivenRef.current = ''
    setSpotlightGiven('')
    setSpotlightFeedback(null)
    keyed.reset()
    clearFlow()
  }

  function nextFromReview() {
    if (!review) return
    const all = [...judgements, review]
    if (promptIndex + 1 < prompts.length) {
      setJudgements(all)
      setPromptIndex((current) => current + 1)
      resetForNextPrompt()
      return
    }

    const score = sendRunScore(all)
    const recorded = recordFluencyBest(progress, sendBestKey(stage), score)
    onProgress(recorded.progress)
    setJudgements(all)
    setDone({ score, improved: recorded.improved })
    setPhase('done')
    fire(recorded.improved ? 'crest' : 'word')
  }

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
          <button className="ghost small" type="button" onClick={onExit}>Fluency</button>
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
              Back to Fluency
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
          <button className="ghost small" type="button" onClick={onExit}>Fluency</button>
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
        <button className="ghost small" type="button" onClick={onExit}>Fluency</button>
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
                      <span>
                        {spotlightFeedback.letter} is{' '}
                        <span className="mono">
                          {canonicalPattern(MORSE_LETTERS[spotlightFeedback.letter])}
                        </span>
                      </span>
                      <button
                        className="ghost small"
                        type="button"
                        onClick={keyed.acknowledge}
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
