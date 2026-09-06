import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'motion/react'
import { useLibrary } from '../../lib/store'
import { resolveAttempt, type Resolution } from '../../lib/scheduling'
import { statusLabel } from '../../components/ui/StatusTag'
import {
  expectedAnswer,
  morseAcquisitionProfile,
  type AcquisitionCharacter,
  type AcquisitionProfile,
} from '../../lib/acquisition'
import { isAssistedRung, mergeItemEvidence, recordAnswer, rungFor } from '../../lib/cueLadder'
import { selectDistractors } from '../../lib/distractors'
import { retentionCorrectCount, type AttemptAnswer } from '../../lib/items'
import type { Item, ItemCueEvidence, ItemEvidenceStore, Topic } from '../../lib/types'
import { ProgressiveCard, type ProgressiveAnswer } from './ProgressiveCard'
import { testCardTextClass } from './textScale'
import {
  SWIPE_CUE_FULL_PX,
  isTokenRecallDeck,
  swipeCommitDistance,
  swipeIntent,
  type SwipeGrade,
} from './swipeGrade'
import './Session.css'

/** Alternatives on a choice rung: the answer plus three distractors. */
const CHOICE_OPTIONS = 4

/** How far past its own width a committed card travels before it is gone. */
const EXIT_OVERSHOOT_PX = 140

/** Fallback width when nothing has been measured yet, e.g. before first layout. */
const ASSUMED_CARD_WIDTH = 360

interface Card {
  topicId: string
  topicTitle: string
  item: Item
  /** Present only for a topic the acquisition ladder recognises. */
  character?: AcquisitionCharacter
}

interface SessionProps {
  topicIds: string[]
  onExit: () => void
}

function shuffle<T>(list: T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * What is on screen, as one indivisible value.
 *
 * Answer confidentiality is a property of this shape, not of a transition
 * duration. `index` and the reveal state are the same atom, so no render —
 * batched, interrupted, re-entered or replayed — can pair the next card's
 * index with a state that mounts an answer. A graded card holds `index` for
 * the whole of its exit; the only move to the next index is to `asking`, and
 * `asking` mounts no answer text at all.
 */
type View =
  | { kind: 'asking'; index: number }
  | { kind: 'revealed'; index: number }
  | { kind: 'exiting'; index: number; grade: SwipeGrade }
  | { kind: 'done' }

type Phase = View['kind']

function haptic(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Haptics are optional feedback and never block a Test.
  }
}

