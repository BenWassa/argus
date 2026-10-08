import type { Topic } from '../library/topic'
import { topicOrigin } from '../library/catalog'

import { COMMUNICATOR, ROLE_IDS } from './definitions'
export { COMMUNICATOR, ROLE_IDS } from './definitions'
export type RoleId = (typeof ROLE_IDS)[number]

export type RoleTopicState = 'complete' | 'in-progress' | 'not-started' | 'unavailable'

export interface RoleTopicProgress {
  id: string
  title: string
  state: RoleTopicState
  needsRefresh: boolean
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
  needsRefresh: boolean
}

/** A bank is a permanent fact, independent of later repair status. */
export function wasBanked(topic: Topic | undefined): boolean {
  return Boolean(topic && (topic.completedAt || topic.drilledAt))
}

export function communicatorProgress(topics: readonly Topic[]): CommunicatorProgress {
  const byId = new Map(topics.map((topic) => [topic.id, topic]))
  const pathways = COMMUNICATOR.pathways.map((pathway): PathwayProgress => {
    const requirements = pathway.topicIds.map((id): RoleTopicProgress => {
      const local = byId.get(id)
      // Do not award for a user-authored topic that collides with a shipped id.
      const topic = local && topicOrigin(local) === 'catalog' ? local : undefined
      const complete = wasBanked(topic)
      return {
        id,
        title: topic?.title ?? id.replace(/-/g, ' '),
        state: complete ? 'complete'
          : !topic ? 'unavailable'
            : topic.status !== 'unstarted' ? 'in-progress' : 'not-started',
        needsRefresh: complete && topic?.status === 'decayed',
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
  const requiredCount = COMMUNICATOR.pathways.reduce((sum, pathway) => sum + pathway.topicIds.length, 0)
  const earned = completeCount === requiredCount
  return {
    pathways,
    completeCount,
    requiredCount,
    earned,
    needsRefresh: earned && pathways.some((pathway) => pathway.topics.some((topic) => topic.needsRefresh)),
  }
}
