import { useLayoutEffect, useRef, useState } from 'react'
import { journeyFor } from '../../domain/study/journey'
import { resolveStudy } from '../../domain/study/scheduling'
import { useLibrary } from '../../services/library/LibraryProvider'
import { morseProgressPath } from '../../domain/morse/curriculum/progressPath'
import { statusLabel } from '../../shared/ui/StatusTag'
import { topicIcon } from './topicIcon'
import { sequenceFor } from '../../domain/library/catalog'
import { LearnSupport } from '../learn/LearnSupport'
import { SourcesAndLimits } from '../learn/SourcesAndLimits'
import { VisualView } from '../visual/VisualView'
import { listeningCoverage } from '../../domain/audio/evidence'
import { AudioReference } from '../audio/AudioReference'
import { MorseProgressPath, MorseModeTray, morseRunAction } from '../morse/play'
import { MorsePlacementDialog } from '../morse/MorsePlacementDialog'
import { applyMorsePlacement, canOfferMorsePlacement } from '../../domain/morse/placement'
import '../learn/Reading.css'
import type { RunTarget } from '../../app/routing/routes'
import { hasPractice, practiceItemCount } from '../../domain/study/practiceTargets'
import type { Mode } from '../../domain/study/mode'
import type { Topic } from '../../domain/library/topic'
import './TopicPage.css'

