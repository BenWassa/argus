import { useMemo } from 'react'
import { useLibrary } from '../../services/library/LibraryProvider'
import { COMMUNICATOR, communicatorProgress, type RoleTopicProgress } from '../../domain/roles/roles'
import './RolesPage.css'

interface Props {
  onOpenTopic: (topicId: string) => void
}

function RoleTopicRow({ topic, onOpenTopic }: { topic: RoleTopicProgress; onOpenTopic: Props['onOpenTopic'] }) {
  const unavailable = topic.state === 'unavailable'
  const status = topic.needsRefresh ? 'Refresh needed'
    : topic.state === 'complete' ? 'Complete'
    : topic.state === 'in-progress' ? 'In progress'
    : unavailable ? 'Not available' : 'Not started'
  return (
    <li className="role-topic">
      <button type="button" disabled={unavailable} onClick={() => onOpenTopic(topic.id)}>
        <span className={`role-topic-mark ${topic.state === 'complete' ? 'is-done' : ''}`} aria-hidden="true">
          {topic.state === 'complete' ? '✓' : '○'}
        </span>
        <span className="role-topic-title">{topic.title}</span>
        <span className="role-topic-state">{status}</span>
        {!unavailable && <span className="role-topic-chevron" aria-hidden="true">›</span>}
      </button>
    </li>
  )
}

/** With one available role, skip an intermediate selection screen. */
export function RolesPage({ onOpenTopic }: Props) {
  const { topics } = useLibrary()
  const progress = useMemo(() => communicatorProgress(topics), [topics])
  return (
    <div className="roles-page">
      <header className="roles-head">
        <h1>{COMMUNICATOR.title}</h1>
        <p>{COMMUNICATOR.description}</p>
      </header>
      <section className="roles-award" aria-label="Communicator achievement">
        <img
          src="/media/roles/communicator.svg"
          className={`roles-medallion ${progress.earned ? 'is-earned' : 'is-unearned'}`}
          alt=""
          width={220}
          height={220}
        />
        <div className="roles-award-copy">
          <strong className="roles-award-status">
            {progress.earned ? 'Communicator earned' : 'Communicator not yet earned'}
          </strong>
          <p className="roles-award-count">
            {progress.completeCount} of {progress.requiredCount} topics complete
          </p>
          {progress.needsRefresh && (
            <p className="roles-award-refresh">Some topics need refreshing. Your badge remains earned.</p>
          )}
          {!progress.earned && (
            <p className="roles-award-note">Complete all three pathways to earn the Communicator badge.</p>
          )}
        </div>
      </section>
      <div className="roles-pathways">
        {progress.pathways.map((pathway, index) => (
          <section className="roles-pathway" key={pathway.id} aria-labelledby={`roles-${pathway.id}`}>
            <div className="roles-path-heading">
              <div>
                <h2 id={`roles-${pathway.id}`}>{pathway.title}</h2>
                <p className="roles-path-subtitle">
                  {index === 0 ? 'Suggested starting point · All topics open' : 'All topics open'}
                </p>
              </div>
              <p className="roles-path-count">
                {pathway.state === 'complete' ? 'Complete' : `${pathway.completeCount} of ${pathway.topics.length}`}
              </p>
            </div>
            <ul className="roles-topic-list">
              {pathway.topics.map((topic) => (
                <RoleTopicRow key={topic.id} topic={topic} onOpenTopic={onOpenTopic} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="roles-boundary">Argus learning designation only. Not professional radio or marine certification.</p>
    </div>
  )
}
