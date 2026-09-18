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

import shippedCatalog from '../../domain/library/shippedCatalog.json'
import type { Topic } from '../../domain/library/topic'

const SHIPPED_TOPIC_IDS = new Set<string>(shippedCatalog.topicIds)

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
interface Weight {
  history: number
  evidence: number
}

function size(value: unknown): number {
  return value && typeof value === 'object' ? Object.keys(value as object).length : 0
}

function weigh(value: { history?: unknown; itemEvidence?: unknown }): Weight {
  return {
    history: Array.isArray(value.history) ? value.history.length : 0,
    evidence: size(value.itemEvidence),
  }
}

function weighJson(json: string): Weight | null {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return null
    return weigh(parsed as { history?: unknown; itemEvidence?: unknown })
  } catch {
    return null
  }
}

/** True when `a` holds at least as much of both kinds of evidence as `b`. */
function covers(a: Weight, b: Weight): boolean {
  return a.history >= b.history && a.evidence >= b.evidence
}

export function wouldLoseEvidence(remoteJson: string, local: Topic): boolean {
  const remote = weighJson(remoteJson)
  if (!remote) return true
  return !covers(remote, weigh(local as { history?: unknown; itemEvidence?: unknown }))
}

/**
 * What to do about a topic on both sides that this device has never synced.
 *
 * This is the first run on a new device, and treating it as a conflict outright
 * would be useless: the ordinary case is a local library of untouched seed
 * topics meeting a real record, and every topic would be reported at once.
 *
 * So the two copies are compared by how much they actually hold. Where one
 * covers the other — same attempts and item evidence, or more — taking the
 * fuller copy loses nothing and is safe. Where neither covers the other, each
 * holds something the other does not, and that is a real conflict.
 */
function firstMeeting(localJson: string, local: Topic, record: RemoteRecord): SyncAction | null {
  if (localJson === record.json) return null
  const remote = weighJson(record.json)
  if (!remote) return { kind: 'push', topicId: local.id, json: localJson, revision: record.revision + 1 }
  const mine = weigh(local as { history?: unknown; itemEvidence?: unknown })
  const remoteCovers = covers(remote, mine)
  const localCovers = covers(mine, remote)
  if (remoteCovers && !localCovers) {
    return { kind: 'adopt', topicId: local.id, json: record.json, revision: record.revision }
  }
  if (localCovers && !remoteCovers) {
    return { kind: 'push', topicId: local.id, json: localJson, revision: record.revision + 1 }
  }
  return null
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
      // Shipped topics are baseline product content. An old synced deletion
      // must not erase a catalog topic that recovery has just restored locally.
      // Re-publish it instead. User-authored topics keep normal deletion
      // semantics, where the ledger distinguishes a remote deletion from a new
      // local creation.
      if (known && SHIPPED_TOPIC_IDS.has(id)) {
        actions.push({ kind: 'push', topicId: id, json: topicJson(local), revision: known.revision + 1 })
      } else if (known) actions.push({ kind: 'dropLocal', topicId: id })
      else actions.push({ kind: 'push', topicId: id, json: topicJson(local), revision: 1 })
      continue
    }

    if (!local && record) {
      // Individual deletion keeps its existing semantics. The recovery case is
      // the opposite shape — a restored local shipped topic facing an absent
      // remote record — and is handled above.
      if (known) actions.push({ kind: 'deleteRemote', topicId: id })
      else actions.push({ kind: 'adopt', topicId: id, json: record.json, revision: record.revision })
      continue
    }

    if (!local || !record) continue

    const json = topicJson(local)

    if (!known) {
      // Never synced here. Decided by what each copy holds, not by a ledger
      // that does not exist yet.
      const action = firstMeeting(json, local, record)
      if (action) actions.push(action)
      else if (json !== record.json) conflicts.push(id)
      else actions.push({ kind: 'adopt', topicId: id, json: record.json, revision: record.revision })
      continue
    }

    const localChanged = known.json !== json
    const remoteChanged = record.revision > known.revision

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