export function Session({ topicIds, onExit }: SessionProps) {
  const { topics, upsertTopic } = useLibrary()

  // Snapshot the topics and deck at session start. A bankable attempt always
  // runs every item in a topic; fast interaction must not weaken the boundary.
  const [included] = useState<Topic[]>(() =>
    topicIds.map((id) => topics.find((t) => t.id === id)).filter(Boolean) as Topic[],
  )
  // Which topics the acquisition ladder drives. Every other topic keeps the
  // reveal-and-self-score card exactly as it is.
  const [profiles] = useState<Map<string, AcquisitionProfile>>(() => {
    const found = new Map<string, AcquisitionProfile>()
    for (const topic of included) {
      const profile = morseAcquisitionProfile(topic)
      if (profile) found.set(topic.id, profile)
    }
    return found
  })

  // Which self-score topics grade by swipe alone. Decided once, from content,
  // so the affordance can never change part-way through a deck.
  const [swipeTopics] = useState<Set<string>>(
    () => new Set(included.filter((topic) => isTokenRecallDeck(topic.items)).map((topic) => topic.id)),
  )

  const [deck] = useState<Card[]>(() =>
    included.flatMap((topic) => {
      const profile = profiles.get(topic.id)
      return shuffle(
        topic.items.map((item) => ({
          topicId: topic.id,
          topicTitle: topic.title,
          item,
          ...(profile && item.id ? { character: profile.get(item.id) } : {}),
        })),
      )
    }),
  )

  // Cue evidence accrued this session, held apart from the scheduler's tally
  // and merged into the topic separately from any status resolution.
  const [cueEvidence, setCueEvidence] = useState<Record<string, ItemEvidenceStore>>({})
  // What this attempt actually asked and how it was supported, per topic. The
  // merged evidence store cannot answer that: it is a lifetime tally and only
  // ever grows, so read alone it says "has ever" where the completion gate has
  // to ask "did, in this run". Discarded with the attempt on an early exit,
  // exactly like the tally, because it is part of the attempt and not evidence.
  const attemptAnswers = useRef<Record<string, AttemptAnswer[]>>({})

  const [view, setView] = useState<View>({ kind: 'asking', index: 0 })
  const [tally, setTally] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 })
  const [resolutions, setResolutions] = useState<Resolution[]>([])
  const [confirmingExit, setConfirmingExit] = useState(false)
  /** Which grade the current drag has travelled far enough to commit. */
  const [armed, setArmed] = useState<SwipeGrade | null>(null)
  const [dragging, setDragging] = useState(false)
  const [cardWidth, setCardWidth] = useState(0)

  const cardRef = useRef<HTMLButtonElement>(null)
  const yesRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  // The view as of this instant, not as of the last committed render. Grading
  // reads it so two events in one React batch cannot both see `revealed`.
  const viewRef = useRef<View>(view)
  viewRef.current = view
  // Closed the moment a grade is taken, reopened only when the next card is up.
  const gradeLock = useRef(false)

  const phase: Phase = view.kind
  const index = view.kind === 'done' ? deck.length : view.index
  const card: Card | undefined = deck[index]
  /** The answer is mounted only while the card that owns it owns the screen. */
  const answerVisible = view.kind === 'revealed' || view.kind === 'exiting'
  const swipeFirst = card ? swipeTopics.has(card.topicId) : false
  const cardKey = card ? `${card.topicId}-${card.item.id ?? 'item'}-${index}` : 'empty'

  const reduced = useReducedMotion() ?? false
  const x = useMotionValue(0)
  const commitDistance = swipeCommitDistance(cardWidth || ASSUMED_CARD_WIDTH)
  const commitDistanceRef = useRef(commitDistance)
  commitDistanceRef.current = commitDistance

  const rotate = useTransform(x, [-320, 320], [-7, 7], { clamp: true })
  const missStrength = useTransform(x, [-SWIPE_CUE_FULL_PX, -8, 0], [1, 0, 0])
  const hitStrength = useTransform(x, [0, 8, SWIPE_CUE_FULL_PX], [0, 0, 1])

  // Crossing the commit distance is a discrete, announced-to-the-eye event
  // rather than one more increment of opacity, so a release is predictable.
  useMotionValueEvent(x, 'change', (latest) => {
    if (viewRef.current.kind !== 'revealed') return
    const distance = commitDistanceRef.current
    const next: SwipeGrade | null =
      latest <= -distance ? 'incorrect' : latest >= distance ? 'correct' : null
    setArmed((previous) => (previous === next ? previous : next))
  })

  useLayoutEffect(() => {
    const node = cardRef.current
    if (!node) return
    const measure = () => setCardWidth(node.offsetWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [cardKey])

  useEffect(() => {
    if (deck[index]?.character) return
    // A swipe deck keeps focus on the card itself: the card is the control.
    if (view.kind === 'asking') cardRef.current?.focus({ preventScroll: true })
    else if (view.kind === 'revealed' && !swipeFirst) yesRef.current?.focus({ preventScroll: true })
  }, [deck, index, view.kind, swipeFirst])

  useEffect(() => {
    if (phase === 'done') headingRef.current?.focus()
  }, [phase])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      // A ladder card owns its own keys; reveal/self-score does not apply to it.
      if (deck[index]?.character) return

      if (view.kind === 'asking' && (event.key === ' ' || event.key === 'Enter')) {
        event.preventDefault()
        reveal()
      } else if (view.kind === 'revealed' && (event.key === 'ArrowLeft' || event.key === '1')) {
        event.preventDefault()
        commitGrade('incorrect')
      } else if (view.kind === 'revealed' && (event.key === 'ArrowRight' || event.key === '2')) {
        event.preventDefault()
        commitGrade('correct')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, deck, index])

  const topicPosition = useMemo(() => {
    if (!card) return { current: 0, of: 0 }
    const cards = deck.filter((candidate) => candidate.topicId === card.topicId)
    const first = deck.findIndex((candidate) => candidate.topicId === card.topicId)
    return { current: index - first + 1, of: cards.length }
  }, [card, deck, index])

  // Alternatives are chosen per card: evidence-driven, stage-aware, and
  // recomputed only when the card changes so they do not reshuffle mid-answer.
  const options = useMemo(() => {
    if (!card?.character) return []
    const rung = rungFor(card.item, evidenceFor(card))
    if (rung.response !== 'choice') return []
    const topic = included.find((candidate) => candidate.id === card.topicId)
    const distractors = selectDistractors({
      target: card.item,
      pool: topic?.items ?? [],
      evidence: { ...(topic?.itemEvidence ?? {}), ...(cueEvidence[card.topicId] ?? {}) },
      count: CHOICE_OPTIONS - 1,
    })
    return shuffle([expectedAnswer(rung, card.character), ...distractors.map((item) => item.answer)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  function bank(
    topicId: string,
    attempt: { correct: number; total: number },
    evidence: ItemEvidenceStore,
  ) {
    const topic = included.find((candidate) => candidate.id === topicId)
    if (!topic) return
    // The scheduler resolves the attempt exactly as it always has. Cue evidence
    // is merged in afterwards, as a separate field, and changes nothing the
    // resolution decided.
    const mergedEvidence = { ...(topic.itemEvidence ?? {}), ...evidence }
    // Acquisition evidence remains separate state. It is used here only as a
    // safety gate: neither an incomplete direction nor a supported answer can be
    // presented to the unchanged scheduler as a passing attempt for a
    // bidirectional boundary. The attempt's own answers are passed alongside the
    // store so a run carried by cued history cannot bank a claim of independent
    // recall (#68).
    const schedulerCorrect = retentionCorrectCount(
      topic.items,
      mergedEvidence,
      attempt.correct,
      attemptAnswers.current[topicId] ?? [],
    )
    const resolution = resolveAttempt(topic, schedulerCorrect, attempt.total)
    upsertTopic(mergeItemEvidence(resolution.topic, evidence))
    setResolutions((previous) => [...previous, resolution])
  }

  function evidenceFor(card: Card): ItemCueEvidence | undefined {
    if (!card.item.id) return undefined
    const topic = included.find((candidate) => candidate.id === card.topicId)
    return cueEvidence[card.topicId]?.[card.item.id] ?? topic?.itemEvidence?.[card.item.id]
  }

  function noteAnswer(card: Card, answer: ProgressiveAnswer): ItemEvidenceStore {
    const topicStore = cueEvidence[card.topicId] ?? {}
    const itemId = card.item.id
    if (!itemId) return topicStore

    const rung = rungFor(card.item, evidenceFor(card))
    // What the card showed decides whether this counts as independent recall.
    // It is taken from the rung that is on screen rather than restated here, so
    // the two can never disagree.
    const assisted = isAssistedRung(rung)
    const next = {
      ...topicStore,
      [itemId]: recordAnswer(evidenceFor(card), {
        direction: rung.direction,
        correct: answer.correct,
        assisted,
        // Recorded from the first session, and read by nothing that decides
        // anything. It exists so a threshold can one day be more than a guess.
        latencyMs: answer.latencyMs,
        at: new Date().toISOString(),
      }),
    }
    attemptAnswers.current = {
      ...attemptAnswers.current,
      [card.topicId]: [
        ...(attemptAnswers.current[card.topicId] ?? []),
        { itemId, direction: rung.direction, correct: answer.correct, assisted },
      ],
    }
    setCueEvidence((previous) => ({ ...previous, [card.topicId]: next }))
    return next
  }

  function reveal() {
    if (viewRef.current.kind !== 'asking') return
    const next: View = { kind: 'revealed', index: viewRef.current.index }
    viewRef.current = next
    setView(next)
    haptic(8)
  }

  /**
   * Bank one answer against the attempt. This is the whole of the scoring
   * contract and it is deliberately separate from moving the card: the score
   * is taken the instant the grade is committed, while the card that earned it
   * is still the card on screen.
   */
  function recordGrade(at: number, correct: boolean, evidence?: ItemEvidenceStore) {
    const current = deck[at]
    if (!current) return

    const next = { correct: tally.correct + (correct ? 1 : 0), total: tally.total + 1 }
    const following = deck[at + 1]
    const topicFinished = !following || following.topicId !== current.topicId

    if (topicFinished) {
      bank(current.topicId, next, evidence ?? cueEvidence[current.topicId] ?? {})
      setTally({ correct: 0, total: 0 })
    } else {
      setTally(next)
    }
  }

  /**
   * Take the grade and start the outgoing transition. The index does not move
   * here, so nothing about the next card — least of all its answer — becomes
   * reachable while the graded card is still on screen.
   */
  function commitGrade(grade: SwipeGrade) {
    // One physical gesture, one grade. The lock closes the window React
    // batching leaves open, where two events in a single tick would both still
    // read the view as `revealed`.
    if (gradeLock.current) return
    if (viewRef.current.kind !== 'revealed') return
    const at = viewRef.current.index
    if (!deck[at]) return

    gradeLock.current = true
    // Hold the armed cue through the exit: the card is leaving *as* this grade,
    // and dropping back to the un-armed treatment at the moment of commit would
    // read as the gesture having been let go of.
    setArmed(grade)
    setDragging(false)
    haptic(grade === 'correct' ? 12 : [10, 24, 10])
    recordGrade(at, grade === 'correct')

    const next: View = { kind: 'exiting', index: at, grade }
    viewRef.current = next
    setView(next)
  }

  /** The next prompt becomes active only from here: after the exit completed. */
  function advance() {
    if (viewRef.current.kind !== 'exiting') return
    const at = viewRef.current.index
    x.set(0)
    setArmed(null)
    setDragging(false)
    gradeLock.current = false
    const next: View = deck[at + 1] ? { kind: 'asking', index: at + 1 } : { kind: 'done' }
    viewRef.current = next
    setView(next)
  }

  /**
   * A ladder answer is objectively graded rather than self-scored, but it feeds
   * the identical tally: the scheduler still sees one clean run of every item
   * in the topic, and `PASS_THRESHOLD` is untouched.
   */
  function answerProgressive(answer: ProgressiveAnswer) {
    if (viewRef.current.kind === 'done') return
    const at = viewRef.current.index
    const current = deck[at]
    if (!current) return
    haptic(answer.correct ? 12 : [10, 24, 10])
    recordGrade(at, answer.correct, noteAnswer(current, answer))
    const next: View = deck[at + 1] ? { kind: 'asking', index: at + 1 } : { kind: 'done' }
    viewRef.current = next
    setView(next)
  }

  function settleDrag(info: PanInfo) {
    setDragging(false)
    if (viewRef.current.kind !== 'revealed') return
    const width = cardRef.current?.offsetWidth || cardWidth || ASSUMED_CARD_WIDTH
    const grade = swipeIntent({
      offsetX: info.offset.x,
      offsetY: info.offset.y,
      velocityX: info.velocity.x,
      velocityY: info.velocity.y,
      width,
    })

    if (!grade) {
      // Ambiguous, vertical, or let go on the way back: no score, and the card
      // returns to rest under its own spring rather than snapping.
      setArmed(null)
      animate(x, 0, reduced ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 38 })
      return
    }

    commitGrade(grade)
  }

  /**
   * Leaving early discards the partial *attempt*, exactly as it always has:
   * a topic banks only once every item has been through. Cue evidence is not
   * part of that contract — it is acquisition state, not retention state — so
   * it is written out rather than thrown away with the attempt.
   */
  function exitSession() {
    const banked = new Set(resolutions.map((resolution) => resolution.topic.id))
    for (const [topicId, store] of Object.entries(cueEvidence)) {
      if (banked.has(topicId)) continue
      const live = topics.find((candidate) => candidate.id === topicId)
      if (live) upsertTopic(mergeItemEvidence(live, store))
    }
    onExit()
  }

  function requestExit() {
    if (tally.total > 0) setConfirmingExit(true)
    else exitSession()
  }

  if (deck.length === 0) {
    return (
      <section className="session">
        <h1>Nothing to run</h1>
        <p>These topics have no items yet. Add items to a topic and it will come back to Today.</p>
        <button type="button" onClick={onExit}>
          Back to today
        </button>
      </section>
    )
  }

  if (view.kind === 'done' || !card) {
    return <TestDone resolutions={resolutions} onExit={onExit} headingRef={headingRef} />
  }

  if (confirmingExit) {
    return (
      <section className="session">
        <h1>End test</h1>
        <p>
          {tally.total} {tally.total === 1 ? 'answer' : 'answers'} on{' '}
          <strong>{card.topicTitle}</strong> will be discarded, because a topic only counts once
          every one of its items has been through. Topics you already finished are banked and will
          not be lost.
        </p>
        <div className="rate">
          <button className="ghost" type="button" onClick={() => setConfirmingExit(false)}>
            Keep going
          </button>
          <button className="danger" type="button" onClick={exitSession}>
            End test
          </button>
        </div>
      </section>
    )
  }

  if (card.character) {
    const rung = rungFor(card.item, evidenceFor(card))
    return (
      <section className="session rapid-session is-graded is-progressive">
        <div className="session-bar">
          <p>
            <span className="session-topic">{card.topicTitle}</span>
            <span className="tabular">
              Test · {topicPosition.current} of {topicPosition.of}
            </span>
          </p>
          <button className="ghost small" type="button" onClick={requestExit}>
            End test
          </button>
        </div>

        <ProgressiveCard
          key={`${card.topicId}-${card.item.id}-${index}`}
          cardKey={`${card.topicId}-${card.item.id}-${index}`}
          character={card.character}
          rung={rung}
          options={options}
          onAnswer={answerProgressive}
        />
      </section>
    )
  }

  const exiting = view.kind === 'exiting'
  const gradable = view.kind === 'revealed'
  const exitTarget = exiting
    ? (view.grade === 'correct' ? 1 : -1) * ((cardWidth || ASSUMED_CARD_WIDTH) + EXIT_OVERSHOOT_PX)
    : 0
  // The card leaves under a spring, but it is off screen long before the spring
  // has finished being precise about it, so the rest thresholds are coarse: the
  // next card waits on the animation ending, and nothing is served by making it
  // wait longer. Reduced motion removes the transition rather than the grade.
  const exitTransition = reduced
    ? { duration: 0 }
    : {
        x: { type: 'spring' as const, stiffness: 420, damping: 40, restDelta: 6, restSpeed: 40 },
        opacity: { duration: 0.22, ease: 'easeOut' as const },
      }

  return (
    <section
      className={`session rapid-session is-graded${swipeFirst ? ' is-swipe-graded' : ''}`}
      aria-labelledby="prompt-heading"
    >
      <div className="session-bar">
        <p>
          <span className="session-topic">{card.topicTitle}</span>
          <span className="tabular">
            Test · {topicPosition.current} of {topicPosition.of}
          </span>
        </p>
        <button className="ghost small" type="button" onClick={requestExit}>
          End test
        </button>
      </div>

      <h1 id="prompt-heading" className="sr-only">
        {card.item.prompt}
      </h1>

      <div className={`card-stage${armed ? ` is-armed is-armed-${armed}` : ''}`}>
        <motion.span className="grade-cue grade-cue-miss" style={{ opacity: missStrength }} aria-hidden="true">
          <span className="grade-cue-arrow">←</span>
          Incorrect
        </motion.span>
        <motion.span className="grade-cue grade-cue-hit" style={{ opacity: hitStrength }} aria-hidden="true">
          Correct
          <span className="grade-cue-arrow">→</span>
        </motion.span>

        <motion.button
          key={cardKey}
          ref={cardRef}
          className={`flip-card${answerVisible ? ' is-revealed' : ''}${dragging ? ' is-dragging' : ''}`}
          type="button"
          onClick={reveal}
          drag={gradable ? 'x' : false}
          dragDirectionLock
          dragMomentum={false}
          onDragStart={() => setDragging(true)}
          onDragEnd={(_event, info) => settleDrag(info)}
          style={{ x, rotate: reduced ? 0 : rotate }}
          animate={exiting ? { x: exitTarget, opacity: 0 } : false}
          transition={exitTransition}
          onAnimationComplete={advance}
          aria-expanded={answerVisible}
          aria-label={
            answerVisible
              ? `Answer: ${card.item.answer}`
              : `Prompt: ${card.item.prompt}. Reveal answer.`
          }
        >
          <span className="flip-inner">
            <span className="flip-face flip-front">
              <span className="flip-label">Tap to reveal</span>
              <span className={`flip-value${testCardTextClass(card.item.prompt)}`}>
                {card.item.prompt}
              </span>
            </span>
            <span className="flip-face flip-back">
              <motion.span className="flip-wash flip-wash-miss" style={{ opacity: missStrength }} aria-hidden="true" />
              <motion.span className="flip-wash flip-wash-hit" style={{ opacity: hitStrength }} aria-hidden="true" />
              <span className="flip-label">Answer</span>
              {/* The answer text exists in the document only while this card is
                  revealed or leaving. An unrevealed card has no answer to leak. */}
              <span className={`flip-value flip-value-answer${testCardTextClass(card.item.answer)}`}>
                {answerVisible ? card.item.answer : ''}
              </span>
            </span>
          </span>
        </motion.button>
      </div>

      <p className="sr-only" aria-live="polite">
        {view.kind === 'revealed'
          ? `Answer: ${card.item.answer}.`
          : view.kind === 'exiting'
            ? `Marked ${view.grade === 'correct' ? 'correct' : 'incorrect'}.`
            : `Prompt: ${card.item.prompt}.`}
      </p>

      {swipeFirst ? (
        <div className={`grade-hint${answerVisible ? ' is-visible' : ''}`}>
          {/* Swipe is never the only way to grade. These carry the same two
              actions for keyboard and screen-reader use; they are out of the
              visual layout until focused, so nothing is hidden from a person
              who reaches them. */}
          <button
            className="grade-fallback"
            type="button"
            tabIndex={gradable ? 0 : -1}
            aria-hidden={!gradable}
            onClick={() => commitGrade('incorrect')}
          >
            Mark incorrect
          </button>
          <p className="grade-hint-rail" aria-hidden="true">
            <span className="grade-hint-side is-miss">← Incorrect</span>
            <span className="grade-hint-side is-hit">Correct →</span>
          </p>
          <button
            ref={yesRef}
            className="grade-fallback"
            type="button"
            tabIndex={gradable ? 0 : -1}
            aria-hidden={!gradable}
            onClick={() => commitGrade('correct')}
          >
            Mark correct
          </button>
        </div>
      ) : (
        <div className={`recall-actions${answerVisible ? ' is-visible' : ''}`} aria-hidden={!gradable}>
          <button
            className="ghost recall-miss"
            type="button"
            tabIndex={gradable ? 0 : -1}
            onClick={() => commitGrade('incorrect')}
          >
            Didn’t get it
          </button>
          <button
            ref={yesRef}
            type="button"
            tabIndex={gradable ? 0 : -1}
            onClick={() => commitGrade('correct')}
          >
            Got it
          </button>
        </div>
      )}

      <p className="recall-shortcuts">
        {answerVisible
          ? swipeFirst
            ? 'Swipe the card, or press ← and →'
            : 'Or press ← and →'
          : 'Tap the card or press Space'}
      </p>
    </section>
  )
}
function TestDone({
  resolutions,
  onExit,
  headingRef,
}: {
  resolutions: Resolution[]
  onExit: () => void
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  const completed = resolutions.filter((resolution) => resolution.completed)
  const decayed = resolutions.filter((resolution) => resolution.decayed)
  const changed = resolutions.filter(
    (resolution) => !resolution.completed && !resolution.decayed && resolution.to !== resolution.from,
  )
  const held = resolutions.filter(
    (resolution) => !resolution.completed && !resolution.decayed && resolution.to === resolution.from,
  )

  return (
    <section className="session session-done">
      <h1 ref={headingRef} tabIndex={-1}>
        {completed.length > 0 ? 'Banked' : 'Test ended'}
      </h1>

      {completed.map((resolution) => (
        <div className="banked" key={resolution.topic.id}>
          <span className="kicker">Completed</span>
          <p className="banked-title">{resolution.topic.title}</p>
          <p className="banked-note">
            Recalled cleanly {resolution.gapDays} days after it was last drilled. It is now part of
            your permanent record.
          </p>
        </div>
      ))}

      {decayed.map((resolution) => (
        <p className="transition" key={resolution.topic.id}>
          <strong>{resolution.topic.title}</strong> did not survive its spot check, so it goes back
          to drilling. Your completion from{' '}
          {resolution.topic.completedAt
            ? new Date(resolution.topic.completedAt).toLocaleDateString()
            : 'the original run'}{' '}
          still stands.
        </p>
      ))}

      {changed.map((resolution) => (
        <p className="transition" key={resolution.topic.id}>
          <strong>{resolution.topic.title}</strong>: {statusLabel(resolution.from).toLowerCase()} to{' '}
          {statusLabel(resolution.to).toLowerCase()}.
          {resolution.from === 'drilled' && resolution.to === 'learning' && (
            <> The delayed test starts again once it is drilled clean.</>
          )}
        </p>
      ))}

      {held.map((resolution) => (
        <p className="transition" key={resolution.topic.id}>
          <strong>{resolution.topic.title}</strong> held at {statusLabel(resolution.to).toLowerCase()}.
        </p>
      ))}

      {resolutions.length === 0 && (
        <p className="transition">No topic ran to the end, so nothing changed rung.</p>
      )}

      <button type="button" onClick={onExit}>
        Back to today
      </button>
    </section>
  )
}
