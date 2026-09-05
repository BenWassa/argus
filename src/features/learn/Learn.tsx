import { useEffect, useRef, useState } from 'react'
import { useLibrary } from '../../lib/store'
import { resolveStudy } from '../../lib/scheduling'
import { startLesson, type LessonRun } from '../../lib/morseLesson'
import type { Topic } from '../../lib/types'
import { LearnSupport } from './LearnSupport'
import { MorseLesson } from './MorseLesson'
import './Learn.css'

interface LearnProps {
  topicIds: string[]
  onExit: () => void
  onTest: (topicIds: string[]) => void
  onReference: (topicId: string) => void
}

/**
 * Learn has two shapes, chosen by what the topic actually is.
 *
 * For a topic the guided Morse lesson can drive — a single topic whose scored
 * deck is the full canonical A–Z mapping — Learn is that lesson: one dominant
 * task at a time, introductions followed by retrieval, support fading with
 * success and returning after a miss. #48 replaced the scrollable packet
 * curriculum with it, and moved plain A–Z lookup to its own reference surface.
 *
 * For every other topic Learn is unchanged: a reading surface, not a test, with
 * the whole finite reference laid out at once and optional explanatory support
 * above it. Nothing is hidden, and explanatory support never becomes scored
 * material implicitly.
 *
 * Either way, opening Learn is first exposure and moves an `unstarted` topic to
 * `learning` exactly as it always has. That is the only scheduler transition
 * Learn makes, and no retrieval inside the lesson adds another.
 */
export function Learn({ topicIds, onExit, onTest, onReference }: LearnProps) {
  const { topics, upsertTopic } = useLibrary()
  const headingRef = useRef<HTMLHeadingElement>(null)

  const [included] = useState<Topic[]>(() =>
    topicIds.map((id) => topics.find((t) => t.id === id)).filter(Boolean) as Topic[],
  )

  // Resolved once, from the topic as it stood on entry. A batched Learn run
  // over several topics keeps the reading sheet: a guided lesson is a single
  // topic's acquisition path, not something to interleave across decks.
  const [lesson] = useState<{ topic: Topic; run: LessonRun } | null>(() => {
    if (included.length !== 1) return null
    const run = startLesson(included[0])
    return run ? { topic: included[0], run } : null
  })

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

  if (lesson) {
    return (
      <MorseLesson
        topic={lesson.topic}
        initialRun={lesson.run}
        onExit={onExit}
        onTest={() => onTest(topicIds)}
        onReference={() => onReference(lesson.topic.id)}
      />
    )
  }

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
              {topic.learn ? ' in the scored boundary' : ''}
            </p>
          </header>

          {topic.learn && <LearnSupport content={topic.learn} />}

          {topic.learn && <h3 className="sheet-reference-title">Recall reference</h3>}

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
          Reading it is exposure. Recalling the finite set after a gap is what makes it stick.
        </p>
        <div className="rate">
          <button type="button" onClick={() => onTest(topicIds)}>
            Test me
          </button>
        </div>
      </footer>
    </section>
  )
}
