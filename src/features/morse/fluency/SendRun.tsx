import { LEVEL_REASON_LETTERS } from '../../../domain/morse/modes'
import { correctionLetter } from '../../../domain/morse/correction'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MORSE_LETTERS, decodePattern, type MorseLetter } from '../../../domain/morse/code'
import { judgeCopy, type CopyJudgement } from '../../../domain/morse/fluency/copy'
import {
  FREE_LETTER_PAUSE_MS,
  addPattern,
  addSpace,
  type FreeToken,
} from '../../../domain/morse/fluency/freePlay'
import {
  SEND_STAGE_INFO,
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
import { MorseCharacterSupport } from '../MorseCharacterSupport'
import { useMorseAudio } from '../useMorseAudio'
import { SessionFrame, SessionCorrect, RoundResult } from '../../../shared/ui/SessionFrame'
import './SendRun.css'

interface SendRunProps {
  stage: SendStage
  progress: MorseFluencyProgress
  onProgress: (next: MorseFluencyProgress) => void
  onStage: (stage: SendStage) => void
  onExit: () => void
  /** Characters material may contain (#257): the taught roster before acquisition; absent, no limit. */
  allowed?: ReadonlySet<string>
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
  allowed,
  seed,
}: SendRunProps) {
  const [runSeed] = useState(() => seed ?? 0)
  const prompts = useMemo(() => sendPrompts(stage, runSeed, allowed), [allowed, runSeed, stage])
  const meta = SEND_STAGE_INFO[stage]
  const correctionAudio = useMorseAudio()

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

  function continueSpotlightCorrection() {
    correctionAudio.stop()
    keyed.acknowledge()
  }

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
    correctionAudio.stop()
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

  if (prompts.length === 0) {
    return <SessionFrame kind="key" title="Key" onClose={onExit}>
      <h1>{LEVEL_REASON_LETTERS}</h1>
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
          <h1 className={review.correct ? 'is-correct' : undefined}>
            {review.correct ? 'Received as sent' : 'Compare what arrived'}
          </h1>
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
          <h1 className="sr-only">Send {target} in Morse.</h1>
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
            <div className="send-feedback-slot" aria-live="assertive">
              {spotlightFeedback ? (
                <div className={`send-feedback ${spotlightFeedback.correct ? 'is-correct' : 'is-wrong'}`}>
                  {spotlightFeedback.correct ? <SessionCorrect target={spotlightFeedback.letter} announce={false} /> : <strong>Miss</strong>}
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
    </SessionFrame>
  )
}
