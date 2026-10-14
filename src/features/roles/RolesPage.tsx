import { useMemo } from 'react'
import { useLibrary } from '../../services/library/LibraryProvider'
import { roleProgress, type RoleId, type RoleTopicProgress } from '../../domain/roles/roles'
import { AVAILABLE_ROLES } from '../../domain/roles/definitions'
import { journeyFor, type TopicAction } from '../../domain/study/journey'
import './RolesPage.css'

interface Props {
  onOpenTopic: (topicId: string) => void
  onContinue: (action: TopicAction, topicId: string) => void
  selectedRole: RoleId
  onSelectRole: (roleId: RoleId) => void
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

/** Available roles only, with the focused role's next topic directly actionable. */
export function RolesPage({ onOpenTopic, onContinue, selectedRole, onSelectRole }: Props) {
  const { topics, roleAwards } = useLibrary()
  const role = AVAILABLE_ROLES.find((candidate) => candidate.id === selectedRole) ?? AVAILABLE_ROLES[0]
  const progress = useMemo(() => roleProgress(role, topics, roleAwards), [role, topics, roleAwards])
  const requirements = progress.pathways.flatMap((path) => path.topics)
  const next = requirements.find((topic) => topic.needsRefresh)
    ?? requirements.find((topic) => topic.state === 'in-progress')
    ?? requirements.find((topic) => topic.state === 'not-started')
  const nextTopic = next && topics.find((topic) => topic.id === next.id)
  return (
    <div className="roles-page">
      <label className="roles-selector">
        <span>Choose a role</span>
        <select value={role.id} onChange={(event) => onSelectRole(event.target.value as RoleId)}>
          {AVAILABLE_ROLES.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}
        </select>
      </label>
      <header className="roles-head">
        <h1>{role.title}</h1>
        <p>{role.description}</p>
      </header>
      <section className={`roles-award ${role.id !== 'communicator' ? 'without-art' : ''}`} aria-label={`${role.title} achievement`}>
        {role.id === 'communicator' && <img
          src={`${import.meta.env.BASE_URL}media/roles/communicator.svg`}
          className={`roles-medallion ${progress.earned ? 'is-earned' : 'is-unearned'}`}
          alt=""
          width={220}
          height={220}
        />}
        <div className="roles-award-copy">
          <strong className="roles-award-status">
            {`${role.title} ${progress.earned ? 'earned' : 'not yet earned'}`}
          </strong>
          <p className="roles-award-count">
            {progress.completeCount} of {progress.requiredCount} topics complete
          </p>
          {progress.needsRefresh && (
            <p className="roles-award-refresh">Some topics need refreshing. Your badge remains earned.</p>
          )}
          {progress.earnedVersion !== undefined && progress.earnedVersion < role.version && (
            <p className="roles-award-note">Earned v{progress.earnedVersion}. {progress.upgradeRemainingCount} topics remaining for v{role.version}.</p>
          )}
          {!progress.earned && (
            <p className="roles-award-note">Complete all {role.pathways.length === 3 ? 'three' : 'two'} pathways to earn {role.title}.</p>
          )}
        </div>
      </section>
      {nextTopic && <button className="roles-continue" type="button" onClick={() => onContinue(journeyFor(nextTopic).action, nextTopic.id)}>
        {next?.needsRefresh ? 'Refresh' : 'Continue'}: {nextTopic.title}
      </button>}
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
      <p className="roles-boundary">Argus learning designation only. {role.id === 'navigator' ? 'Not a navigation qualification or evidence of practical wayfinding.' : 'Not professional radio or marine certification.'}</p>
    </div>
  )
}
