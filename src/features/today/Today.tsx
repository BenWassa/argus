import { useState } from 'react'
import { useLibrary } from '../../services/library/LibraryProvider'
import {
  dueEntries,
  journeysFor,
  launchFor,
  TEST_CONSEQUENCE_NOTE,
  type JourneyEntry,
} from '../../domain/study/journey'
import type { RunTarget } from '../../app/routing/routes'
import { resolveStudy } from '../../domain/study/scheduling'
import type { Mode } from '../../domain/study/mode'
import './Today.css'

const WORDS = [
  'no', 'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
]

/** How many due rows show before the docket collapses behind a disclosure.
 *  A busy catch-up day should still read as "the one thing" at a glance,
 *  not as a homework list — see the "Coming up" horizon, which caps at
 *  the same number for the same reason. */
const DOCKET_VISIBLE = 5

/** Small counts read as prose. Past twelve the numeral is clearer than the word. */
function count(n: number): string {
  return n <= 12 ? WORDS[n] : String(n)
}

function topicCount(n: number): string {
  return `${count(n)} ${n === 1 ? 'topic' : 'topics'}`
}

function itemsIn(entries: JourneyEntry[]): number {
  return entries.reduce((n, entry) => n + entry.topic.items.length, 0)
}

function idsIn(entries: JourneyEntry[]): string[] {
  return entries.map((entry) => entry.topic.id)
}

function sentence(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function militaryDate(date: Date): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`
}

/** Mirrors the seeded library, so the empty state teaches the shape of a topic
 *  rather than restating the rule in the abstract. */
const PRIMER = [
  {
    title: 'NATO phonetic alphabet',
    scope: 'The 26 letters A to Z and their code words. Nothing else.',
  },
  {
    title: 'Primary survey',
    scope: 'The five ABCDE steps in assessment order.',
  },
  {
    title: 'Cardinal and intercardinal bearings',
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
  const [showAllDue, setShowAllDue] = useState(false)
  const stamp = militaryDate(new Date())

  // One derivation for the whole page. Today asks the journey layer what each
  // topic needs rather than reading status and reaching its own conclusion, so
  // the verb here and the verb in Library are the same value, not two rules that
  // happen to agree.
  const entries = journeysFor(topics)
  const practicable = entries.filter((entry) => entry.topic.items.length > 0)
  const due = dueEntries(entries)

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

  if (due.length === 0) {
    // The most common day. Show the shape of the schedule instead of a dead end:
    // every one of these is reachable now as a voluntary early Test.
    const horizon = [...practicable]
      .sort((a, b) => a.journey.waitDays - b.journey.waitDays)
      .slice(0, 5)

    return (
      <>
        <Head stamp={stamp} onProfile={onOpenProfile} />
        <p className="today-note">
          Recall needs the gap to mean anything, so the schedule is holding.
        </p>

        <h2 className="horizon-head">Coming up</h2>
        <p className="today-sub">
          Test any topic now. The score is recorded, but required gaps and clocks do not move early.
        </p>
        <ul className="index docket">
          {horizon.map((entry) => (
            <DocketRow
              key={entry.topic.id}
              entry={entry}
              onLaunch={() => onStart('test', [entry.topic.id])}
            />
          ))}
        </ul>

        <div className="today-actions">
          <button
            className="ghost"
            type="button"
            onClick={() => onStart('test', idsIn(practicable))}
          >
            Test everything · {itemsIn(practicable)} items
          </button>
        </div>
      </>
    )
  }

  // The journey decides the action, and `launchFor` decides what that action
  // does. A fresh ordinary topic is explicitly started here before its reference
  // opens; passive reference browsing happens only by navigating to the topic.
  // A guided lesson is a bounded run and Test is scored. `dueEntries` already
  // ranks the day, so the one primary action follows the top-ranked topic.
  const toTest = due.filter((entry) => entry.journey.action === 'test')
  const lead = due[0]
  const leadsWithTest = lead.journey.action === 'test'

  function launch(entry: JourneyEntry) {
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

  // A catch-up day should still read as "the one thing," not as a list to
  // work through. The docket shows the lead rows and holds the rest behind
  // an explicit disclosure rather than presenting every due topic as an
  // equally-weighted choice.
  const visibleDue = showAllDue ? due : due.slice(0, DOCKET_VISIBLE)
  const hiddenDue = due.length - visibleDue.length

  return (
    <>
      <Head stamp={stamp} onProfile={onOpenProfile} />

      <ul className="index docket">
        {visibleDue.map((entry) => (
          <DocketRow key={entry.topic.id} entry={entry} onLaunch={() => launch(entry)} />
        ))}
      </ul>

      {hiddenDue > 0 && (
        <button
          className="quiet docket-more"
          type="button"
          onClick={() => setShowAllDue(true)}
        >
          +{count(hiddenDue)} more due
        </button>
      )}

      <div className="today-actions">
        {/* Batching is for proving, not for enrollment or browsing. A scored
            run over several topics is one task; starting several unrelated topics
            or reading several references is not. */}
        {/* Verb first, context underneath. A single line would have to carry a
            verb, a count and sometimes a topic title, and a primary action that
            wraps to three lines on a phone is not a primary action. */}
        {leadsWithTest ? (
          <button
            className="today-go"
            type="button"
            onClick={() => onStart('test', idsIn(toTest))}
          >
            <span className="today-go-verb">Test {topicCount(toTest.length)}</span>
            <span className="today-go-note tabular">{itemsIn(toTest)} items</span>
          </button>
        ) : (
          <button className="today-go" type="button" onClick={() => launch(lead)}>
            <span className="today-go-verb">{lead.journey.primaryLabel}</span>
            <span className="today-go-note">{lead.topic.title}</span>
          </button>
        )}

        <div className="today-alts">
          {!leadsWithTest && toTest.length > 0 && (
            <button
              className="quiet"
              type="button"
              onClick={() => onStart('test', idsIn(toTest))}
            >
              Test the other {count(toTest.length)}
            </button>
          )}
        </div>

        {/* Said where a scored run is actually on offer, and nowhere else. A
            day of lessons or new starts should not carry a note about Test. */}
        {toTest.length > 0 && <p className="today-consequence">{TEST_CONSEQUENCE_NOTE}</p>}
      </div>
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
 * One due topic, and tapping it starts exactly that topic. The row carries the
 * reason it surfaced today rather than the rung it sits on: the rung is a fact
 * about the topic, the reason is a fact about today.
 */
function DocketRow({ entry, onLaunch }: { entry: JourneyEntry; onLaunch: () => void }) {
  const { topic, journey } = entry
  return (
    <li>
      <button type="button" className="index-row" onClick={onLaunch}>
        <span className="sr-only">{journey.actionLabel}: </span>
        <span className="index-title">{topic.title}</span>
        <span className="index-meta">
          <span className={`due-reason${journey.phase === 'repair' ? ' is-repair' : ''}`}>
            {journey.statusLabel}
          </span>
          <span className="tabular">
            {topic.items.length} {topic.items.length === 1 ? 'item' : 'items'}
          </span>
        </span>
        {/* Acquisition progress is the reason a Morse row keeps saying Learn, so
            the row carries it rather than making the learner open the topic. */}
        {journey.phase === 'acquiring' && journey.acquisition.progressive && journey.detail && (
          <span className="docket-detail">{journey.detail}</span>
        )}
      </button>
    </li>
  )
}
