import { useLibrary } from '../../lib/store'
import { COMPLETION_GAP_DAYS } from '../../lib/scheduling'
import { journeysFor, type JourneyEntry } from '../../lib/journey'
import { StatusTag } from '../../components/ui/StatusTag'
import { TRACKS, type Track } from '../../lib/types'

/**
 * Progress, rebuilt around the shared journey (#70).
 *
 * It used to be a completion ledger with three counters on top: how many topics
 * exist, how many are done, how many need repair. All three were true and none
 * of them answered the question the screen is for — where am I, across
 * everything I am carrying?
 *
 * It now reads the same derivation Today, Library and Topic read, and shows the
 * four states that derivation distinguishes: work that is live, work the
 * schedule is holding, work that decayed, and the permanent record.
 *
 * What it deliberately is not: a dashboard. No streaks, no badges, no XP, no
 * leaderboard, and no single percentage pretending that acquisition, retention
 * and completion are one measurement. The only totals are completions by track,
 * which are counts of real things rather than a score.
 */

const TRACK_LABELS: Record<Track, string> = {
  learning: 'Learning',
  survival: 'Survival',
  tradecraft: 'Tradecraft',
}

/**
 * One line per topic: what it is, and the one thing that is true of it now.
 * The next step is words rather than a control, because Progress is where the
 * learner reviews the shape of their work — Today is where they start it.
 */
function ProgressRow({ entry }: { entry: JourneyEntry }) {
  const { topic, journey } = entry
  const gap = journey.retention.gated ? null : journey.retention.gapProgress

  return (
    <li>
      <span className="progress-title">{topic.title}</span>
      <span className="progress-meta">
        <span className={`track track-${topic.track}`}>{topic.track}</span>
        <span className={`progress-state${journey.phase === 'repair' ? ' is-repair' : ''}`}>
          {journey.statusLabel}
        </span>
      </span>
      {journey.detail && <span className="progress-detail">{journey.detail}</span>}
      {gap !== null && gap < 1 && (
        <span className="progress-gap" aria-hidden="true">
          <span className="progress-gap-fill" style={{ width: `${Math.round(gap * 100)}%` }} />
        </span>
      )}
    </li>
  )
}

function Section({
  heading,
  note,
  entries,
}: {
  heading: string
  note: string
  entries: JourneyEntry[]
}) {
  if (entries.length === 0) return null
  return (
    <section className="progress-section">
      <h2>
        {heading}
        <span className="progress-count tabular">{entries.length}</span>
      </h2>
      <p className="progress-note">{note}</p>
      <ul className="progress-list">
        {entries.map((entry) => (
          <ProgressRow key={entry.topic.id} entry={entry} />
        ))}
      </ul>
    </section>
  )
}

export function Progress() {
  const { topics } = useLibrary()
  const entries = journeysFor(topics)

  // The sections are the journey's own phases. Progress interprets nothing on
  // its own, so it cannot become a fourth opinion about the same topic.
  const active = entries.filter(
    (entry) => entry.journey.phase === 'acquiring' || entry.journey.phase === 'due',
  )
  const waiting = entries.filter((entry) => entry.journey.phase === 'waiting')
  const repair = entries.filter((entry) => entry.journey.phase === 'repair')
  const unfinished = entries.filter((entry) => entry.journey.phase === 'authoring')

  // Permanent, and separate from every phase above: decay routes a topic back to
  // drilling without erasing that it was once completed.
  const completions = topics
    .filter((topic) => topic.completedAt)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  const totals = TRACKS.map((track) => ({
    track,
    completed: completions.filter((topic) => topic.track === track).length,
    total: topics.filter((topic) => topic.track === track).length,
  })).filter((entry) => entry.total > 0)

  return (
    <>
      <h1>Progress</h1>

      {topics.length === 0 ? (
        <p className="empty">
          Nothing in the library yet, so there is no progress to show. A topic states its own
          boundary before it can exist, and that boundary is what makes finishing possible.
        </p>
      ) : (
        <>
          <Section
            heading="In progress"
            note="Live work: being learned, or ready to be proved."
            entries={active}
          />
          <Section
            heading="Waiting"
            note="Recall needs the gap to mean anything, so these are held."
            entries={waiting}
          />
          <Section
            heading="Repair"
            note="Recall did not survive its spot check. These go back to drilling."
            entries={repair}
          />

          {unfinished.length > 0 && (
            <p className="progress-aside">
              {unfinished.length} {unfinished.length === 1 ? 'topic has' : 'topics have'} no items
              yet, so {unfinished.length === 1 ? 'it is' : 'they are'} an authoring job rather than
              a learning one.
            </p>
          )}
        </>
      )}

      <h2 className="progress-record-head">Completion record</h2>
      {completions.length === 0 ? (
        <p className="empty">
          No completions yet. A topic completes only after you recall it cleanly at least{' '}
          {COMPLETION_GAP_DAYS} days after it was last drilled.
        </p>
      ) : (
        <>
          <ol className="record">
            {completions.map((topic, i) => (
              <li key={topic.id}>
                <span className="record-number">
                  {String(completions.length - i).padStart(2, '0')}
                </span>
                <span>
                  <span className="record-title">{topic.title}</span>
                  <span className="record-meta">
                    <span className={`track track-${topic.track}`}>{topic.track}</span>
                    {topic.status === 'decayed' && <StatusTag status={topic.status} />}
                  </span>
                </span>
                <span className="record-date">
                  {new Date(topic.completedAt ?? '').toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                  })}
                </span>
              </li>
            ))}
          </ol>

          {/* Counts of real things, by track. Not a score, and not a percentage
              of anything: a topic is finished or it is not. */}
          <p className="progress-totals tabular">
            {totals.map((entry, index) => (
              <span key={entry.track}>
                {index > 0 && <span aria-hidden="true"> · </span>}
                {TRACK_LABELS[entry.track]} {entry.completed}/{entry.total}
              </span>
            ))}
          </p>
        </>
      )}
    </>
  )
}
