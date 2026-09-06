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

export function Learn({ topicIds, onExit, onTest, onReference }: LearnProps) {
  const { topics, upsertTopic } = useLibrary()
  const headingRef = useRef<HTMLHeadingElement>(null)

  const [included] = useState<Topic[]>(() =>
    topicIds.map((id) => topics.find((t) => t.id === id)).filter(Boolean) as Topic[],
  )

  // Resolve first exposure before constructing the guided lesson snapshot. This
  // prevents later lesson-progress writes from re-upserting the older
  // `unstarted` topic over the already-earned `learning` transition.
  const [lesson] = useState<{ topic: Topic; run: LessonRun } | null>(() => {
    if (included.length !== 1) return null
    const prepared = resolveStudy(included[0])
    const run = startLesson(prepared)
    return run ? { topic: prepared, run } : null
  })

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
