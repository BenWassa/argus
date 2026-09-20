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
import { useLibrary } from '../../services/library/LibraryProvider'
import { applyResolution } from '../../domain/study/scheduling'
import {
  isAssistedRung,
  mergeItemEvidence,
  recordAnswer,
  rungFor,
  withBaselineCue,
} from '../../domain/study/cueLadder'
import type { AttemptAnswer } from '../../domain/library/items'
import { registerBackBlocker } from '../../app/routing/history'
import type { Topic } from '../../domain/library/topic'
import type { ItemCueEvidence, ItemEvidenceStore } from '../../domain/study/evidence'
import { ProgressiveCard, type ProgressiveAnswer } from './ProgressiveCard'
import {
  acquisitionProfiles,
  buildDeck,
  openingBaselines,
  swipeDecks,
  type Card,
} from './testDeck'
import { nextView, type TestPhase, type TestView } from './testView'
import { TestDone } from './TestDone'
import { resolveBankedAttempt, type BankedAttempt } from './bankedAttempt'
import { testCardTextClass } from './textScale'
import { fire } from '../../shared/haptics'
import {
  SWIPE_CUE_FULL_PX,
  swipeCommitDistance,
  swipeIntent,
  type SwipeGrade,
} from './swipeGrade'
import './TestSession.css'

/** How far past its own width a committed card travels before it is gone. */
const EXIT_OVERSHOOT_PX = 140

/** Fallback width when nothing has been measured yet, e.g. before first layout. */
const ASSUMED_CARD_WIDTH = 360

interface TestSessionProps {
  topicIds: string[]
  onExit: () => void
  /**
   * Start a formative practice run over exactly what this check missed.
   *
   * The check is the only thing that knows. An ordinary reveal-and-grade topic
   * writes no per-item evidence, so once this component unmounts the set is
   * gone — which is why the offer is made here, with the ids in hand, rather
   * than reconstructed afterwards from state that was never stored.
   */
  onPractice?: (topicId: string, itemIds: string[]) => void
}

