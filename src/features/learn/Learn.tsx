import { useEffect, useRef, useState } from 'react'
import { useLibrary } from '../../lib/store'
import type { Item, Topic } from '../../lib/types'
import './Learn.css'

interface Card {
  topicId: string
  topicTitle: string
  item: Item
}

interface LearnProps {
  topicIds: string[]
  onExit: () => void
  onStartPractice: (topicIds: string[]) => void
}

type Phase = 'studying' | 'done'

export function Learn({ topicIds, onExit, onStartPractice }: LearnProps) {
  const { topics } = useLibrary()

  // Snapshot at session start, same as Practice: the deck a user starts with
  // is the deck they finish with, even if the library changes mid-session.
  const [included] = useState<Topic[]>(() =>
    topicIds.map((id) => topics.find((t) => t.id === id)).filter(Boolean) as Topic[],
  )
  const [deck] = useState<Card[]>(() =>
    included.flatMap((topic) =>
      topic.items.map((item) => ({ topicId: topic.id, topicTitle: topic.title, item })),
    ),
  )

  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('studying')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const pointerStart = useRef<number | null>(null)
  const card: Card | undefined = deck[index]

  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true })
  }, [index])

  useEffect(() => {
    if (phase === 'done') headingRef.current?.focus()
  }, [phase])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (phase !== 'studying') return

      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        advance()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        back()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, index])

  function advance() {
    if (index + 1 < deck.length) setIndex((current) => current + 1)
    else setPhase('done')
  }

  function back() {
    if (index > 0) setIndex((current) => current - 1)
  }

  function finishSwipe(clientX: number) {
    if (pointerStart.current === null) return
    const delta = clientX - pointerStart.current
    pointerStart.current = null
    if (Math.abs(delta) < 64) return
    if (delta < 0) advance()
    else back()
  }

  if (deck.length === 0) {
    return (
      <section className="session">
        <h1>Nothing to learn</h1>
        <p>These topics have no items yet. Add items to a topic and it will come back to Today.</p>
        <button type="button" onClick={onExit}>
          Back to today
        </button>
      </section>
    )
  }

  if (phase === 'done') {
    const topicList = included.map((topic) => topic.title).join(', ')
    return (
      <section className="session session-done">
        <h1 ref={headingRef} tabIndex={-1}>
          Studied
        </h1>
        <p className="transition">
          You went through {deck.length} {deck.length === 1 ? 'item' : 'items'} in{' '}
          <strong>{topicList}</strong>. Testing yourself now is how it becomes retention, not just
          exposure.
        </p>
        <div className="rate">
          <button className="ghost" type="button" onClick={onExit}>
            Back to today
          </button>
          <button type="button" onClick={() => onStartPractice(topicIds)}>
            Start practice
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="session learn-session" aria-labelledby="learn-heading">
      <div className="session-bar">
        <p>
          <span className="session-topic">{card.topicTitle}</span>
          <span>
            {index + 1} of {deck.length}
          </span>
        </p>
        <button className="ghost small" type="button" onClick={onExit}>
          Exit learn
        </button>
      </div>

      <div
        className="learn-card"
        onPointerDown={(event) => {
          pointerStart.current = event.clientX
        }}
        onPointerUp={(event) => finishSwipe(event.clientX)}
      >
        <h1 id="learn-heading" className="prompt">
          {card.item.prompt}
        </h1>
        <div className="answer">
          <span className="answer-label">Answer</span>
          <span className="answer-value">{card.item.answer}</span>
        </div>
      </div>

      <div className="learn-actions">
        <button className="ghost" type="button" onClick={back} disabled={index === 0}>
          Back
        </button>
        <button ref={nextRef} type="button" onClick={advance}>
          {index + 1 < deck.length ? 'Next' : 'Done'}
        </button>
      </div>

      <p className="recall-shortcuts">Swipe, or use ← and → to move through the set</p>
    </section>
  )
}
