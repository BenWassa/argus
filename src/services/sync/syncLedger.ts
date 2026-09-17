import type { Ledger } from './syncPlanner'

/**
 * What this device last agreed with the server about, kept beside the library
 * it describes.
 *
 * It is a cache, not a record: losing it is safe. A device that has forgotten
 * its ledger treats everything as new on both sides, which resolves to keeping
 * both copies rather than deleting either — the failure that matters is the
 * other one, and it cannot happen this way round.
 */

const KEY = 'argus.sync.ledger.v1'

export function loadLedger(uid: string): Ledger {
  try {
    const raw = localStorage.getItem(`${KEY}.${uid}`)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const ledger: Ledger = {}
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue
      const entry = value as Record<string, unknown>
      if (typeof entry.revision !== 'number' || typeof entry.json !== 'string') continue
      ledger[id] = {
        revision: entry.revision,
        json: entry.json,
        changedAtMs: typeof entry.changedAtMs === 'number' ? entry.changedAtMs : 0,
      }
    }
    return ledger
  } catch {
    return {}
  }
}

export function saveLedger(uid: string, ledger: Ledger): void {
  try {
    localStorage.setItem(`${KEY}.${uid}`, JSON.stringify(ledger))
  } catch {
    // A full or unavailable store must not break sync; the next pass re-derives
    // the same plan from whatever the ledger does hold.
  }
}

export function clearLedger(uid: string): void {
  try {
    localStorage.removeItem(`${KEY}.${uid}`)
  } catch {
    // Nothing to do: a ledger that cannot be cleared is still only a cache.
  }
}
