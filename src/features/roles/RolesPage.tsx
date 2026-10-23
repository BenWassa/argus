import { useEffect, useMemo } from 'react'
import { useLibrary } from '../../services/library/LibraryProvider'
import { roleProgress, type CommunicatorProgress, type RoleId, type RoleTopicProgress } from '../../domain/roles/roles'
import { AVAILABLE_ROLES, type RoleDefinition } from '../../domain/roles/definitions'
import { journeyFor, type TopicAction } from '../../domain/study/journey'
import { ScreenHeader } from '../../shared/ui/ScreenHeader'
import { Dialog } from '../../shared/ui/Dialog'
import './RolesPage.css'

interface Props {
  onOpenTopic: (topicId: string) => void
  onContinue: (action: TopicAction, topicId: string) => void
  selectedRole: RoleId | null
  onSelectRole: (roleId: RoleId) => void
  onCloseRole: () => void
}

const BOUNDARY: Partial<Record<RoleId, string>> = {
  communicator: 'Not professional radio or marine certification.',
  navigator: 'Not a navigation qualification or evidence of practical wayfinding.',
  mariner: 'Not a marine certification or evidence of applying the collision regulations.',
}

export interface RoleCollectionEntry {
  role: RoleDefinition
  progress: CommunicatorProgress
}

/** The overview describes completion, never mastery, freshness or an invented award. */
export function collectionStatus(progress: CommunicatorProgress): string {
  if (progress.earned) return 'Earned'
  const untouched = progress.pathways.every((pathway) =>
    pathway.topics.every((topic) => topic.state === 'not-started'))
  return untouched ? 'Not started' : `${progress.completeCount} of ${progress.requiredCount} topics complete`
}

function badgeSource(roleId: string, earned: boolean) {
  return `${import.meta.env.BASE_URL}media/roles/${roleId}_${earned ? 'unlocked' : 'locked'}.png`
}

/** A gallery entry contains exactly the badge, name and truthful status. */
export function RoleCollectionItem({ entry, onOpen }: { entry: RoleCollectionEntry; onOpen: (id: RoleId) => void }) {
  const { role, progress } = entry
  return (
    <li className="role-collection-entry">
      <button className="role-collection-button" data-role-id={role.id} type="button" onClick={() => onOpen(role.id)}>
        <img className="role-collection-badge" src={badgeSource(role.id, progress.earned)}
          alt="" loading="lazy" width={112} height={112} />
        <span className="role-collection-name">{role.title}</span>
        <span className="role-collection-status">{collectionStatus(progress)}</span>
      </button>
    </li>
  )
}

function RoleTopicRow({ topic, onOpenTopic }: { topic: RoleTopicProgress; onOpenTopic: Props['onOpenTopic'] }) {
  const unavailable = topic.state === 'unavailable'
  const status = topic.state === 'complete' ? 'Learned'
    : topic.state === 'in-progress' ? 'In progress'
    : unavailable ? 'Not available' : 'Not started'
  return (
    <li className="role-topic">
      <button type="button" className="role-topic-plate plate" disabled={unavailable} onClick={() => onOpenTopic(topic.id)}>
        <span className={`role-topic-mark ${topic.state === 'complete' ? 'is-done' : ''}`} aria-hidden="true">
          {topic.state === 'complete' ? '✓' : '○'}
        </span>
        <span className="role-topic-title">{topic.title}</span>
        <span className="role-topic-state">{status}</span>
      </button>
    </li>
  )
}

/** Shared content for the desktop dialog and mobile full-screen detail. */
function RoleDetail({ entry, onOpenTopic, onContinue }: {
  entry: RoleCollectionEntry
  onOpenTopic: Props['onOpenTopic']
  onContinue: Props['onContinue']
}) {
  const { role, progress } = entry
  const { topics } = useLibrary()
  const requirements = progress.pathways.flatMap((path) => path.topics)
  const next = requirements.find((topic) => topic.state === 'in-progress')
    ?? requirements.find((topic) => topic.state === 'not-started')
  const nextTopic = next && topics.find((topic) => topic.id === next.id)

  return (
    <div className="role-detail-content">
      <div className="roles-award">
        <img src={badgeSource(role.id, progress.earned)}
          className={`roles-medallion ${progress.earned ? 'is-earned' : 'is-unearned'} is-raster`}
          alt="" width={256} height={256} />
        <div className="roles-award-copy">
          <p className="roles-description">{role.description}</p>
          <strong className="roles-award-status">{role.title} {progress.earned ? 'earned' : 'not yet earned'}</strong>
          <p className="roles-award-count">{progress.completeCount} of {progress.requiredCount} topics complete</p>
          {progress.earnedVersion !== undefined && progress.earnedVersion < role.version && (
            <p className="roles-award-note">Earned v{progress.earnedVersion}. {progress.upgradeRemainingCount} topics remaining for v{role.version}. The earlier award remains earned.</p>
          )}
        </div>
      </div>
      {nextTopic && <button className="roles-continue" type="button"
        onClick={() => next?.state === 'not-started'
          ? onOpenTopic(nextTopic.id)
          : onContinue(journeyFor(nextTopic).action, nextTopic.id)}>
        {next?.state === 'not-started' ? 'Start' : 'Continue'}: {nextTopic.title}
      </button>}
      <div className="roles-pathways">
        {progress.pathways.map((pathway) => (
          <section className="roles-pathway" key={pathway.id} aria-labelledby={`roles-${role.id}-${pathway.id}`}>
            <div className="roles-path-heading">
              <h3 id={`roles-${role.id}-${pathway.id}`}>{pathway.title}</h3>
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
      <p className="roles-award-version">Award requirements v{role.version}. Completed pathways are not separate awards.</p>
    </div>
  )
}

/** Permanent badges, collection first; the selected role is a real route. */
export function RolesPage({ onOpenTopic, onContinue, selectedRole, onSelectRole, onCloseRole }: Props) {
  const { topics, roleAwards } = useLibrary()
  const entries = useMemo(() => AVAILABLE_ROLES.map((role) => ({
    role, progress: roleProgress(role, topics, roleAwards),
  })), [topics, roleAwards])
  const selected = entries.find(({ role }) => role.id === selectedRole)
  const earned = entries.filter(({ progress }) => progress.earned).length

  // The dialog is a sibling of the inert collection; the persistent side/bottom
  // navigation must also be inert while a modal detail is open.
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.nav')
    if (!nav || !selected) return
    nav.inert = true
    return () => { nav.inert = false }
  }, [selectedRole, Boolean(selected)])

  return (
    <div className="roles-page">
      <div className="roles-overview" inert={Boolean(selected)}>
        <ScreenHeader title="Roles" />
        <div className="roles-intro">
          <p>Complete related topics to earn permanent badges.</p>
          <span className="roles-collection-count">{earned} of {entries.length} earned</span>
        </div>
        <ul className="role-collection" aria-label="Available roles">
          {entries.map((entry) => <RoleCollectionItem key={entry.role.id} entry={entry} onOpen={onSelectRole} />)}
        </ul>
      </div>
      {selected && (
        <Dialog title={selected.role.title} onClose={onCloseRole}
          closeLabel={`Close ${selected.role.title} details`}
          centred className="role-detail-dialog" blockBack={false}
          returnFocusSelector={`[data-role-id="${selected.role.id}"]`}>
          <RoleDetail entry={selected} onOpenTopic={onOpenTopic} onContinue={onContinue} />
        </Dialog>
      )}
    </div>
  )
}
