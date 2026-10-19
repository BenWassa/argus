import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { journeyFor } from '../../domain/study/journey'
import { resolveStudy } from '../../domain/study/scheduling'
import { useLibrary } from '../../services/library/LibraryProvider'
import { morseProgressPath } from '../../domain/morse/curriculum/progressPath'
import { statusLabel } from '../../shared/ui/StatusTag'
import { ScreenHeader } from '../../shared/ui/ScreenHeader'
import { ProgressSpine, type SpineRow, type SpineState } from '../../shared/ui/ProgressSpine'
import { ModeTray } from '../../shared/ui/ModeTray'
import { topicIcon } from './topicIcon'
import { TopicGlyph } from './TopicGlyph'
import { settledCount, topicItemGroups, type ItemStanding, type TopicItemEntry } from './topicItems'
import { SourcesAndLimits } from '../learn/SourcesAndLimits'
import { hasReading } from '../learn/TopicReading'
import { VisualView } from '../visual/VisualView'
import { listeningCoverage } from '../../domain/audio/evidence'
import { AudioReference } from '../audio/AudioReference'
import { MorseProgressPath, MorseModeTray, morseRunAction } from '../morse/play'
import { MorsePlacementDialog } from '../morse/MorsePlacementDialog'
import { applyMorsePlacement, canOfferMorsePlacement } from '../../domain/morse/placement'
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

