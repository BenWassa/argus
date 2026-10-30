import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { journeyFor } from '../../domain/study/journey'
import { resolveStudy } from '../../domain/study/scheduling'
import { useLibrary } from '../../services/library/LibraryProvider'
import { morseProgressPath } from '../../domain/morse/curriculum/progressPath'
import { statusLabel } from '../../shared/ui/StatusTag'
import { ScreenHeader } from '../../shared/ui/ScreenHeader'
import { ProgressSpine, type SpineRow } from '../../shared/ui/ProgressSpine'
import { ModeTray } from '../../shared/ui/ModeTray'
import { topicIcon } from './topicIcon'
import { TopicGlyph } from './TopicGlyph'
import { topicBar } from './topicItems'
import { curriculumFor } from '../../domain/learning/generatedCurriculum'
import { nextStage, stageDone } from '../../domain/learning/stageProgress'
import { SourcesAndLimits } from '../learn/SourcesAndLimits'
import { listeningCoverage } from '../../domain/audio/evidence'
import { MorseProgressPath, MorseModeTray, morseRunAction } from '../morse/play'
import { MorsePlacementDialog } from '../morse/MorsePlacementDialog'
import { applyMorsePlacement, canOfferMorsePlacement } from '../../domain/morse/placement'
import type { RunTarget } from '../../app/routing/routes'
import type { Mode } from '../../domain/study/mode'
import type { Topic } from '../../domain/library/topic'
import './TopicPage.css'

interface TopicPageProps {
  topic: Topic
  onBack: () => void
  onStart: (mode: Mode, topicIds: string[], target?: RunTarget) => void
  onReference: (topicId: string) => void
  onEdit: () => void
}

