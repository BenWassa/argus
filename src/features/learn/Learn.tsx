import { useEffect, useRef, useState } from 'react'
import { useLibrary } from '../../lib/store'
import { resolveStudy } from '../../lib/scheduling'
import type { Topic } from '../../lib/types'
import './Learn.css'

interface LearnProps {
  topicIds: string[]
  onExit: () => void
  onPractise: (topicIds: string[]) => void
  onTest: (topicIds: string[]) => void
}

/**
 * Learn is a reading surface, not a test. The whole set is laid out at once so
 * it can be scanned, compared, and read in any order. Nothing is hidden,
 * because hiding is Practice's job.
 */
export function Learn({ topicIds, onExit, onPractise, onTest }: LearnProps) {
  const { topics, upsertTopic } = useLibrary()
  const headingRef = useRef<HTMLHeadingElement>(null)

  const [included] = useState<Topic[]>(() =>
    topicIds.map((id) => topics.find((t) => t.id === id)).filter(Boolean) as Topic[],
  )

  // Reading is the transition off `unstarted`. Banked on open rather than on
  // exit, so a topic that was genuinely opened still counts as seen even if
  // the user leaves by closing the tab.
  useEffect(() => {
    for (const topic of included) {
      const studied = resolveStudy(topic)
      if (studied !== topic) upsertTopic(studied)
    }
    headingRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (included.length === 0) {
    return (
      <section className="session">
        <h1>Nothing to read</h1>
        <p>These topics are no longer in your library.</p>
        <button type="button" onClick={onExit}>
          Back to today
        </button>
      </section>
    )
  }

  return (
    <section className="session learn-sheet">
      <div className="session-bar">
        <p>
          <span className="session-topic">Learn</span>
          <span className="tabular">
            {included.length} {included.length === 1 ? 'topic' : 'topics'}
          </span>
        </p>
        <button className="ghost small" type="button" onClick={onExit}>
          Close
        </button>
      </div>

      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        Learn: {included.map((topic) => topic.title).join(', ')}
      </h1>

      {included.map((topic) => (
        <article className="sheet-topic" key={topic.id} aria-labelledby={`sheet-${topic.id}`}>
          <header className="sheet-topic-head">
            <span className={`track track-${topic.track}`}>{topic.track}</span>
            <h2 id={`sheet-${topic.id}`} className="sheet-title">
              {topic.title}
            </h2>
            <p className="sheet-scope">{topic.scope}</p>
            <p className="sheet-count tabular">
              {topic.items.length} {topic.items.length === 1 ? 'item' : 'items'}
            </p>
          </header>

          {topic.items.length === 0 ? (
            <p className="empty">This topic has no items yet.</p>
          ) : (
            <ol className="sheet-items">
              {topic.items.map((item, i) => (
                <li key={`${item.prompt}-${i}`}>
                  <span className="sheet-num tabular">{String(i + 1).padStart(2, '0')}</span>
                  <span className="sheet-prompt">{item.prompt}</span>
                  <span className="sheet-answer">{item.answer}</span>
                </li>
              ))}
            </ol>
          )}
        </article>
      ))}

      <footer className="sheet-foot">
        <p className="sheet-foot-note">
          Reading it is exposure. Recalling it after a gap is what makes it stick.
        </p>
        <div className="rate">
          <button className="ghost" type="button" onClick={() => onPractise(topicIds)}>
            Practise
          </button>
          <button type="button" onClick={() => onTest(topicIds)}>
            Test me
          </button>
        </div>
      </footer>
    </section>
  )
}
