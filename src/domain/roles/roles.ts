import { isLearned } from '../study/scheduling'
import type { Topic } from '../library/topic'
import { topicOrigin } from '../library/catalog'

import { COMMUNICATOR, ROLE_IDS, type RoleDefinition } from './definitions'
import type { RoleAward } from './awards'
import { catalogDefinition } from '../library/catalog'
export { COMMUNICATOR, ROLE_IDS } from './definitions'
export type RoleId = (typeof ROLE_IDS)[number]

export type RoleTopicState = 'complete' | 'in-progress' | 'not-started' | 'unavailable'

export interface RoleTopicProgress {
  id: string
  title: string
  state: RoleTopicState
}

export interface PathwayProgress {
  id: string
  title: string
  topics: RoleTopicProgress[]
  completeCount: number
  state: 'complete' | 'in-progress' | 'not-started'
}

export interface CommunicatorProgress {
  pathways: PathwayProgress[]
  completeCount: number
  requiredCount: number
  earned: boolean
  earnedVersion?: number
  upgradeRemainingCount?: number
}

/** Learned topics stay complete permanently. */
export function wasBanked(topic: Topic | undefined): boolean {
  return Boolean(topic && isLearned(topic))
}

export function communicatorProgress(topics: readonly Topic[], awards: readonly RoleAward[] = []): CommunicatorProgress {
  return roleProgress(COMMUNICATOR, topics, awards)
}

export function roleProgress(role: RoleDefinition, topics: readonly Topic[], awards: readonly RoleAward[] = []): CommunicatorProgress {
  const byId = new Map(topics.map((topic) => [topic.id, topic]))
  const pathways = role.pathways.map((pathway): PathwayProgress => {
    const requirements = pathway.topicIds.map((id): RoleTopicProgress => {
      const local = byId.get(id)
      // Do not award for a user-authored topic that collides with a shipped id.
      const topic = local && topicOrigin(local) === 'catalog' ? local : undefined
      const complete = wasBanked(topic)
      return {
        id,
        title: topic?.title ?? catalogDefinition(id)?.title ?? id.replace(/-/g, ' '),
        state: complete ? 'complete'
          : !topic ? 'unavailable'
            : topic.status !== 'unstarted' ? 'in-progress' : 'not-started',
      }
    })
    const completeCount = requirements.filter((topic) => topic.state === 'complete').length
    return {
      id: pathway.id,
      title: pathway.title,
      topics: requirements,
      completeCount,
      state: completeCount === requirements.length ? 'complete'
        : requirements.some((topic) => topic.state === 'in-progress' || topic.state === 'complete')
          ? 'in-progress' : 'not-started',
    }
  })
  const completeCount = pathways.reduce((sum, pathway) => sum + pathway.completeCount, 0)
  const requiredCount = role.pathways.reduce((sum, pathway) => sum + pathway.topicIds.length, 0)
  const receipt = awards.filter((award) => award.roleId === role.id).sort((a, b) => b.roleVersion - a.roleVersion)[0]
  // A versioned optional extension reuses already proved requirements, even
  // when their topic records have since been deleted. Current topic counts
  // remain literal: the receipt does not recreate missing topics or history.
  const proved = new Set(awards.filter((award) => award.roleId === role.id && award.roleVersion < role.version)
    .flatMap((award) => award.topicIds))
  for (const pathway of pathways) for (const topic of pathway.topics) {
    if (topic.state === 'complete') proved.add(topic.id)
  }
  const remaining = role.pathways.flatMap((path) => [...path.topicIds]).filter((id) => !proved.has(id)).length
  const liveEarned = requiredCount > 0 && remaining === 0
  const earned = Boolean(receipt) || liveEarned
  return {
    pathways,
    completeCount,
    requiredCount,
    earned,
    ...(receipt || liveEarned ? { earnedVersion: Math.max(liveEarned ? role.version : 0, receipt?.roleVersion ?? 0) } : {}),
    ...(receipt && receipt.roleVersion < role.version ? { upgradeRemainingCount: remaining } : {}),
  }
}