function stamp(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Each topic opens on its learning path; Morse retains its dedicated engine. */
export function TopicPage({
  topic,
  onBack,
  onStart,
  onReference,
  onEdit,
}: TopicPageProps) {
  const { updateTopic } = useLibrary()
  const heading = useRef<HTMLHeadingElement>(null)
  const [placementOpen, setPlacementOpen] = useState(false)
  // Morse opens scrolled to its position; once the page is scrolled at all,
  // its header pins in compact form so the title and n / 26 stay in view.
  const top = useRef<HTMLSpanElement>(null)
  const [compact, setCompact] = useState(false)
  const runnable = topic.items.length > 0
  const path = runnable ? morseProgressPath(topic) : null
  const course = Boolean(path)
  // Browsing reads the durable record without starting acquisition or Test.
  const journey = journeyFor(topic)
  const banked = journey.phase === 'banked'
  const bar = course ? null : topicBar(topic)
  const listening = listeningCoverage(topic.items, topic.audioEvidence)
  const curriculum = curriculumFor(topic)
  const next = curriculum && nextStage(topic, curriculum)
  const stateLabel = curriculum && !banked
    ? `Lesson ${next ? curriculum.stages.indexOf(next) + 1 : curriculum.stages.length} of ${curriculum.stages.length}`
    : journey.statusLabel
  const offersPlacement = path?.nodes.some(node => node.kind === 'start' && node.offersPlacement) && canOfferMorsePlacement(topic)

  useLayoutEffect(() => {
    // Keep the path's initial current-row scroll when focusing its page title.
    heading.current?.focus({ preventScroll: course })
  }, [topic.id, course])

  useEffect(() => {
    const sentinel = top.current
    if (!course || !sentinel || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting && entry.boundingClientRect.top < 0))
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [course])

  function startMorse(action: Parameters<typeof morseRunAction>[0]) {
    // Start is the existing New-to-Morse choice; Skip ahead owns placement.
    if (action.kind === 'start-lesson' && canOfferMorsePlacement(topic)) {
      updateTopic(topic.id, current => resolveStudy(current))
    }
    const run = morseRunAction(action)
    if (run.target) onStart(run.mode, [topic.id], run.target)
    else onStart(run.mode, [topic.id])
  }

  // Edit remains a quiet header action, with its full accessible name.
  const editAction = <button className="quiet topic-edit" type="button" aria-label="Edit topic" onClick={onEdit}>Edit</button>

  return (
    <article className={`topic topic-track-${topic.track}${course ? ' topic-morse' : ''}`}>
      {course && <span ref={top} className="topic-morse-top" aria-hidden="true" />}
      {course ? <ScreenHeader ref={heading} titleClassName="topic-title" title={topic.title}
        className={`topic-morse-header${compact ? ' is-compact' : ''}`}
        onBack={onBack}
        actions={<>
          <button className="quiet topic-morse-reference" type="button" onClick={() => onReference(topic.id)}>A–Z</button>
          {editAction}
        </>}
        progress={{ value: journey.acquisition.settled, max: 26, label: `${journey.acquisition.settled} of 26 letters` }}
        readout={`${journey.acquisition.settled} / 26`} /> : <ScreenHeader ref={heading} titleClassName="topic-title" title={topic.title}
        className={banked ? 'is-banked' : undefined}
        onBack={onBack}
        actions={editAction}
        glyph={topicIcon(topic.id) ? <TopicGlyph topicId={topic.id} /> : undefined}
        progress={bar ?? undefined}
        readout={curriculum && !banked ? stateLabel : bar ? `${bar.value} / ${bar.max}` : undefined}>
        <p className={`topic-state${banked ? ' is-banked' : ''}`}>
          {banked ? <span className="topic-state-mark" aria-hidden="true">✓</span> : null}
          <span className="topic-state-label">{curriculum && !banked ? null : stateLabel}</span>
        </p>
        {listening.total > 0 && <p className="topic-listening">Listening · {listening.unaided} / {listening.total} unaided</p>}
      </ScreenHeader>}

      {!runnable && <div className="topic-unfinished">
        <p>This topic has no items yet. Add them as <code>prompt | answer</code>, one per line.</p>
        <button type="button" onClick={onEdit}>Add items</button>
      </div>}

      {course ? <>
        <MorseModeTray className="topic-morse-tray" topic={topic} onStart={(_mode, entry) => { if (entry) startMorse(entry) }} />
        <MorseProgressPath topic={topic} onAction={startMorse} showJump={false}
          onPlacement={offersPlacement ? () => setPlacementOpen(true) : undefined} />
      </> : runnable ? <>
        {curriculum && <LessonPath topic={topic} curriculum={curriculum} onStart={onStart} onReference={onReference} />}

      </> : null}

      {!course && topic.history.length > 0 && <AttemptPips topic={topic} />}
      {!course && topic.completedAt && <p className="topic-earned">First completed · {stamp(topic.completedAt)}</p>}
      <footer className="topic-foot">
        <SourcesAndLimits content={topic.learn} scope={topic.scope} />
      </footer>
      {placementOpen && course && <MorsePlacementDialog topic={topic}
        onClose={() => setPlacementOpen(false)}
        onNew={() => {
          updateTopic(topic.id, current => resolveStudy(current))
          setPlacementOpen(false)
          onStart('learn', [topic.id], { kind: 'lesson' })
        }}
        onCommit={result => updateTopic(topic.id, current => applyMorsePlacement(current, result))}
        onContinue={result => {
          setPlacementOpen(false)
          if (result.nextLesson !== null) onStart('learn', [topic.id], { kind: 'lesson' })
        }}
      />}
    </article>
  )
}

function LessonPath({ topic, curriculum, onStart, onReference }: {
  topic: Topic
  curriculum: NonNullable<ReturnType<typeof curriculumFor>>
  onStart: TopicPageProps['onStart']
  onReference: TopicPageProps['onReference']
}) {
  const next = nextStage(topic, curriculum)
  const allDone = !next
  const review = Boolean(topic.completedAt) || allDone
  const lesson = next ?? curriculum.stages[0]
  const startLesson = (stageId: string) => onStart('learn', [topic.id], { kind: 'stage', stageId })
  const rows: SpineRow[] = curriculum.stages.map((stage, index) => {
    const done = stageDone(topic, stage.id)
    const state = done ? 'done' : stage.id === next?.id ? 'position' : 'reached'
    return { id: stage.id, shape: 'round', state, mark: done ? '✓' : index + 1,
      label: stage.title, accessibleLabel: `${stage.title}, ${done ? 'done' : state === 'position' ? 'current' : 'upcoming'}`,
      onSelect: () => startLesson(stage.id) }
  })
  rows.push({ id: 'final-test', shape: 'square', state: 'reached', label: 'Final Test', accessibleLabel: 'Final Test',
    onSelect: () => onStart('test', [topic.id]) })
  return <>
    <ProgressSpine rows={rows} label="Lessons" className="topic-lessons" />
    <div className="topic-lesson-actions">
      <ModeTray label="Study" className="topic-tray" tiles={[{
        id: allDone ? 'test' : 'lesson', label: allDone ? 'Final Test' : review ? 'Review' : Object.keys(topic.stageProgress ?? {}).length ? 'Continue' : 'Start',
        stimulus: <span className="topic-tile-count">{allDone ? '✓' : curriculum.stages.indexOf(lesson) + 1}</span>,
        colour: allDone ? 'var(--surface-2)' : 'var(--action)', ink: allDone ? 'var(--ink)' : 'var(--action-ink)',
        onSelect: allDone ? () => onStart('test', [topic.id]) : () => startLesson(lesson.id),
      }]} />
      {allDone && <button type="button" className="quiet" onClick={() => startLesson(curriculum.stages[0].id)}>Review</button>}
      <button type="button" className="quiet topic-reference" onClick={() => onReference(topic.id)}>Reference</button>
    </div>
  </>
}

/** Every attempt as one pip, filled to its score. A reading, not a list to scan. */
function AttemptPips({ topic }: { topic: Topic }) {
  const count = topic.history.length
  return (
    <section className="topic-history" aria-labelledby="topic-history-head">
      <h2 id="topic-history-head" className="topic-history-head">{count} {count === 1 ? 'attempt' : 'attempts'}</h2>
      <ol className="topic-pips">
        {topic.history.map((attempt, index) => {
          const share = attempt.total > 0 ? Math.max(0, Math.min(1, attempt.correct / attempt.total)) : 0
          return <li key={`${attempt.at}-${index}`}>
            <span className="topic-pip" role="img"
              aria-label={`${stamp(attempt.at)}: ${attempt.correct} of ${attempt.total}, ${statusLabel(attempt.resolvedTo)}`}>
              <span style={{ height: `${share * 100}%` }} />
            </span>
          </li>
        })}
      </ol>
    </section>
  )
}
