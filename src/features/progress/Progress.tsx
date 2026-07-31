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
          <p className="stat-label">Needing repair</p>
        </div>
      </div>

      <h2>Completion record</h2>
      {completions.length === 0 ? (
        <p className="empty">
          No completions yet. A topic completes only after you recall it cleanly at least{' '}
          {COMPLETION_GAP_DAYS} days after it was last drilled.
        </p>
      ) : (
        <ul className="index">
          {completions.map((topic) => (
            <li key={topic.id}>
              <div className="index-row static">
                <span className="index-title">{topic.title}</span>
                <span className="index-meta">
                  <StatusTag status={topic.status} />
                  <span>
                    Completed {new Date(topic.completedAt ?? '').toLocaleDateString()}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
