import { useEffect, useRef } from 'react'
import { dueState } from '../../lib/scheduling'
import { StatusTag, statusLabel } from '../../components/ui/StatusTag'
import type { Mode, Topic } from '../../lib/types'

interface TopicPageProps {
  topic: Topic
  onBack: () => void
  onStart: (mode: Mode, topicIds: string[]) => void
  onEdit: () => void
  onDelete: () => void
}

function stamp(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * A topic is a place, not a dialog. It has a scope statement to read, three
 * modes to choose between, a history worth seeing, and two administrative
 * actions that must not sit at the same weight as the modes. A sheet flattened
 * all of that to one altitude and buried the modes under the item list.
 */
export function TopicPage({ topic, onBack, onStart, onEdit, onDelete }: TopicPageProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  const runnable = topic.items.length > 0

  useEffect(() => {
    heading.current?.focus()
  }, [topic.id])

  return (
    <article className="topic">
      <button className="quiet topic-back" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span> Library
      </button>

      <h1 ref={heading} tabIndex={-1} className="topic-title">
        {topic.title}
      </h1>

      {/* The boundary is the reason the topic is allowed to exist, so it reads
          as content rather than as a caption under the title. */}
      <p className="topic-scope">{topic.scope}</p>

      <dl className="topic-facts">
        <div>
          <dt>Status</dt>
          <dd>
            <StatusTag status={topic.status} />
          </dd>
        </div>
        <div>
          <dt>Schedule</dt>
          <dd>{dueState(topic).label}</dd>
        </div>
        <div>
          <dt>Track</dt>
          <dd>
            <span className={`track track-${topic.track}`}>{topic.track}</span>
          </dd>
        </div>
        <div>
          <dt>Items</dt>
          <dd className="tabular">{topic.items.length}</dd>
        </div>
        {topic.completedAt && (
          <div>
            <dt>First completed</dt>
            <dd className="tabular">{stamp(topic.completedAt)}</dd>
          </div>
        )}
      </dl>

      {runnable ? (
        <div className="mode-choice">
          <button className="mode-btn is-primary" type="button" onClick={() => onStart('test', [topic.id])}>
            <span className="mode-name">Test</span>
            <span className="mode-note">Every item, once, scored. This one counts.</span>
          </button>
          <button className="mode-btn" type="button" onClick={() => onStart('learn', [topic.id])}>
            <span className="mode-name">Learn</span>
            <span className="mode-note">Read the set laid out in full. Nothing recorded.</span>
          </button>
          <button className="mode-btn" type="button" onClick={() => onStart('practice', [topic.id])}>
            <span className="mode-name">Practise</span>
            <span className="mode-note">Flashcards, as often as you like. Nothing recorded.</span>
          </button>
        </div>
      ) : (
        <div className="topic-unfinished">
          <p>
            This topic has no items yet, so there is nothing to read or test. Add them as
            <code> prompt | answer</code>, one per line.
          </p>
          <button type="button" onClick={onEdit}>
            Add items
          </button>
        </div>
      )}

      {runnable && (
        <details className="fold">
          <summary>
            Show all {topic.items.length} {topic.items.length === 1 ? 'item' : 'items'}
          </summary>
          <ol className="fold-items">
            {topic.items.map((item, i) => (
              <li key={`${item.prompt}-${i}`}>
                <span className="fold-prompt">{item.prompt}</span>
                <span className="fold-answer">{item.answer}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      {topic.history.length > 0 && (
        <details className="fold">
          <summary>
            History, {topic.history.length}{' '}
            {topic.history.length === 1 ? 'attempt' : 'attempts'}
          </summary>
          <ol className="fold-history">
            {[...topic.history].reverse().map((attempt) => (
              <li key={attempt.at}>
                <span className="tabular">{stamp(attempt.at)}</span>
                <span className="tabular">
                  {attempt.correct}/{attempt.total}
                </span>
                <span className="fold-resolved">{statusLabel(attempt.resolvedTo)}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      {/* Editing and deleting are administration, not practice. They sit below
          the fold at text weight so they never compete with the modes. */}
      <div className="topic-admin">
        <button className="quiet" type="button" onClick={onEdit}>
          Edit topic
        </button>
        <button className="quiet is-danger" type="button" onClick={onDelete}>
          Delete topic
        </button>
      </div>
    </article>
  )
}
