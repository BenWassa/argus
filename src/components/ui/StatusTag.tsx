import type { Status } from '../../lib/types'

/**
 * Status is information, never praise or punishment. `decayed` reads the same
 * weight as every other rung; it routes work, it does not scold.
 */
const LABELS: Record<Status, string> = {
  unstarted: 'Not started',
  learning: 'Learning',
  drilled: 'Drilled',
  completed: 'Completed',
  decayed: 'Needs repair',
}

export function StatusTag({ status }: { status: Status }) {
  return <span className={`status status-${status}`}>{LABELS[status]}</span>
}

export function statusLabel(status: Status): string {
  return LABELS[status]
}