/** Morse opens on its path; ordinary topics open on their items, with the same screen kit. */
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
  const repair = journey.phase === 'repair'
  const banked = !repair && (topic.status === 'completed' || topic.status === 'drilled')
  const settled = course ? 0 : settledCount(topic)
  const listening = listeningCoverage(topic.items, topic.audioEvidence)
  const practiceCount = hasPractice(topic) ? practiceItemCount(topic) : 0
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

  return (
    <article className={`topic topic-track-${topic.track}${course ? ' topic-morse' : ''}`}>
      {course && <span ref={top} className="topic-morse-top" aria-hidden="true" />}
      {course ? <ScreenHeader ref={heading} titleClassName="topic-title" title={topic.title}
        className={`topic-morse-header${compact ? ' is-compact' : ''}`}
        onBack={onBack}
        actions={<button className="quiet topic-morse-reference" type="button" onClick={() => onReference(topic.id)}>A–Z</button>}
        progress={{ value: journey.acquisition.settled, max: 26, label: `${journey.acquisition.settled} of 26 letters` }}
        readout={`${journey.acquisition.settled} / 26`} /> : <ScreenHeader ref={heading} titleClassName="topic-title" title={topic.title}
        className={banked ? 'is-banked' : undefined}
        onBack={onBack}
        glyph={topicIcon(topic.id) ? <TopicGlyph topicId={topic.id} /> : undefined}
        progress={runnable ? { value: settled, max: topic.items.length, label: `${settled} of ${topic.items.length} ${topic.items.length === 1 ? 'item' : 'items'} settled` } : undefined}
        readout={runnable ? `${settled} / ${topic.items.length}` : undefined}>
        <p className={`topic-state${repair ? ' is-repair' : banked ? ' is-banked' : ''}`}>
          {repair ? <span className="topic-state-mark" aria-hidden="true">◆</span> : banked ? <span className="topic-state-mark" aria-hidden="true">✓</span> : null}
          <span className="topic-state-label">{journey.statusLabel}</span>
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
        <TopicTray topic={topic} label={repair ? 'Repair' : banked ? 'Test again' : 'Test'}
          practiceCount={practiceCount} onStart={onStart} onReference={onReference} />
        <TopicItems topic={topic} />
      </> : null}

      {!course && topic.history.length > 0 && <AttemptPips topic={topic} />}
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

const SPINE_STATE: Record<ItemStanding, SpineState> = {
  settled: 'done',
  repair: 'repair',
  missed: 'reached',
  seen: 'reached',
  unseen: 'reached',
}

const STANDING_WORDS: Record<ItemStanding, string> = {
  settled: 'settled',
  repair: 'needs repair',
  missed: 'missed last time',
  seen: 'tested',
  unseen: 'not tested yet',
}

/** A group's node takes the weakest standing among its items. */
function groupState(entries: TopicItemEntry[]): SpineState {
  if (entries.some(entry => entry.standing === 'repair')) return 'repair'
  return entries.length > 0 && entries.every(entry => entry.standing === 'settled') ? 'done' : 'reached'
}

/**
 * The complete scored set as reading, one row per item on the shared spine.
 * There is no forced path, so no row is the position; rows are not controls.
 */
function TopicItems({ topic }: { topic: Topic }) {
  const groups = topicItemGroups(topic)
  const rows: SpineRow[] = groups.flatMap((group, groupIndex) => {
    const heading: SpineRow[] = group.label ? [{
      id: `group-${groupIndex}`,
      shape: 'square',
      state: groupState(group.entries),
      label: group.label,
      accessibleLabel: `${group.label}, ${group.entries.length} ${group.entries.length === 1 ? 'rule' : 'rules'}`,
      group: true,
      plate: true,
      className: `topic-item-group${group.entries.every(entry => entry.standing === 'unseen') ? ' is-unseen' : ''}`,
    }] : []
    return [...heading, ...group.entries.map(({ item, marker, standing }, index): SpineRow => {
      const visual = Boolean(item.stimulus || item.audio)
      return {
        id: item.id ?? `${groupIndex}-${index}`,
        shape: 'round',
        mark: standing === 'settled' && !group.label ? '✓' : marker,
        state: SPINE_STATE[standing],
        // A pictured item's picture is its prompt; the authored question
        // wording is for the Test card, so the row names the answer.
        label: item.stimulus ? item.answer : item.prompt,
        detail: item.stimulus ? undefined : item.answer,
        accessibleLabel: `${item.prompt}: ${item.answer}, ${STANDING_WORDS[standing]}`,
        group: true,
        className: `topic-item is-${standing}${visual ? ' has-visual' : ''}`,
        after: visual ? <div className="topic-item-visual">
          {item.stimulus && <VisualView visual={item.stimulus} compact />}
          {item.audio && <AudioReference item={item as typeof item & { audio: NonNullable<typeof item.audio> }} />}
        </div> : undefined,
      }
    })]
  })
  return <ProgressSpine rows={rows} label="Items" className="topic-items" />
}

/** An open page: the reading this topic carries. */
const PAGE = <svg width="40" height="28" viewBox="0 0 40 28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" focusable="false">
  <path d="M20 6C15 2.5 8 2 3 3v21c5-1 12-.5 17 3 5-3.5 12-4 17-3V3c-5-1-12-.5-17 3Z" />
  <path d="M20 6v21" />
</svg>

interface TopicTrayProps {
  topic: Topic
  label: string
  practiceCount: number
  onStart: TopicPageProps['onStart']
  onReference: TopicPageProps['onReference']
}

/** Learn and Practice in the topic's track colour; Test in the action colour. */
function TopicTray({ topic, label, practiceCount, onStart, onReference }: TopicTrayProps) {
  return (
    <ModeTray label="Study" className="topic-tray" tiles={[
      {
        id: 'learn',
        label: 'Learn',
        stimulus: PAGE,
        colour: 'var(--topic-track)',
        ink: 'var(--topic-track-ink)',
        disabled: !hasReading(topic),
        onSelect: () => onReference(topic.id),
      },
      {
        id: 'practice',
        label: 'Practice',
        stimulus: <span className="topic-tile-count">{practiceCount || '—'}</span>,
        colour: 'var(--topic-track)',
        ink: 'var(--topic-track-ink)',
        disabled: practiceCount === 0,
        onSelect: () => onStart('learn', [topic.id], { kind: 'practice' }),
      },
      {
        id: 'test',
        label,
        stimulus: <span className="topic-tile-count">{topic.items.length}</span>,
        colour: 'var(--action)',
        ink: 'var(--action-ink)',
        onSelect: () => onStart('test', [topic.id]),
      },
    ]} />
  )
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
