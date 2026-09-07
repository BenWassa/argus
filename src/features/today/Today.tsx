import { useLibrary } from '../../lib/store'
import { dueEntries, journeysFor, type JourneyEntry } from '../../lib/journey'
import type { Mode } from '../../lib/types'
import './Today.css'

const WORDS = [
  'no', 'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
]

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
  onStart: (mode: Mode, topicIds: string[]) => void
  onGoToLibrary: () => void
}

export function Today({ onStart, onGoToLibrary }: TodayProps) {
  const { topics } = useLibrary()
  const stamp = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

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
        <Head verdict="Nothing here yet" stamp={stamp} />
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
        <Head verdict="Nothing to test yet" stamp={stamp} />
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
        <Head verdict="Nothing due" stamp={stamp} />
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

  // The journey decides the mode. A topic never seen wants reading; a topic
  // still being acquired wants more of the same lesson; everything else wants
  // proving. `dueEntries` already ranks the list by urgency, so the single
  // primary action follows whichever mode the top-ranked topic needs.
  const toLearn = due.filter((entry) => entry.journey.action === 'learn')
  const toTest = due.filter((entry) => entry.journey.action === 'test')
  const leadMode: Mode = due[0].journey.action === 'learn' ? 'learn' : 'test'
  const leadGroup = leadMode === 'learn' ? toLearn : toTest
  const altGroup = leadMode === 'learn' ? toTest : toLearn
  const altMode: Mode = leadMode === 'learn' ? 'test' : 'learn'

  const verdict = sentence(
    [
      toLearn.length > 0 ? `${count(toLearn.length)} to read` : null,
      toTest.length > 0 ? `${count(toTest.length)} to prove` : null,
    ]
      .filter(Boolean)
      .join(', '),
  )

  return (
    <>
      <Head verdict={verdict} stamp={stamp} />

      <ul className="index docket">
        {due.map((entry) => (
          <DocketRow
            key={entry.topic.id}
            entry={entry}
            onLaunch={() =>
              onStart(entry.journey.action === 'learn' ? 'learn' : 'test', [entry.topic.id])
            }
          />
        ))}
      </ul>

      <div className="today-actions">
        <button
          className="today-go"
          type="button"
          onClick={() => onStart(leadMode, idsIn(leadGroup))}
        >
          {leadMode === 'learn' ? 'Learn' : 'Test'} {topicCount(leadGroup.length)} ·{' '}
          {itemsIn(leadGroup)} items
        </button>

        <div className="today-alts">
          {altGroup.length > 0 && (
            <button
              className="quiet"
              type="button"
              onClick={() => onStart(altMode, idsIn(altGroup))}
            >
              {altMode === 'learn' ? 'Learn' : 'Test'} the other {count(altGroup.length)}
            </button>
          )}
        </div>

        <p className="today-consequence">
          Tests are scored. The ladder moves only when its required evidence gap is satisfied.
        </p>
      </div>
    </>
  )
}

/** The verdict is the page's largest type, because naming the view is the one
 *  thing the navigation already does. */
function Head({ verdict, stamp }: { verdict: string; stamp: string }) {
  return (
    <div className="today-head">
      <h1 aria-live="polite">{verdict}</h1>
      <p className="today-date tabular">{stamp}</p>
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
