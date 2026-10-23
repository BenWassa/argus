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
  recordFluencyBest,
  type MorseFluencyProgress,
} from '../../../domain/morse/fluency/progress'
import {
  SEND_STAGE_INFO,
  sendBestKey,
  sendPrompts,
  sendRunScore,
  type SendStage,
} from '../../../domain/morse/fluency/send'
import { fire } from '../../../shared/haptics'
import { useKeyedResponse } from '../input/useKeyedResponse'
import { useMorseAudio } from '../useMorseAudio'
export interface SendRunProps {
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
export function useSendRun({ stage, progress, onProgress, allowed, seed }: SendRunProps) {
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
    pattern: string
  } | null>(null)

  // Open-ended flow state.
  const [tokens, setTokens] = useState<FreeToken[]>([])
  const tokensRef = useRef<FreeToken[]>([])
  const [entry, setEntry] = useState('')
  const entryRef = useRef('')
  const [advanceToken, setAdvanceToken] = useState(0)
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const target = prompts[promptIndex] ?? ''

  const beginReview = useCallback((judgement: CopyJudgement, emitVerdict = true) => {
    setReview(judgement)
    setPhase('review')
    // Spotlight has already graded each keyed character, including its final
    // word boundary. Flow has only this one whole-prompt judgement.
    if (emitVerdict) fire(judgement.correct ? 'word' : 'miss')
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

    beginReview(judgeCopy(word, spotlightGivenRef.current), false)
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
      // A separator is not a graded answer or a successful character.
      setFlowTokens(next)
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
    setSpotlightFeedback({ correct, letter, pattern })
    // The final correct character earns one word-level verdict only when the
    // entire word is correct. No second verdict on the review transition.
    const wordComplete = characterIndex === word.length - 1 && nextGiven === word
    fire(correct ? (wordComplete ? 'word' : 'settle') : 'miss')
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
    // A first run is a baseline, not a personal best; finishing without an
    // improvement is not another word judgement or a milestone.
    if (recorded.improved && progress.bests[sendBestKey(stage)] !== undefined) fire('crest')
  }


  return { prompts, meta, correctionAudio, phase, promptIndex, judgements, review, done, characterIndex, spotlightGiven, spotlightFeedback, tokens, entry, advanceToken, target, keyed, continueSpotlightCorrection, clearPause, commitPattern, onFlowEntry, addWordGap, answerSpotlight, finishMessage, nextFromReview }
}
