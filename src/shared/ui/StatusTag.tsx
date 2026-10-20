import type { Status } from '../../domain/library/topic'

/** Old completed/repair statuses all read as learned. */
const LABELS: Record<Status, string> = {
  unstarted: 'Not tested yet',
  learning: 'Learning',
  drilled: 'Learned',
  completed: 'Learned',
  decayed: 'Learned',
}

export function StatusTag({ status }: { status: Status }) {
  return <span className={`status status-${status === 'decayed' || status === 'drilled' ? 'completed' : status}`}>{LABELS[status]}</span>
}

export function statusLabel(status: Status): string {
  return LABELS[status]
}
