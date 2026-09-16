/**
 * What sync should do, decided as a pure function.
 *
 * Sync is the one part of Argus where two devices can disagree about the
 * learner's record, so the decision is kept here — arithmetic over three
 * inputs, with no Firebase and no React anywhere near it — rather than spread
 * through a subscription callback where it could only be reasoned about.
 *
 * The three inputs are the local library, the remote documents, and a ledger of
 * what this device last agreed with the server about. The ledger is what makes
 * a deletion distinguishable from an arrival: a topic that is missing locally
 * but present remotely was either just created on another device or just
 * deleted on this one, and only the ledger knows which.
 *
 * The record is carried as the exact JSON the v5 boundary in `storage.ts`
 * already validates, not as a second Firestore-shaped schema. A second schema
 * would be a second definition of what a topic is, free to drift from the
 * first, and the evidence contract is precisely the thing that must not drift.
 *
 * **Nothing here silently discards progress.** `docs/open/ISSUE_93_FIREBASE_PROGRESS_SYNC.md`
 * rules out destructive last-write-wins outright, and allows a first release to
 * fall back to explicit conflict detection instead of a field-level merge. That
 * is what this is: where two devices both changed a topic, neither copy is
 * overwritten and the topic is reported as conflicted for a person to settle.
 * Choosing a winner by timestamp would be easy, and would be the one failure
 * mode — a fortnight of evidence erased by a stale device reconnecting — that
 * this whole layer exists to avoid.
 */

import type { Topic } from '../types'

/** A topic as it is stored remotely: the v5 JSON, and enough to order writes. */
export interface RemoteRecord {
  topicId: string
  json: string
  revision: number
  /** Server time. Null while a local write is still pending acknowledgement. */
  updatedAtMs: number | null
}

/** What this device last agreed with the server about one topic. */
export interface LedgerEntry {
  revision: number
  json: string
  /** When this device last changed the topic itself, for conflict ordering. */
  changedAtMs: number
}

export type Ledger = Record<string, LedgerEntry>

export type SyncAction =
  /** Send the local copy up; it is new here or newer than the server's. */
  | { kind: 'push'; topicId: string; json: string; revision: number }
  /** Take the remote copy; another device has moved ahead of this one. */
  | { kind: 'adopt'; topicId: string; json: string; revision: number }
  /** This device deleted a topic that the server still holds. */
  | { kind: 'deleteRemote'; topicId: string }
  /** Another device deleted a topic this one still holds. */
  | { kind: 'dropLocal'; topicId: string }

export interface SyncPlan {
  actions: SyncAction[]
  /**
   * Topics changed on both devices since this one last agreed with the server.
   * They are left exactly as they are on both sides — no action is emitted for
   * them at all — and reported so the person can settle it themselves.
   */
  conflicts: string[]
}

export function topicJson(topic: Topic): string {
  return JSON.stringify(topic)
}

/**
 * Would taking this remote copy lose evidence the local one holds?
 *
 * A learner's history only ever grows: an attempt that happened does not
 * un-happen, and neither does the evidence it produced. So a remote copy with
 * fewer attempts than the local one is not a later edit, it is an older or
 * damaged copy arriving late — exactly the case #93 names as unacceptable to
 * apply. It is refused and reported rather than adopted.
 *
 * This reads only the two fields whose growth is monotonic. It is not a merge
 * and does not try to judge the rest of the record.
 */
export function wouldLoseEvidence(remoteJson: string, local: Topic): boolean {
  try {
    const parsed: unknown = JSON.parse(remoteJson)
    if (!parsed || typeof parsed !== 'object') return true
    const remote = parsed as { history?: unknown; itemEvidence?: unknown }
    const remoteHistory = Array.isArray(remote.history) ? remote.history.length : 0
    const localHistory = Array.isArray(local.history) ? local.history.length : 0
    if (remoteHistory < localHistory) return true
    const size = (value: unknown) =>
      value && typeof value === 'object' ? Object.keys(value as object).length : 0
    return size(remote.itemEvidence) < size((local as { itemEvidence?: unknown }).itemEvidence)
  } catch {
    return true
  }
}

export function planSync(
  localTopics: Topic[],
  remote: RemoteRecord[],
  ledger: Ledger,
): SyncPlan {
  const locals = new Map(localTopics.map((topic) => [topic.id, topic]))
  const remotes = new Map(remote.map((record) => [record.topicId, record]))
  const ids = new Set([...locals.keys(), ...remotes.keys(), ...Object.keys(ledger)])

  const actions: SyncAction[] = []
  const conflicts: string[] = []

  for (const id of [...ids].sort()) {
    const local = locals.get(id)
    const record = remotes.get(id)
    const known = ledger[id]

    if (local && !record) {
      // Known to the ledger means the server had it and no longer does, which
      // is another device's deletion arriving. Otherwise it is new here.
      if (known) actions.push({ kind: 'dropLocal', topicId: id })
      else actions.push({ kind: 'push', topicId: id, json: topicJson(local), revision: 1 })
      continue
    }

    if (!local && record) {
      if (known) actions.push({ kind: 'deleteRemote', topicId: id })
      else actions.push({ kind: 'adopt', topicId: id, json: record.json, revision: record.revision })
      continue
    }

    if (!local || !record) continue

    const json = topicJson(local)
    const localChanged = !known || known.json !== json
    const remoteChanged = !known || record.revision > known.revision

    if (!localChanged && !remoteChanged) continue

    if (localChanged && !remoteChanged) {
      actions.push({ kind: 'push', topicId: id, json, revision: record.revision + 1 })
      continue
    }

    if (!localChanged && remoteChanged) {
      // Even an uncontested remote edit is refused if applying it would drop
      // attempts or evidence this device already holds.
      if (wouldLoseEvidence(record.json, local)) conflicts.push(id)
      else actions.push({ kind: 'adopt', topicId: id, json: record.json, revision: record.revision })
      continue
    }

    // Both moved since this device last agreed with the server. Either copy
    // might hold work the other does not, and nothing here can tell which, so
    // neither is touched and the person is told which topic it was.
    conflicts.push(id)
  }

  return { actions, conflicts }
}

/** The ledger this device should hold once `actions` have been applied. */
export function nextLedger(ledger: Ledger, actions: SyncAction[], now: number): Ledger {
  const next: Ledger = { ...ledger }
  for (const action of actions) {
    switch (action.kind) {
      case 'push':
      case 'adopt':
        next[action.topicId] = {
          revision: action.revision,
          json: action.json,
          // An adopted copy was not edited here, but it is now what this device
          // holds, so it is the baseline the next comparison is made against.
          changedAtMs: now,
        }
        break
      case 'deleteRemote':
      case 'dropLocal':
        delete next[action.topicId]
        break
    }
  }
  return next
}