export function TestSession({ topicIds, onExit, onPractice }: TestSessionProps) {
  const { topics, updateTopic } = useLibrary()

  // Snapshot the topics and deck at session start. A bankable attempt always
  // runs every item in a topic; fast interaction must not weaken the boundary.
  const [included] = useState<Topic[]>(() =>
    topicIds.map((id) => topics.find((t) => t.id === id)).filter(Boolean) as Topic[],
  )
  const [baselines] = useState(() => openingBaselines(included))
  const [profiles] = useState(() => acquisitionProfiles(included))
  const [swipeTopics] = useState(() => swipeDecks(included))
  const [deck] = useState(() => buildDeck(included, profiles))

  // Cue evidence accrued this session, held apart from the scheduler's tally
  // and merged into the topic separately from any status resolution.
  const [cueEvidence, setCueEvidence] = useState<Record<string, ItemEvidenceStore>>({})
  // What this attempt actually asked and how it was supported, per topic. The
  // merged evidence store cannot answer that: it is a lifetime tally and only
  // ever grows, so read alone it says "has ever" where the completion gate has
  // to ask "did, in this run". Discarded with the attempt on an early exit,
  // exactly like the tally, because it is part of the attempt and not evidence.
  const attemptAnswers = useRef<Record<string, AttemptAnswer[]>>({})

  /**
   * Item ids answered wrong in this run, per topic, in the order they were met.
   *
   * Run bookkeeping, not evidence: it is a ref, it never reaches a topic, and
   * it dies with the component. Its only consumer is the end screen's offer to
   * practise. Every grade path funnels through `recordGrade`, so recording it
   * there covers self-scored cards and ladder cards alike — the durable
   * `itemEvidence` path covers only the latter.
   */
  const missedItems = useRef<Record<string, string[]>>({})

  const [view, setView] = useState<TestView>({ kind: 'asking', index: 0 })
  const [tally, setTally] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 })
  const [banked, setBanked] = useState<BankedAttempt[]>([])
  // The library as it stands now, not as it stood when the deck was built. A
  // lesson answer or a sibling write can land while a Test is open, and the
  // attempt should resolve against the topic that exists rather than a snapshot.
  const liveTopics = useRef(topics)
  liveTopics.current = topics
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
  const viewRef = useRef<TestView>(view)
  viewRef.current = view
  // Closed the moment a grade is taken, reopened only when the next card is up.
  const gradeLock = useRef(false)
  // Kept current without re-registering the global blocker on every answer.
  const backGuard = useRef<() => boolean>(() => false)
  backGuard.current = () => {
    if (confirmingExit) {
      setConfirmingExit(false)
      return true
    }
    if (tally.total > 0) {
      setConfirmingExit(true)
      return true
    }
    return false
  }

  useEffect(() => registerBackBlocker(() => backGuard.current()), [])

  const phase: TestPhase = view.kind
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

  function bank(
    topicId: string,
    attempt: { correct: number; total: number },
    evidence: ItemEvidenceStore,
  ) {
    const topic =
      liveTopics.current.find((candidate) => candidate.id === topicId) ??
      included.find((candidate) => candidate.id === topicId)
    if (!topic) return
    const entry = resolveBankedAttempt(
      topic,
      attempt,
      evidence,
      attemptAnswers.current[topicId] ?? [],
    )
    // Composed onto the latest topic rather than written back whole, so lesson
    // support, the active sitting and anything else earned since the deck was
    // built survive the bank.
    updateTopic(topicId, (current) =>
      mergeItemEvidence(applyResolution(current, entry.resolution), evidence),
    )
    setBanked((previous) => [...previous, entry])
  }

  /**
   * The evidence the ladder reads, with the acquisition-derived opening rung
   * applied when the item has never been tested.
   *
   * One place, so presentation and recording cannot disagree about which rung
   * this card is at, and so a supported answer can never be folded as though it
   * had been given uncued. Nothing here is written: `withBaselineCue` returns a
   * value, and `recordAnswer` is still the only path to durable evidence.
   */
  function evidenceFor(card: Card): ItemCueEvidence | undefined {
    if (!card.item.id) return undefined
    const topic = included.find((candidate) => candidate.id === card.topicId)
    const stored = cueEvidence[card.topicId]?.[card.item.id] ?? topic?.itemEvidence?.[card.item.id]
    return withBaselineCue(stored, baselines.get(card.topicId) ?? 'rich')
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
    const next = nextView(viewRef.current, { kind: 'reveal' }, deck.length)
    if (!next) return
    viewRef.current = next
    setView(next)
    fire('element')
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

    if (!correct && current.item.id) {
      const already = missedItems.current[current.topicId] ?? []
      if (!already.includes(current.item.id)) {
        missedItems.current = {
          ...missedItems.current,
          [current.topicId]: [...already, current.item.id],
        }
      }
    }

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
    const at = viewRef.current.kind === 'revealed' ? viewRef.current.index : -1
    const next = nextView(viewRef.current, { kind: 'grade', grade }, deck.length)
    if (!next || !deck[at]) return

    gradeLock.current = true
    // Hold the armed cue through the exit: the card is leaving *as* this grade,
    // and dropping back to the un-armed treatment at the moment of commit would
    // read as the gesture having been let go of.
    setArmed(grade)
    setDragging(false)
    fire(grade === 'correct' ? 'settle' : 'miss')
    recordGrade(at, grade === 'correct')

    viewRef.current = next
    setView(next)
  }

  /** The next prompt becomes active only from here: after the exit completed. */
  function advance() {
    const next = nextView(viewRef.current, { kind: 'advance' }, deck.length)
    if (!next) return
    x.set(0)
    setArmed(null)
    setDragging(false)
    gradeLock.current = false
    viewRef.current = next
    setView(next)
  }

  /**
   * A ladder answer is objectively graded rather than self-scored, but it feeds
   * the identical tally: the scheduler still sees one clean run of every item
   * in the topic, and `PASS_THRESHOLD` is untouched.
   */
  function answerProgressive(answer: ProgressiveAnswer) {
    const at = viewRef.current.kind === 'done' ? -1 : viewRef.current.index
    const current = deck[at]
    const next = nextView(viewRef.current, { kind: 'answer' }, deck.length)
    if (!next || !current) return
    fire(answer.correct ? 'settle' : 'miss')
    recordGrade(at, answer.correct, noteAnswer(current, answer))
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
    const resolved = new Set(banked.map((entry) => entry.resolution.topic.id))
    for (const [topicId, store] of Object.entries(cueEvidence)) {
      if (resolved.has(topicId)) continue
      updateTopic(topicId, (current) => mergeItemEvidence(current, store))
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
    return (
      <TestDone
        banked={banked}
        missed={missedItems.current}
        onExit={onExit}
        onPractice={onPractice}
        headingRef={headingRef}
      />
    )
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
          </p>
          {/* Position as a number in the corner, the same grammar every run
              surface uses. `Test · 3 of 12` named the surface the learner is
              standing on and spelled out a reading they only ever glance at. */}
          <span className="session-count tabular" aria-label={`Card ${topicPosition.current} of ${topicPosition.of}`}>
            {topicPosition.current}
            <span className="session-count-of" aria-hidden="true">/{topicPosition.of}</span>
          </span>
          <button className="ghost small" type="button" onClick={requestExit}>
            End test
          </button>
        </div>

        {/* Deliberately not keyed per card. The card owns the keyed-answer
            lifecycle, and the gate that stops a finger still moving through one
            answer landing on the next has to survive the swap between them. */}
        <ProgressiveCard
          cardKey={`${card.topicId}-${card.item.id}-${index}`}
          character={card.character}
          rung={rung}
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
        </p>
        <span className="session-count tabular" aria-label={`Card ${topicPosition.current} of ${topicPosition.of}`}>
          {topicPosition.current}
          <span className="session-count-of" aria-hidden="true">/{topicPosition.of}</span>
        </span>
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
