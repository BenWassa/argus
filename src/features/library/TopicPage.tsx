import { useEffect, useRef } from 'react'
import { journeyFor } from '../../lib/journey'
import { StatusTag, statusLabel } from '../../components/ui/StatusTag'
import type { Mode, Topic } from '../../lib/types'

interface TopicPageProps {
  topic: Topic
  onBack: () => void
  onStart: (mode: Mode, topicIds: string[]) => void
  /** Opens the Morse alphabet. Rendered only for a topic the lesson drives. */
  onOpenReference: () => void
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
 * A topic is a place, not a dialog. It has a scope statement to read, two
 * modes to choose between, a history worth seeing, and two administrative
 * actions that must not sit at the same weight as the modes. A sheet flattened
 * all of that to one altitude and buried the modes under the item list.
 */
export function TopicPage({
  topic,
  onBack,
  onStart,
  onOpenReference,
  onEdit,
  onDelete,
}: TopicPageProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  const runnable = topic.items.length > 0
  /**
   * The same derivation Today and Library read. The Topic page is the one place
   * that shows the dimensions separately — acquisition, retention, evidence —
   * but it must not reach its own verdict about them: the primary action here is
   * the same value as the verb on the Library row.
   */
  const journey = journeyFor(topic)
  const { acquisition } = journey
  /**
   * A topic the guided lesson drives has three jobs rather than two, and they
   * are not equal: the lesson is the acquisition action, Test is the evidence
   * action and the alphabet is a quiet lookup. Every other topic keeps exactly
   * the two-button choice it has always had.
   */
  const progressive = runnable && acquisition.progressive
  const learnPrimary = journey.action === 'learn'

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
          <dd>{journey.statusLabel}</dd>
        </div>
        {/* Acquisition and retention are different questions and get different
            rows. Collapsing them is how `learning` came to be read as "the
            lesson is finished" in the first place. */}
        {progressive && (
          <div>
            <dt>Acquisition</dt>
            <dd>
              {acquisition.ready
                ? `Ready · ${acquisition.settled} of ${acquisition.total} letters settled`
                : `In progress · ${acquisition.settled} of ${acquisition.total} letters settled, packet ${acquisition.packet} of ${acquisition.packetCount}`}
            </dd>
          </div>
        )}
        {progressive && journey.sitting?.active && (
          <div>
            <dt>Current sitting</dt>
            <dd className="tabular">
              {journey.sitting.retrievals} of {journey.sitting.target} retrievals
            </dd>
          </div>
        )}
        {journey.evidence.bidirectional && (
          <div>
            <dt>Both-direction evidence</dt>
            <dd className="tabular">
              {journey.evidence.covered} of {journey.evidence.total} unaided
            </dd>
          </div>
        )}
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

      {runnable && progressive ? (
        <>
          {/* One primary action, and it is the journey's. While acquisition is
              incomplete that is the lesson on every surface; once it is ready it
              is Test on every surface. */}
          <div className="mode-choice">
            {learnPrimary ? (
              <>
                <button className="mode-btn is-primary" type="button" onClick={() => onStart('learn', [topic.id])}>
                  <span className="mode-name">{journey.primaryLabel}</span>
                  <span className="mode-note">
                    Guided packet {acquisition.packet} of {acquisition.packetCount}: new letters,
                    then retrieval. Nothing scored.
                  </span>
                </button>
                <button className="mode-btn" type="button" onClick={() => onStart('test', [topic.id])}>
                  <span className="mode-name">Test early</span>
                  <span className="mode-note">
                    Every item, once, scored — but the lesson has not been through every letter
                    yet, so the run is recorded without moving the ladder.
                  </span>
                </button>
              </>
            ) : (
              <>
                <button className="mode-btn is-primary" type="button" onClick={() => onStart('test', [topic.id])}>
                  <span className="mode-name">Test</span>
                  <span className="mode-note">Every item, once, scored. This one counts.</span>
                </button>
                <button className="mode-btn" type="button" onClick={() => onStart('learn', [topic.id])}>
                  <span className="mode-name">Lesson</span>
                  <span className="mode-note">
                    {acquisition.settled === acquisition.total
                      ? 'Every letter has been through the lesson. Nothing scored.'
                      : 'Go back over any letter the lesson still scaffolds. Nothing scored.'}
                  </span>
                </button>
              </>
            )}
          </div>
          <button className="quiet topic-reference" type="button" onClick={onOpenReference}>
            Morse alphabet — look up any letter
          </button>
        </>
      ) : runnable ? (
        // Both modes stay reachable, and which one is primary follows the same
        // journey Today and Library read. A topic nobody has opened yet asks to
        // be read here too, rather than offering a scored Test as the lead
        // action while every other surface says Learn.
        <div className="mode-choice">
          {learnPrimary ? (
            <>
              <button className="mode-btn is-primary" type="button" onClick={() => onStart('learn', [topic.id])}>
                <span className="mode-name">Learn</span>
                <span className="mode-note">
                  {topic.learn ? 'Read the briefing and finite reference. Nothing scored.' : 'Read the finite reference in full. Nothing scored.'}
                </span>
              </button>
              <button className="mode-btn" type="button" onClick={() => onStart('test', [topic.id])}>
                <span className="mode-name">Test</span>
                <span className="mode-note">Every item, once, scored. This one counts.</span>
              </button>
            </>
          ) : (
            <>
              <button className="mode-btn is-primary" type="button" onClick={() => onStart('test', [topic.id])}>
                <span className="mode-name">Test</span>
                <span className="mode-note">Every item, once, scored. This one counts.</span>
              </button>
              <button className="mode-btn" type="button" onClick={() => onStart('learn', [topic.id])}>
                <span className="mode-name">Learn</span>
                <span className="mode-note">
                  {topic.learn ? 'Read the briefing and finite reference. Nothing scored.' : 'Read the finite reference in full. Nothing scored.'}
                </span>
              </button>
            </>
          )}
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

      {/* Editing and deleting are administration, not testing. They sit below
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
