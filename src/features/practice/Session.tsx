import { useEffect, useMemo, useRef, useState } from 'react'
import { useLibrary } from '../../lib/store'
import { resolveAttempt, type Resolution } from '../../lib/scheduling'
import { statusLabel } from '../../components/ui/StatusTag'
import type { Item, Topic } from '../../lib/types'

interface Card {
  topicId: string
  topicTitle: string
  item: Item
}

interface SessionProps {
  topicIds: string[]
  onExit: () => void
}

/**
 * Compares a typed answer to the stored one. Deliberately forgiving on case,
 * punctuation and spacing, and deliberately *not* used as the final word:
 * every card ends with the answer shown and the user's own judgement, so a
 * near-miss never becomes an argument with the machine.
 */
function matches(input: string, answer: string): boolean {
  const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return normalise(input) === normalise(answer)
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

export function Session({ topicIds, onExit }: SessionProps) {
  const { topics, upsertTopic } = useLibrary()

  // Snapshot the topics at session start. useState, not useMemo: React is
  // allowed to discard a useMemo and recompute it, which would rebuild the
  // deck underneath the user mid-session.
  const [included] = useState<Topic[]>(() =>
    topicIds.map((id) => topics.find((t) => t.id === id)).filter(Boolean) as Topic[],
  )

  // Cards are grouped by topic and shuffled only *within* a topic. Two things
  // follow: the user always knows which deck they are in, and a topic can bank
  // the moment its last card resolves rather than waiting for the whole run.
  const [deck] = useState<Card[]>(() =>
    included.flatMap((t) =>
      shuffle(t.items.map((item) => ({ topicId: t.id, topicTitle: t.title, item }))),
    ),
  )

  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('asking')
  const [input, setInput] = useState('')
  const [autoCorrect, setAutoCorrect] = useState(false)
  const [tally, setTally] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 })
  const [resolutions, setResolutions] = useState<Resolution[]>([])
  const [confirmingExit, setConfirmingExit] = useState(false)

  const answerRef = useRef<HTMLInputElement>(null)
  const yesRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const card: Card | undefined = deck[index]

  // Keep focus on the control the user needs next. Without the revealed branch
  // the form unmounts and focus falls to <body> on every single card.
  useEffect(() => {
    if (phase === 'asking') answerRef.current?.focus()
    else if (phase === 'revealed') yesRef.current?.focus()
  }, [phase, index])

  useEffect(() => {
    if (phase === 'done') headingRef.current?.focus()
  }, [phase])

  const topicPosition = useMemo(() => {
    if (!card) return { current: 0, of: 0 }
    const cards = deck.filter((c) => c.topicId === card.topicId)
    const first = deck.findIndex((c) => c.topicId === card.topicId)
    return { current: index - first + 1, of: cards.length }
  }, [card, deck, index])

  function bank(topicId: string, score: { correct: number; total: number }) {
    const topic = included.find((t) => t.id === topicId)
    if (!topic) return null
    const resolution = resolveAttempt(topic, score.correct, score.total)
    upsertTopic(resolution.topic)
    setResolutions((prev) => [...prev, resolution])
    return resolution
  }

  function score(correct: boolean) {
    if (!card) return
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
      setIndex(index + 1)
      setInput('')
      setPhase('asking')
    } else {
      setPhase('done')
    }
  }

  function requestExit() {
    // Finished topics are already banked, so leaving only discards the topic
    // in progress. Say so rather than dropping the work silently.
    if (tally.total > 0) setConfirmingExit(true)
    else onExit()
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

  return (
    <section className="session" aria-labelledby="prompt-heading">
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

      <h1 id="prompt-heading" className="prompt">
        {card.item.prompt}
      </h1>

      {phase === 'asking' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setAutoCorrect(matches(input, card.item.answer))
            setPhase('revealed')
          }}
        >
          <label className="sr-only" htmlFor="answer">
            Your answer for {card.item.prompt}, from {card.topicTitle}
          </label>
          <input
            id="answer"
            ref={answerRef}
            className="field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Type what you recall"
          />
          <button type="submit">Show answer</button>
        </form>
      ) : (
        <div className="reveal">
          <p className="answer" role="status">
            <span className="answer-label">Answer</span>
            <span className="answer-value">{card.item.answer}</span>
            {input.trim() && !autoCorrect && (
              <span className="answer-yours">You typed: {input.trim()}</span>
            )}
          </p>
          <p className="rate-prompt" id="rate-label">
            Did you recall it?
          </p>
          <div className="rate" role="group" aria-labelledby="rate-label">
            <button className="ghost" type="button" onClick={() => score(false)}>
              No
            </button>
            <button ref={yesRef} type="button" onClick={() => score(true)}>
              Yes
            </button>
          </div>
        </div>
      )}
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
  const completed = resolutions.filter((r) => r.completed)
  const decayed = resolutions.filter((r) => r.decayed)
  const changed = resolutions.filter((r) => !r.completed && !r.decayed && r.to !== r.from)
  const held = resolutions.filter((r) => !r.completed && !r.decayed && r.to === r.from)

  return (
    <section className="session session-done">
      <h1 ref={headingRef} tabIndex={-1}>
        {completed.length > 0 ? 'Banked' : 'Session ended'}
      </h1>

      {/* The completion moment. This is the event the whole product exists to
          produce, so it gets its own statement and the one accent on screen. */}
      {completed.map((r) => (
        <div className="banked" key={r.topic.id}>
          <p className="banked-title">{r.topic.title}</p>
          <p className="banked-note">
            Recalled cleanly {r.gapDays} days after it was last drilled. It is now part of your
            permanent record.
          </p>
        </div>
      ))}

      {decayed.map((r) => (
        <p className="transition" key={r.topic.id}>
          <strong>{r.topic.title}</strong> did not survive its spot check, so it goes back to
          drilling. Your completion from{' '}
          {r.topic.completedAt
            ? new Date(r.topic.completedAt).toLocaleDateString()
            : 'the original run'}{' '}
          still stands.
        </p>
      ))}

      {changed.map((r) => (
        <p className="transition" key={r.topic.id}>
          <strong>{r.topic.title}</strong>: {statusLabel(r.from).toLowerCase()} to{' '}
          {statusLabel(r.to).toLowerCase()}.
          {r.from === 'drilled' && r.to === 'learning' && (
            <> The delayed test starts again once it is drilled clean.</>
          )}
        </p>
      ))}

      {held.map((r) => (
        <p className="transition" key={r.topic.id}>
          <strong>{r.topic.title}</strong> held at {statusLabel(r.to).toLowerCase()}.
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
