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
  /** Test resolves attempts and moves the ladder. Practice records nothing. */
  graded: boolean
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

export function Session({ topicIds, graded, onExit }: SessionProps) {
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
  const [runningScore, setRunningScore] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  })
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
    if (!topic) return
    const resolution = resolveAttempt(topic, attempt.correct, attempt.total)
    upsertTopic(resolution.topic)
    setResolutions((previous) => [...previous, resolution])
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

    setRunningScore((current) => ({
      correct: current.correct + (correct ? 1 : 0),
      total: current.total + 1,
    }))

    if (topicFinished) {
      if (graded) bank(card.topicId, next)
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
    // Only a graded run has anything to lose: practice records nothing, so
    // leaving it costs the user nothing and should not be argued with.
    if (graded && tally.total > 0) setConfirmingExit(true)
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
        <h1>Nothing to run</h1>
        <p>These topics have no items yet. Add items to a topic and it will come back to Today.</p>
        <button type="button" onClick={onExit}>
          Back to today
        </button>
      </section>
    )
  }

  if (phase === 'done') {
    return graded ? (
      <TestDone resolutions={resolutions} onExit={onExit} headingRef={headingRef} />
    ) : (
      <PractiseDone score={runningScore} onExit={onExit} headingRef={headingRef} />
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
          <button className="danger" type="button" onClick={onExit}>
            End test
          </button>
        </div>
      </section>
    )
  }

  const revealed = phase === 'revealed'

  return (
    <section className={`session rapid-session${graded ? ' is-graded' : ''}`} aria-labelledby="prompt-heading">
      <div className="session-bar">
        <p>
          <span className="session-topic">{card.topicTitle}</span>
          <span className="tabular">
            {graded ? 'Test' : 'Practice'} · {topicPosition.current} of {topicPosition.of}
          </span>
        </p>
        <button className="ghost small" type="button" onClick={requestExit}>
          {graded ? 'End test' : 'Done'}
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
              <span className="flip-value">{card.item.prompt}</span>
            </span>
            <span className="flip-face flip-back">
              <span className="flip-label">Answer</span>
              <span className="flip-value flip-value-answer">{card.item.answer}</span>
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

/** Practice records nothing, so its ending reports the run and no more. */
function PractiseDone({
  score,
  onExit,
  headingRef,
}: {
  score: { correct: number; total: number }
  onExit: () => void
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0

  return (
    <section className="session session-done">
      <h1 ref={headingRef} tabIndex={-1}>
        Practice run
      </h1>
      <p className="score-line tabular">
        {score.correct} / {score.total}
        <span className="score-pct">{pct}%</span>
      </p>
      <p className="transition">
        Nothing was recorded. Practice is for rehearsal, so run it as often as you like: only a test
        moves a topic along.
      </p>
      <button type="button" onClick={onExit}>
        Back to today
      </button>
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
