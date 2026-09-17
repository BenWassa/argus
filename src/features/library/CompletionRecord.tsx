import { COMPLETION_GAP_DAYS } from '../../domain/study/scheduling'
import { StatusTag } from '../../components/ui/StatusTag'
import { TRACKS, type Topic, type Track } from '../../domain/library/topic'

/**
 * The permanent completion record, and the reason Progress did not need to be a
 * destination.
 *
 * Everything else Progress showed was the same `journeyFor` derivation Library
 * already shelves. This was the one thing that existed nowhere else, and it is
 * the artifact the whole product exists to build, so it closes Library rather
 * than living behind a tab that answered a question once a month.
 *
 * It is read, never pressed. No control, no filter, no badge, no percentage:
 * a topic is finished or it is not, and `completedAt` survives decay because
 * having once recalled it cold is a fact about the past that a later lapse does
 * not retract.
 */

const TRACK_LABELS: Record<Track, string> = {
  learning: 'Learning',
  survival: 'Survival',
  tradecraft: 'Tradecraft',
}

export function CompletionRecord({ topics }: { topics: Topic[] }) {
  const completions = topics
    .filter((topic) => topic.completedAt)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  const totals = TRACKS.map((track) => ({
    track,
    completed: completions.filter((topic) => topic.track === track).length,
    total: topics.filter((topic) => topic.track === track).length,
  })).filter((entry) => entry.total > 0)

  return (
    <section className="lib-record" aria-labelledby="completion-record-head">
      <h2 id="completion-record-head" className="lib-record-head">
        Completion record
      </h2>

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
          <p className="lib-record-totals tabular">
            {totals.map((entry, index) => (
              <span key={entry.track}>
                {index > 0 && <span aria-hidden="true"> · </span>}
                {TRACK_LABELS[entry.track]} {entry.completed}/{entry.total}
              </span>
            ))}
          </p>
        </>
      )}
    </section>
  )
}
