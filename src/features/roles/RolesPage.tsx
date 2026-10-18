import { useMemo } from 'react'
import { useLibrary } from '../../services/library/LibraryProvider'
import { roleProgress, type RoleId, type RoleTopicProgress } from '../../domain/roles/roles'
import { AVAILABLE_ROLES } from '../../domain/roles/definitions'
import { journeyFor, type TopicAction } from '../../domain/study/journey'
import { ScreenHeader } from '../../shared/ui/ScreenHeader'
import { Plate } from '../../shared/ui/Plate'
import './RolesPage.css'

interface Props {
  onOpenTopic: (topicId: string) => void
  onContinue: (action: TopicAction, topicId: string) => void
  selectedRole: RoleId
  onSelectRole: (roleId: RoleId) => void
}

const BOUNDARY: Partial<Record<RoleId, string>> = {
  communicator: 'Not professional radio or marine certification.',
  navigator: 'Not a navigation qualification or evidence of practical wayfinding.',
  mariner: 'Not a marine certification or evidence of applying the collision regulations.',
}

function RoleTopicRow({ topic, onOpenTopic }: { topic: RoleTopicProgress; onOpenTopic: Props['onOpenTopic'] }) {
  const unavailable = topic.state === 'unavailable'
  const repair = topic.needsRefresh
  const status = repair ? 'Needs repair'
    : topic.state === 'complete' ? 'Complete'
    : topic.state === 'in-progress' ? 'In progress'
    : unavailable ? 'Not available' : 'Not started'
  return (
    <li className="role-topic">
      <button type="button" className={`role-topic-plate plate${repair ? ' plate-repair' : ''}`} disabled={unavailable} onClick={() => onOpenTopic(topic.id)}>
        <span className={`role-topic-mark ${topic.state === 'complete' && !repair ? 'is-done' : ''}`} aria-hidden="true">
          {topic.state === 'complete' ? '✓' : '○'}
        </span>
        <span className="role-topic-title">{topic.title}</span>
        <span className={`role-topic-state${repair ? ' is-repair' : ''}`}>{status}</span>
      </button>
    </li>
  )
}

/** Available roles only, with the focused role's next topic directly actionable. */
export function RolesPage({ onOpenTopic, onContinue, selectedRole, onSelectRole }: Props) {
  const { topics, roleAwards } = useLibrary()
  const role = AVAILABLE_ROLES.find((candidate) => candidate.id === selectedRole) ?? AVAILABLE_ROLES[0]
  const progress = useMemo(() => roleProgress(role, topics, roleAwards), [role, topics, roleAwards])
  // Only owner-approved raster art for available roles is rendered. Diver art
  // is staged but its curriculum is not yet earnable.
  const badgeSource = `${import.meta.env.BASE_URL}media/roles/${role.id}_${progress.earned ? 'unlocked' : 'locked'}.png`
  const requirements = progress.pathways.flatMap((path) => path.topics)
  const next = requirements.find((topic) => topic.needsRefresh)
    ?? requirements.find((topic) => topic.state === 'in-progress')
    ?? requirements.find((topic) => topic.state === 'not-started')
  const nextTopic = next && topics.find((topic) => topic.id === next.id)
  return (
    <div className="roles-page">
      <ScreenHeader
        title={role.title}
        actions={
          <select className="roles-selector field" aria-label="Choose a role" value={role.id} onChange={(event) => onSelectRole(event.target.value as RoleId)}>
            {AVAILABLE_ROLES.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}
          </select>
        }
      />
      <Plate as="section" variant={progress.earned ? 'raised' : 'default'} className="roles-award" aria-label={`${role.title} achievement`}>
        <img
          src={badgeSource}
          className={`roles-medallion ${progress.earned ? 'is-earned' : 'is-unearned'} is-raster`}
          alt=""
          width={220}
          height={220}
        />
        <div className="roles-award-copy">
          <strong className="roles-award-status">
            {`${role.title} ${progress.earned ? 'earned' : 'not yet earned'}`}
          </strong>
          <p className="roles-award-count">
            {progress.completeCount} of {progress.requiredCount} topics complete
          </p>
          {progress.needsRefresh && (
            <p className="roles-award-refresh">Needs repair</p>
          )}
          {progress.earnedVersion !== undefined && progress.earnedVersion < role.version && (
            <p className="roles-award-note">Earned v{progress.earnedVersion}. {progress.upgradeRemainingCount} topics remaining for v{role.version}.</p>
          )}
        </div>
      </Plate>
      {nextTopic && <button className="roles-continue" type="button" onClick={() => next?.state === 'not-started' ? onOpenTopic(nextTopic.id) : onContinue(journeyFor(nextTopic).action, nextTopic.id)}>
        {next?.needsRefresh ? 'Repair' : next?.state === 'not-started' ? 'Start' : 'Continue'}: {nextTopic.title}
      </button>}
      <div className="roles-pathways">
        {progress.pathways.map((pathway) => (
          <section className="roles-pathway" key={pathway.id} aria-labelledby={`roles-${pathway.id}`}>
            <div className="roles-path-heading">
              <h2 id={`roles-${pathway.id}`}>{pathway.title}</h2>
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
      <p className="roles-boundary">Argus learning designation only. {BOUNDARY[role.id] ?? ''}</p>
    </div>
  )
}
