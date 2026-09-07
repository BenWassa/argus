import { useMemo, useRef, useState } from 'react'
import { startLesson, type LessonRun } from '../../lib/morseLesson'
import { morseLessonPath, startReplayLesson } from '../../lib/morseLessonPath'
import { useLibrary } from '../../lib/store'
import { MorseLesson } from './MorseLesson'
import { MorseReplay } from './MorseReplay'
import './MorseProgramme.css'

interface MorseProgrammeProps {
  topicId: string
  onExit: () => void
  onTest: () => void
  onReference: () => void
}

interface ActiveLesson {
  run: LessonRun
  replay: boolean
}

function stateLabel(state: 'completed' | 'current' | 'unlocked' | 'locked'): string {
  if (state === 'completed') return 'Completed'
  if (state === 'current') return 'Current'
  if (state === 'unlocked') return 'Unlocked'
  return 'Locked'
}

/**
 * The learner-facing A–Z curriculum map (#75).
 *
 * The path owns no progress. It projects `morseLessonPath(topic)`, which in turn
 * derives from the exact packet plan and durable acquisition support that drive
 * normal Learn. Selecting a completed lesson creates an ephemeral replay run;
 * only selecting Current enters the canonical acquisition flow.
 */
export function MorseProgramme({ topicId, onExit, onTest, onReference }: MorseProgrammeProps) {
  const { topics } = useLibrary()
  const topic = topics.find((candidate) => candidate.id === topicId)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [active, setActive] = useState<ActiveLesson | null>(null)

  const path = useMemo(() => (topic ? morseLessonPath(topic) : null), [topic])

  if (!topic || !path) {
    return (
      <section className="session morse-lesson">
        <h1>Morse lesson unavailable</h1>
        <button type="button" onClick={onExit}>Back to today</button>
      </section>
    )
  }

  if (active?.replay) {
    return <MorseReplay initialRun={active.run} onExit={() => setActive(null)} />
  }

  if (active) {
    return (
      <MorseLesson
        topic={topic}
        initialRun={active.run}
        onExit={() => setActive(null)}
        onTest={onTest}
        onReference={onReference}
      />
    )
  }

  const current = path.find((lesson) => lesson.state === 'current')
  const allComplete = !current

  function continueCurrent() {
    const run = startLesson(topic)
    if (run) setActive({ run, replay: false })
  }

  function replay(index: number) {
    const run = startReplayLesson(topic, index)
    if (run) setActive({ run, replay: true })
  }

  return (
    <section className="session morse-lesson morse-programme">
      <div className="session-bar">
        <p>
          <span className="session-topic">Morse lessons</span>
          <span className="tabular">{path.length} lessons</span>
        </p>
        <button className="ghost small" type="button" onClick={onExit}>Close</button>
      </div>

      <header className="morse-programme-head">
        <h1 ref={headingRef} tabIndex={-1}>Learn Morse A–Z</h1>
        <p>
          Work forward two new letters at a time. Completed lessons stay available for a quick
          refresher whenever you want them.
        </p>
        <div className="morse-programme-actions">
          {!allComplete && current && (
            <button type="button" onClick={continueCurrent}>
              {topic.lessonSitting ? `Continue lesson ${current.number}` : `Start lesson ${current.number}`}
            </button>
          )}
          {allComplete && <button type="button" onClick={onTest}>Test me</button>}
          <button className="ghost" type="button" onClick={onReference}>Morse alphabet</button>
        </div>
      </header>

      <ol className="morse-path" aria-label="Morse lesson path">
        {path.map((lesson) => {
          const status = stateLabel(lesson.state)
          const letters = lesson.novel.join(' · ')
          return (
            <li
              key={lesson.index}
              className={`morse-path-item is-${lesson.state}`}
              aria-current={lesson.state === 'current' ? 'step' : undefined}
            >
              <span className="morse-path-number tabular" aria-hidden="true">
                {String(lesson.number).padStart(2, '0')}
              </span>
              <span className="morse-path-main">
                <span className="morse-path-new-label">New letters</span>
                <strong className="morse-path-letters">{letters}</strong>
              </span>
              <span className="morse-path-status">{status}</span>

              {lesson.state === 'current' ? (
                <button className="small morse-path-action" type="button" onClick={continueCurrent}>
                  Continue
                </button>
              ) : lesson.replayable ? (
                <button className="ghost small morse-path-action" type="button" onClick={() => replay(lesson.index)}>
                  Replay
                </button>
              ) : (
                <button className="ghost small morse-path-action" type="button" disabled aria-label={`Lesson ${lesson.number} locked`}>
                  Locked
                </button>
              )}
            </li>
          )
        })}
      </ol>

      <p className="morse-programme-foot">
        Replay is formative review only. Formal A–Z evidence is still earned in Test.
      </p>
    </section>
  )
}
