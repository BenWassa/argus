import { useEffect, useMemo, useRef, useState } from 'react'
import { useLibrary } from '../../lib/store'
import { resolveAttempt, type Resolution } from '../../lib/scheduling'
import { statusLabel } from '../../components/ui/StatusTag'
import type { Item, Topic } from '../../lib/types'
import './Session.css'

interface Card {
  topicId: string
  topicTitle: string
  item: Item
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
    // Haptics are optional feedback and never block practice.
  }
}

export function Session({ topicIds, onExit }: SessionProps) {
  const { topics, upsertTopic } = useLibrary()

  // Snapshot the topics and deck at session start. A bankable attempt always
  // runs every item in a topic; fast interaction must not weaken the boundary.
  const [included] = useState<Topic[]>(() =>
    topicIds.map((id) => topics.find((t) => t.id === id)).filter(Boolean) as Topic[],
  )
  const [deck] = useState<Card[]>(() =>
    included.flatMap((topic) =>
      shuffle(
        topic.items.map((item) => ({
          topicId: topic.id,
          topicTitle: topic.title,
          item,
        })),
      ),
    ),
  )

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
    if (phase === 'asking') revealRef.current?.focus({ preventScroll: true })
    else if (phase === 'revealed') yesRef.current?.focus({ preventScroll: true })
  }, [phase, index])

  useEffect(() => {
    if (phase === 'done') headingRef.current?.focus()
  }, [phase])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return

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

  function bank(topicId: string, attempt: { correct: number; total: number }) {
    const topic = included.find((candidate) => candidate.id === topicId)
    if (!topic) return null
    const resolution = resolveAttempt(topic, attempt.correct, attempt.total)
    upsertTopic(resolution.topic)
    setResolutions((previous) => [...previous, resolution])
    return resolution
  }

  function reveal() {
    if (phase !== 'asking') return
    setPhase('revealed')
    haptic(8)
  }

  function score(correct: boolean) {
    if (!card || phase !== 'revealed') return
    haptic(correct ? 12 : [10, 24, 10])

    const next = { correct: tally.correct + (correct ? 1 : 0), total: tally.total + 1 }
    const following = deck[index + 1]
    const topicFinished = !following || following.topicId !== card.topicId

    if (topicFinished) {
      bank(card.topicId, next)
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

  function requestExit() {
    // Finished topics are already banked, so leaving only discards the topic
    // currently in progress.
    if (tally.total > 0) setConfirmingExit(true)
    else onExit()
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
        <h1>Nothing to practise</h1>
        <p>These topics have no items yet. Add items to a topic and it will come back to Today.</p>
        <button type="button" onClick={onExit}>
          Back to today
        </button>
      </section>
    )
  }

  if (phase === 'done') {
    return <SessionDone resolutions={resolutions} onExit={onExit} headingRef={headingRef} />
  }

  if (confirmingExit) {
    return (
      <section className="session">
        <h1>End session</h1>
        <p>
          {tally.total} {tally.total === 1 ? 'answer' : 'answers'} on{' '}
          <strong>{card.topicTitle}</strong> will be discarded, because a topic only counts once
          every one of its items has been through. Topics you already finished this session are
          banked and will not be lost.
        </p>
        <div className="rate">
          <button className="ghost" type="button" onClick={() => setConfirmingExit(false)}>
            Keep going
          </button>
          <button className="danger" type="button" onClick={onExit}>
            End session
          </button>
        </div>
      </section>
    )
  }

  const revealed = phase === 'revealed'

  return (
    <section className="session rapid-session" aria-labelledby="prompt-heading">
      <div className="session-bar">
        <p>
          <span className="session-topic">{card.topicTitle}</span>
          <span>
            {topicPosition.current} of {topicPosition.of}
          </span>
        </p>
        <button className="ghost small" type="button" onClick={requestExit}>
          End session
        </button>
      </div>

      <h1 id="prompt-heading" className="sr-only">
        {card.item.prompt}
      </h1>

      <button
        ref={revealRef}
        className={`recall-card${revealed ? ' is-revealed' : ''}`}
        type="button"
        onClick={reveal}
        onPointerDown={(event) => {
          if (revealed) pointerStart.current = event.clientX
        }}
        onPointerUp={(event) => finishSwipe(event.clientX)}
        aria-expanded={revealed}
        aria-label={revealed ? `Answer: ${card.item.answer}` : `Prompt: ${card.item.prompt}. Reveal answer.`}
      >
        <span className="recall-card-label">{revealed ? 'Answer' : 'Tap to reveal'}</span>
        <span className="recall-card-value" aria-live="polite">
          {revealed ? card.item.answer : card.item.prompt}
        </span>
      </button>

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

function SessionDone({
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
        {completed.length > 0 ? 'Banked' : 'Session ended'}
      </h1>

      {completed.map((resolution) => (
        <div className="banked" key={resolution.topic.id}>
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
