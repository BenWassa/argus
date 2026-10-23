/**
 * How long the last few local saves took, kept in memory for Profile to show.
 *
 * Timings only: no answers, topic names or owner keys. It exists so that a
 * save that felt slow on a phone can be read off the screen afterwards without
 * dev tools. It resets when the app restarts.
 */
export interface SaveTiming {
  /** Queued behind earlier writes before this one started. */
  waitMs: number
  /** From the start of the IndexedDB transaction to the library being published. */
  writeMs: number
  ok: boolean
}

const KEPT = 5
const recent: SaveTiming[] = []

export function recordSave(timing: SaveTiming): void {
  recent.push({
    waitMs: Math.round(timing.waitMs),
    writeMs: Math.round(timing.writeMs),
    ok: timing.ok,
  })
  if (recent.length > KEPT) recent.shift()
}

/** Newest first. */
export function recentSaves(): readonly SaveTiming[] {
  return [...recent].reverse()
}

export function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`
}
