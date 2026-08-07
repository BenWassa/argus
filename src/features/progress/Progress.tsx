import { useLibrary } from '../../lib/store'
import { COMPLETION_GAP_DAYS } from '../../lib/scheduling'
import { StatusTag } from '../../components/ui/StatusTag'

export function Progress() {
  const { topics } = useLibrary()

  const completions = topics
    .filter((t) => t.completedAt)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  const counts = {
    total: topics.length,
    completed: completions.length,
    repair: topics.filter((t) => t.status === 'decayed').length,
  }

  return (
    <>
      <h1>Progress</h1>

      <div className="stat-strip">
        <div>
          <p className="stat-value">{counts.total}</p>
          <p className="stat-label">Topics</p>
        </div>
        <div>
          <p className="stat-value">{counts.completed}</p>
          <p className="stat-label">Completed</p>
        </div>
        <div>
          <p className="stat-value">{counts.repair}</p>
          <p className="stat-label">Repair</p>
        </div>
      </div>

      <h2>Completion record</h2>
      {completions.length === 0 ? (
        <p className="empty">
          No completions yet. A topic completes only after you recall it cleanly at least{' '}
          {COMPLETION_GAP_DAYS} days after it was last drilled.
        </p>
      ) : (
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
      )}
    </>
  )
}
