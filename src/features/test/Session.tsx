import { useEffect, useMemo, useRef, useState } from 'react'
import { useLibrary } from '../../lib/store'
import { resolveAttempt, type Resolution } from '../../lib/scheduling'
import { statusLabel } from '../../components/ui/StatusTag'
import {
  expectedAnswer,
  morseAcquisitionProfile,
  type AcquisitionCharacter,
  type AcquisitionProfile,
} from '../../lib/acquisition'
import { mergeItemEvidence, recordAnswer, rungFor } from '../../lib/cueLadder'
import { selectDistractors } from '../../lib/distractors'
import { retentionCorrectCount } from '../../lib/items'
import type { Item, ItemCueEvidence, ItemEvidenceStore, Topic } from '../../lib/types'
import { ProgressiveCard, type ProgressiveAnswer } from './ProgressiveCard'
import { testCardTextClass } from './textScale'
import './Session.css'

/** Alternatives on a choice rung: the answer plus three distractors. */
const CHOICE_OPTIONS = 4

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

type Phase = 'asking' | 'revealed' | 'done'

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

  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('asking')
  const [tally, setTally] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 })
  const [resolutions, setResolutions] = useState<Resolution[]>([])
  const [confirmingExit, setConfirmingExit] = useState(false)

  const revealRef = useRef<HTMLButtonElement>(null)
  const yesRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const pointerStart = useRef<number | null>(null)
  const card: Card | undefined = deck[index]

  useEffect(() => {
    if (deck[index]?.character) return
    if (phase === 'asking') revealRef.current?.focus({ preventScroll: true })
    else if (phase === 'revealed') yesRef.current?.focus({ preventScroll: true })
  }, [deck, phase, index])

  useEffect(() => {
    if (phase === 'done') headingRef.current?.focus()
  }, [phase])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      // A ladder card owns its own keys; reveal/self-score does not apply to it.
      if (deck[index]?.character) return

      if (phase === 'asking' && (event.key === ' ' || event.key === 'Enter')) {
        event.preventDefault()
        reveal()
      } else if (phase === 'revealed' && (event.key === 'ArrowLeft' || event.key === '1')) {
        event.preventDefault()
        score(false)
      } else if (phase === 'revealed' && (event.key === 'ArrowRight' || event.key === '2')) {
        event.preventDefault()
        score(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, index])

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
    // safety gate: an incomplete direction can never be presented to the
    // unchanged scheduler as a passing attempt for a bidirectional boundary.
    const schedulerCorrect = retentionCorrectCount(topic.items, mergedEvidence, attempt.correct)
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
    const next = {
      ...topicStore,
      [itemId]: recordAnswer(evidenceFor(card), {
        direction: rung.direction,
        correct: answer.correct,
        // Recorded from the first session, and read by nothing that decides
        // anything. It exists so a threshold can one day be more than a guess.
        latencyMs: answer.latencyMs,
        at: new Date().toISOString(),
      }),
    }
    setCueEvidence((previous) => ({ ...previous, [card.topicId]: next }))
    return next
  }

  function reveal() {
    if (phase !== 'asking') return
    setPhase('revealed')
    haptic(8)
  }

  function score(correct: boolean) {
    if (!card || phase !== 'revealed') return
    bankAndAdvance(correct)
  }

  /**
   * A ladder answer is objectively graded rather than self-scored, but it feeds
   * the identical tally: the scheduler still sees one clean run of every item
   * in the topic, and `PASS_THRESHOLD` is untouched.
   */
  function answerProgressive(answer: ProgressiveAnswer) {
    if (!card) return
    bankAndAdvance(answer.correct, noteAnswer(card, answer))
  }

  function bankAndAdvance(correct: boolean, evidence?: ItemEvidenceStore) {
    if (!card) return
    haptic(correct ? 12 : [10, 24, 10])

    const next = { correct: tally.correct + (correct ? 1 : 0), total: tally.total + 1 }
    const following = deck[index + 1]
    const topicFinished = !following || following.topicId !== card.topicId

    if (topicFinished) {
      bank(card.topicId, next, evidence ?? cueEvidence[card.topicId] ?? {})
      setTally({ correct: 0, total: 0 })
    } else {
      setTally(next)
    }

    if (following) {
      setIndex((current) => current + 1)
      setPhase('asking')
    } else {
      setPhase('done')
    }
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

  function finishSwipe(clientX: number) {
    if (phase !== 'revealed' || pointerStart.current === null) return
    const delta = clientX - pointerStart.current
    pointerStart.current = null
    if (Math.abs(delta) < 64) return
    score(delta > 0)
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

  if (phase === 'done') {
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

  const revealed = phase === 'revealed'

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

  return (
    <section className="session rapid-session is-graded" aria-labelledby="prompt-heading">
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

      <div className="card-stage">
        <button
          ref={revealRef}
          className={`flip-card${revealed ? ' is-revealed' : ''}`}
          type="button"
          onClick={reveal}
          onPointerDown={(event) => {
            if (revealed) pointerStart.current = event.clientX
          }}
          onPointerUp={(event) => finishSwipe(event.clientX)}
          aria-expanded={revealed}
          aria-label={
            revealed ? `Answer: ${card.item.answer}` : `Prompt: ${card.item.prompt}. Reveal answer.`
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
              <span className="flip-label">Answer</span>
              <span className={`flip-value flip-value-answer${testCardTextClass(card.item.answer)}`}>
                {card.item.answer}
              </span>
            </span>
          </span>
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {revealed ? `Answer: ${card.item.answer}` : ''}
      </p>

      <div className={`recall-actions${revealed ? ' is-visible' : ''}`} aria-hidden={!revealed}>
        <button className="ghost recall-miss" type="button" tabIndex={revealed ? 0 : -1} onClick={() => score(false)}>
          Didn’t get it
        </button>
        <button ref={yesRef} type="button" tabIndex={revealed ? 0 : -1} onClick={() => score(true)}>
          Got it
        </button>
      </div>

      <p className="recall-shortcuts">
        {revealed ? 'Swipe left or right, or use ← and →' : 'Tap the card or press Space'}
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
