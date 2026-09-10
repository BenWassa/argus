import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { startLesson, type LessonRun } from '../../lib/morseLesson'
import { morseLessonPath, startReplayLesson } from '../../lib/morseLessonPath'
import {
  morseWordCheckpointPath,
  type MorseWordCheckpointPathItem,
} from '../../lib/morseWordCheckpoints'
import { useLibrary } from '../../lib/store'
import { MorseCheckpoint } from './MorseCheckpoint'
import { MorseLesson } from './MorseLesson'
import { MorseReplay } from './MorseReplay'
import './MorseProgramme.css'

interface MorseProgrammeProps {
  topicId: string
  onExit: () => void
  onTest: () => void
  onReference: () => void
}

type ActiveRun =
  | { kind: 'lesson'; run: LessonRun; replay: boolean }
  | { kind: 'checkpoint'; checkpoint: MorseWordCheckpointPathItem }

function stateLabel(state: 'completed' | 'current' | 'unlocked' | 'locked'): string {
  if (state === 'completed') return 'Completed'
  if (state === 'current') return 'Current'
  if (state === 'unlocked') return 'Unlocked'
  return 'Locked'
}

/**
 * The learner-facing A–Z curriculum map (#75 + #78).
 *
 * The path owns no progress. Canonical lessons project `morseLessonPath(topic)`;
 * the two application checkpoints project the same path plus mechanically
 * validated content and remain local/formative when run.
 */
export function MorseProgramme({ topicId, onExit, onTest, onReference }: MorseProgrammeProps) {
  const { topics } = useLibrary()
  const topic = topics.find((candidate) => candidate.id === topicId)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [active, setActive] = useState<ActiveRun | null>(null)

  const path = useMemo(() => (topic ? morseLessonPath(topic) : null), [topic])
  const checkpoints = useMemo(() => (topic ? morseWordCheckpointPath(topic) : null), [topic])

  useEffect(() => {
    if (!active) headingRef.current?.focus({ preventScroll: true })
  }, [active])

  if (!topic || !path || !checkpoints) {
    return (
      <section className="session morse-lesson">
        <h1>Morse lesson unavailable</h1>
        <button type="button" onClick={onExit}>Back to today</button>
      </section>
    )
  }

  if (active?.kind === 'checkpoint') {
    return <MorseCheckpoint checkpoint={active.checkpoint} onExit={() => setActive(null)} />
  }

  if (active?.kind === 'lesson' && active.replay) {
    return <MorseReplay initialRun={active.run} onExit={() => setActive(null)} />
  }

  if (active?.kind === 'lesson') {
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
  const checkpointAfter = new Map<number, MorseWordCheckpointPathItem>(
    checkpoints.map((checkpoint) => [checkpoint.afterLesson, checkpoint]),
  )

  function continueCurrent() {
    if (!topic) return
    const run = startLesson(topic)
    if (run) setActive({ kind: 'lesson', run, replay: false })
  }

  function replay(index: number) {
    if (!topic) return
    const run = startReplayLesson(topic, index)
    if (run) setActive({ kind: 'lesson', run, replay: true })
  }

  function startCheckpoint(checkpoint: MorseWordCheckpointPathItem) {
    if (!checkpoint.unlocked) return
    setActive({ kind: 'checkpoint', checkpoint })
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
          refresher, with small word checkpoints after lessons 4 and 7.
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
          const checkpoint = checkpointAfter.get(lesson.number)
          return (
            <Fragment key={lesson.index}>
              <li
                className={`morse-path-item morse-path-lesson is-${lesson.state}`}
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

              {checkpoint && (
                <li className={`morse-path-item morse-path-checkpoint${checkpoint.unlocked ? ' is-unlocked' : ' is-locked'}`}>
                  <span className="morse-path-number morse-path-checkpoint-mark" aria-hidden="true">CP</span>
                  <span className="morse-path-main">
                    <span className="morse-path-new-label">Word checkpoint</span>
                    <strong className="morse-path-checkpoint-title">After lesson {checkpoint.afterLesson}</strong>
                  </span>
                  <span className="morse-path-status">{checkpoint.unlocked ? 'Available' : 'Locked'}</span>
                  <button
                    className="ghost small morse-path-action"
                    type="button"
                    disabled={!checkpoint.unlocked}
                    aria-label={checkpoint.unlocked
                      ? `Start word checkpoint after lesson ${checkpoint.afterLesson}`
                      : `Word checkpoint after lesson ${checkpoint.afterLesson} locked`}
                    onClick={() => startCheckpoint(checkpoint)}
                  >
                    {checkpoint.unlocked ? 'Start' : 'Locked'}
                  </button>
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>

      <p className="morse-programme-foot">
        Replays and word checkpoints are formative review only. Formal A–Z evidence is still earned in Test.
      </p>
    </section>
  )
}