interface TopicPageProps {
  topic: Topic
  onBack: () => void
  onStart: (mode: Mode, topicIds: string[], target?: RunTarget) => void
  onReference: (topicId: string) => void
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

/** Morse opens on its path; ordinary topics keep their complete reference. */
export function TopicPage({
  topic,
  onBack,
  onStart,
  onReference,
  onEdit,
  onDelete,
}: TopicPageProps) {
  const { updateTopic } = useLibrary()
  const heading = useRef<HTMLHeadingElement>(null)
  const actionBar = useRef<HTMLDivElement>(null)
  const [placementOpen, setPlacementOpen] = useState(false)
  const runnable = topic.items.length > 0
  const path = runnable ? morseProgressPath(topic) : null
  const course = Boolean(path)
  const sequence = sequenceFor(topic)
  // Browsing reads the durable record without starting acquisition or Test.
  const journey = journeyFor(topic)
  const listening = listeningCoverage(topic.items, topic.audioEvidence)
  const practiceCount = hasPractice(topic) ? practiceItemCount(topic) : 0
  const offersPlacement = path?.nodes.some(node => node.kind === 'start' && node.offersPlacement) && canOfferMorsePlacement(topic)

  useLayoutEffect(() => {
    const bar = actionBar.current
    if (!bar) return
    const reserve = () => bar.closest<HTMLElement>('.topic')?.style.setProperty(
      '--topic-action-height', `${bar.getBoundingClientRect().height}px`,
    )
    reserve()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(reserve)
    observer?.observe(bar)
    return () => observer?.disconnect()
  }, [runnable, course])

  useLayoutEffect(() => {
    // Keep the path's initial current-row scroll when focusing its page title.
    heading.current?.focus({ preventScroll: course })
  }, [topic.id, course])

  function startMorse(action: Parameters<typeof morseRunAction>[0]) {
    // Start is the existing New-to-Morse choice; Skip ahead owns placement.
    if (action.kind === 'start-lesson' && canOfferMorsePlacement(topic)) {
      updateTopic(topic.id, current => resolveStudy(current))
    }
    const run = morseRunAction(action)
    if (run.target) onStart(run.mode, [topic.id], run.target)
    else onStart(run.mode, [topic.id])
  }

  return (
    <article className={`topic topic-track-${topic.track}${course ? ' topic-morse' : ''}`}>
      <div className={course ? 'topic-morse-controls' : undefined}>
        <button className="quiet topic-back" type="button" aria-label="Back to previous screen" onClick={onBack}>
          <span aria-hidden="true">←</span> Back
        </button>
        {course && <button className="quiet topic-morse-reference" type="button" onClick={() => onReference(topic.id)}>A–Z</button>}
      </div>
      {!course && <TopicHero topic={topic} />}
      <header className="topic-head">
        <h1 ref={heading} tabIndex={-1} className="topic-title">{topic.title}</h1>
        {course ? <>
          <div className="topic-morse-progress">
            <div className="topic-morse-progress-track" role="img" aria-label={`${journey.acquisition.settled} of 26 letters`}>
              <span style={{ width: `${journey.acquisition.settled / 26 * 100}%` }} />
            </div>
            <span className="topic-morse-count">{journey.acquisition.settled} / 26</span>
          </div>
          {offersPlacement && <button className="quiet topic-morse-placement" type="button" onClick={() => setPlacementOpen(true)}>Skip ahead</button>}
        </> : <>
          <p className="topic-scope">{sequence && topic.track !== 'survival' ? `${topic.items.length} rules, in order.` : topic.scope}</p>
          <p className="topic-state">
            <span className="topic-state-meta tabular">{topic.items.length} {topic.items.length === 1 ? 'item' : 'items'}</span>
            <span className={`topic-state-label${journey.phase === 'repair' ? ' is-repair' : topic.status === 'completed' || topic.status === 'drilled' ? ' is-banked' : ''}`}>{journey.statusLabel}</span>
          </p>
          {listening.total > 0 && <p className="topic-detail topic-listening">Listening: {listening.unaided} of {listening.total} answered by ear, unaided</p>}
        </>}
      </header>

      {!runnable && <div className="topic-unfinished">
        <p>This topic has no items yet. Add them as <code>prompt | answer</code>, one per line.</p>
        <button type="button" onClick={onEdit}>Add items</button>
      </div>}

      {course ? <>
        <div ref={actionBar} className="topic-morse-tray">
          <MorseModeTray topic={topic} onStart={(_mode, entry) => { if (entry) startMorse(entry) }} />
        </div>
        <MorseProgressPath topic={topic} onAction={startMorse} showJump={false} />
      </> : runnable ? <section className="topic-body" aria-labelledby="topic-reference-head">
        <RecallReference topic={topic} heading="What to remember" />
        {topic.learn && <LearnSupport content={topic.learn} />}
      </section> : null}

      {!course && runnable && practiceCount > 0 && <section className="topic-options" aria-labelledby="topic-options-head">
        <h2 id="topic-options-head">More options</h2>
        <div className="topic-alternates">
          <button className="quiet topic-alt" type="button" onClick={() => onStart('learn', [topic.id], { kind: 'practice' })}>
            Practise the {practiceCount} {practiceCount === 1 ? 'item' : 'items'} you missed
          </button>
        </div>
      </section>}

      {!course && runnable && <div ref={actionBar} className={`topic-action-bar${journey.phase === 'repair' ? ' is-repair' : topic.status === 'completed' || topic.status === 'drilled' ? ' is-banked' : ''}`}>
        <button className="topic-primary" type="button" onClick={() => onStart('test', [topic.id])}>
          {journey.phase === 'repair' ? 'Repair' : topic.status === 'completed' || topic.status === 'drilled' ? 'Test again' : 'Test'}
        </button>
      </div>}

      {!course && topic.history.length > 0 && <section className="topic-history">
        <h2>History, {topic.history.length} {topic.history.length === 1 ? 'attempt' : 'attempts'}</h2>
        <ol className="topic-history-list">
          {[...topic.history].reverse().map(attempt => <li key={attempt.at}>
            <span className="tabular">{stamp(attempt.at)}</span>
            <span className="tabular">{attempt.correct}/{attempt.total}</span>
            <span className="topic-history-resolved">{statusLabel(attempt.resolvedTo)}</span>
          </li>)}
        </ol>
      </section>}
      {!course && topic.completedAt && <p className="topic-earned">First completed · {stamp(topic.completedAt)}</p>}
      <div className="topic-admin">
        <button className="quiet" type="button" onClick={onEdit}>{course ? 'Edit' : 'Edit topic'}</button>
        <button className="quiet is-danger" type="button" onClick={onDelete}>{course ? 'Delete' : 'Delete topic'}</button>
      </div>
      <SourcesAndLimits content={topic.learn} scope={topic.scope} />
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

function TopicHero({ topic }: { topic: Topic }) {
  const icon = topicIcon(topic.id)
  return (
    <div className="topic-hero">
      {topic.hero ? <VisualView key={topic.id} visual={topic.hero} /> : (
        <div className="topic-hero-fallback" aria-hidden="true">
          {icon ? <img src={icon} alt="" /> : <span>{topic.title.slice(0, 1)}</span>}
        </div>
      )}
    </div>
  )
}

/** The complete scored set, as reading. */
function RecallReference({ topic, heading }: { topic: Topic; heading: string }) {
  const groups = sequenceFor(topic)?.groups
  const sets = groups ? groups.map(group => ({
    label: group.label,
    entries: group.itemIds.map((id, i) => ({ item: topic.items.find(item => item.id === id)!, marker: Array.from(group.letters)[i] })),
  })) : [{ label: undefined, entries: topic.items.map((item, i) => ({ item, marker: String(i + 1).padStart(2, '0') })) }]
  return (
    <div className="topic-reference">
      <h2 id="topic-reference-head" className="topic-reference-head">{heading}</h2>
      {sets.map((set, groupIndex) => <div className="topic-recall-group" key={set.label ?? groupIndex}>
      {set.label && <h3 className="topic-recall-group-label">{set.label}</h3>}
      <ol className="topic-recall-cards">
        {set.entries.map(({ item, marker }, i) => (
          <li key={item.id ?? `${item.prompt}-${i}`} className={item.stimulus || item.audio ? 'has-visual' : undefined}>
            <span className="topic-recall-marker tabular">{marker}</span>
            {item.stimulus && (
              <div className="sheet-visual">
                <VisualView visual={item.stimulus} compact />
              </div>
            )}
            {item.audio && (
              <div className="sheet-visual">
                <AudioReference item={item as typeof item & { audio: NonNullable<typeof item.audio> }} />
              </div>
            )}
            <span className="topic-recall-prompt">{item.prompt}</span>
            <span className="topic-recall-answer">{item.answer}</span>
          </li>
        ))}
      </ol>
      </div>)}
    </div>
  )
}
