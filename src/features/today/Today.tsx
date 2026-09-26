import type { CSSProperties } from 'react'
import { useLibrary } from '../../services/library/LibraryProvider'
import {
  dueEntries,
  journeysFor,
  launchFor,
  type JourneyEntry,
} from '../../domain/study/journey'
import { hasStarted } from '../../domain/study/libraryGroups'
import type { RunTarget } from '../../app/routing/routes'
import { resolveStudy } from '../../domain/study/scheduling'
import type { Mode } from '../../domain/study/mode'
import { TopicGauge } from '../library/TopicGauge'
import './Today.css'

const WORDS = [
  'no', 'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
]

/** How many plates Today shows. Today is the few things already in motion,
 *  not the library again; everything else is one tap away in Library. */
const TODAY_VISIBLE = 3

/** Small counts read as prose. Past twelve the numeral is clearer than the word. */
function count(n: number): string {
  return n <= 12 ? WORDS[n] : String(n)
}

function topicCount(n: number): string {
  return `${count(n)} ${n === 1 ? 'topic' : 'topics'}`
}

function sentence(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function militaryDate(date: Date): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * What Today holds: topics the learner has already started and that are still
 * in motion. Due ones first, in the schedule's own ranking, then the ones
 * waiting out a gap, soonest first. A banked topic resting between spot checks
 * is not in motion and stays in Library until its check comes due; a topic
 * nobody has started is Library's to offer, not Today's.
 */
export function inProgress(entries: JourneyEntry[]): JourneyEntry[] {
  const started = entries.filter((entry) => entry.topic.items.length > 0 && hasStarted(entry))
  const due = dueEntries(started)
  const dueIds = new Set(due.map((entry) => entry.topic.id))
  const waiting = started
    .filter((entry) => !dueIds.has(entry.topic.id) && entry.topic.status !== 'completed')
    .sort(
      (a, b) =>
        a.journey.waitDays - b.journey.waitDays || a.topic.title.localeCompare(b.topic.title),
    )
  return [...due, ...waiting]
}

/** Mirrors the seeded library, so the empty state teaches the shape of a topic
 *  rather than restating the rule in the abstract. */
const PRIMER = [
  {
    title: 'NATO Alphabet',
    scope: 'The 26 letters A to Z and their code words. Nothing else.',
  },
  {
    title: 'Primary Survey',
    scope: 'The five ABCDE steps in assessment order.',
  },
  {
    title: 'Compass Bearings',
    scope: 'The eight compass points and their degree values.',
  },
]

interface TodayProps {
  onStart: (mode: Mode, topicIds: string[], target?: RunTarget) => void
  onOpenTopic: (topicId: string) => void
  onGoToLibrary: () => void
  onOpenProfile: () => void
}

export function Today({ onStart, onOpenTopic, onGoToLibrary, onOpenProfile }: TodayProps) {
  const { topics, updateTopic } = useLibrary()
  const stamp = militaryDate(new Date())

  // One derivation for the whole page. Today asks the journey layer what each
  // topic needs rather than reading status and reaching its own conclusion, so
  // the verb here and the verb in Library are the same value, not two rules that
  // happen to agree.
  const entries = journeysFor(topics)
  const practicable = entries.filter((entry) => entry.topic.items.length > 0)

  // Nothing authored yet. Teach the entry gate rather than showing a blank.
  if (topics.length === 0) {
    return (
      <>
        <Head stamp={stamp} onProfile={onOpenProfile} />
        <p className="today-note">
          Argus holds topics that can be genuinely finished. Every one states its own boundary
          before it can exist, and that boundary is what makes finishing possible.
        </p>

        <h2 className="primer-head">What a topic looks like</h2>
        <ul className="primer">
          {PRIMER.map((example) => (
            <li key={example.title}>
              <span className="primer-title">{example.title}</span>
              <span className="primer-scope">{example.scope}</span>
            </li>
          ))}
        </ul>

        <div className="today-actions">
          <button className="today-go" type="button" onClick={onGoToLibrary}>
            Create the first topic
          </button>
        </div>
      </>
    )
  }

  // Topics exist but none of them can be run. Say so, rather than offering a
  // Test button with nothing behind it.
  if (practicable.length === 0) {
    return (
      <>
        <Head stamp={stamp} onProfile={onOpenProfile} />
        <p className="today-note">
          {sentence(topicCount(topics.length))} in the library, none with any items yet. A topic
          needs its prompts and answers before it can be read or tested.
        </p>
        <div className="today-actions">
          <button className="today-go" type="button" onClick={onGoToLibrary}>
            Add items in the library
          </button>
        </div>
      </>
    )
  }

  const active = inProgress(entries)

  // Nothing in motion. Either nothing has been started, which Library is for,
  // or everything started is banked and resting until a spot check is due.
  if (active.length === 0) {
    const anyStarted = practicable.some(hasStarted)
    return (
      <>
        <Head stamp={stamp} onProfile={onOpenProfile} />
        <p className="today-note">
          {anyStarted
            ? 'Everything you have started is banked. A topic comes back here when its spot check is due.'
            : 'Nothing started yet. Start a topic in the Library and it will be here while you learn it.'}
        </p>
        {!anyStarted && (
          <div className="today-actions">
            <button className="ghost" type="button" onClick={onGoToLibrary}>
              Open Library
            </button>
          </div>
        )}
      </>
    )
  }

  // A due plate does its work; the journey decides the action and `launchFor`
  // what it does. A plate that is not due opens its topic instead: an early
  // Test is scored, and the topic page is where that consequence is stated.
  function press(entry: JourneyEntry) {
    if (!entry.journey.due) {
      onOpenTopic(entry.topic.id)
      return
    }
    const target = launchFor(entry.journey)
    if (target.kind === 'author') {
      onOpenTopic(entry.topic.id)
      return
    }
    if (target.kind === 'enroll') {
      updateTopic(entry.topic.id, (current) => resolveStudy(current))
      onOpenTopic(entry.topic.id)
      return
    }
    onStart(
      target.mode,
      [entry.topic.id],
      target.mode === 'learn' ? { kind: 'lesson' } : undefined,
    )
  }

  const visible = active.slice(0, TODAY_VISIBLE)
  const leadId = visible[0].journey.due ? visible[0].topic.id : null

  return (
    <>
      <Head stamp={stamp} onProfile={onOpenProfile} />

      {!leadId && (
        <p className="today-note">Recall needs the gap to mean anything, so the schedule is holding.</p>
      )}

      {/* A few large plates and nothing else: no batch button, no counts. The
          plate is the control, and the first due plate is the day's key. */}
      <ul className="index docket">
        {visible.map((entry, order) => (
          <TodayPlate
            key={entry.topic.id}
            entry={entry}
            order={order}
            lead={entry.topic.id === leadId}
            onPress={() => press(entry)}
          />
        ))}
      </ul>
    </>
  )
}

/** The Argus wordmark anchors the page while the docket below names the work. */
function Head({
  stamp,
  onProfile,
}: {
  stamp: string
  onProfile: () => void
}) {
  return (
    <div className="today-head">
      <h1 className="today-brand" aria-live="polite">
        ARGUS
      </h1>
      <div className="today-head-tools">
        <p className="today-date tabular">{stamp}</p>
        <button
          className="today-profile"
          type="button"
          aria-label="Open profile"
          title="Profile"
          onClick={onProfile}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
            <circle cx="12" cy="8" r="3.25" />
            <path d="M5.75 19c.6-3.25 2.68-5 6.25-5s5.65 1.75 6.25 5" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/**
 * One topic in motion, as a plate. It says why it is here in the schedule's
 * own words when it is due, and only that it is waiting when it is not: the
 * gauge shows how far along it is, and Today states no quantities.
 */
function TodayPlate({
  entry,
  order,
  lead,
  onPress,
}: {
  entry: JourneyEntry
  order: number
  lead: boolean
  onPress: () => void
}) {
  const { topic, journey } = entry
  const repair = journey.phase === 'repair'
  const style = { '--track-hue': `var(--${topic.track})`, '--order': order } as CSSProperties

  return (
    <li className="today-entry" style={style}>
      <button
        type="button"
        className="index-row today-plate"
        data-due={journey.due || undefined}
        data-lead={lead || undefined}
        data-repair={repair || undefined}
        onClick={onPress}
      >
        <span className="sr-only">{journey.due ? journey.actionLabel : 'Open'}: </span>
        <span className="track-stud" aria-hidden="true" />
        <span className="index-title today-plate-title">{topic.title}</span>
        <span className={`due-reason${repair ? ' is-repair' : ''}`}>
          {journey.due ? journey.statusLabel : 'Not due yet'}
        </span>
        <TopicGauge topic={topic} journey={journey} variant="bare" />
      </button>
    </li>
  )
}
