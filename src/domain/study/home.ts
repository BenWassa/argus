import type { Topic } from '../library/topic'
import type { JourneyEntry } from './journey'
import { hasStarted, lastActivityAt } from './libraryGroups'

/** Historical completion and live acquisition are intentionally independent. */
export function homeReadout(entries: JourneyEntry[]) {
  const latest = entries.reduce((at, entry) => Math.max(at, lastActivityAt(entry.topic)), 0)
  return {
    completed: entries.filter(({ topic }) => !!topic.completedAt).length,
    inProgress: entries.filter((entry) => !entry.topic.completedAt && hasStarted(entry)).length,
    lastActive: latest ? new Date(latest).toISOString() : null,
  }
}

export type HomeProgress =
  | { kind: 'ratio'; done: number; total: number; label: string }
  | { kind: 'started' | 'complete' | 'repair'; label: string }

/** Only durable finite quantities earn an arc; ordinary topics use a discrete dial. */
export function homeProgress(topic: Topic, journey: JourneyEntry['journey']): HomeProgress {
  if (journey.phase === 'repair') return { kind: 'repair', label: 'Needs repair' }
  if (topic.completedAt) return { kind: 'complete', label: 'Completion earned' }
  if (journey.acquisition.progressive && journey.acquisition.total > 0) {
    const { settled: done, total } = journey.acquisition
    return { kind: 'ratio', done, total, label: `${done} of ${total} characters settled` }
  }
  if (Object.keys(topic.itemEvidence ?? {}).length > 0 && journey.evidence.total > 0) {
    const { covered: done, total } = journey.evidence
    return { kind: 'ratio', done, total, label: `${done} of ${total} items evidenced` }
  }
  return { kind: 'started', label: 'Building recall' }
}
