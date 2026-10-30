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
 * **Nothing here silently discards progress.** `docs/closed/ISSUE_93_FIREBASE_PROGRESS_SYNC.md`
 * rules out destructive last-write-wins outright, and allows a first release to
 * fall back to explicit conflict detection instead of a field-level merge. That
 * is what this is: where two devices both changed a topic, neither copy is
 * overwritten and the topic is reported as conflicted for a person to settle.
 * Choosing a winner by timestamp would be easy, and would be the one failure
 * mode — a fortnight of evidence erased by a stale device reconnecting — that
 * this whole layer exists to avoid.
 */

import { isRetiredCatalogTopic } from '../../domain/library/catalog'
import shippedCatalog from '../../domain/library/shippedCatalog.json'
import type { Topic } from '../../domain/library/topic'
import { mergeRoleAwards, parseRoleAwards, type RoleAward } from '../../domain/roles/awards'

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
 * Library-level state as it travels: the record version and the catalog topics
 * delivered so far, sorted and de-duplicated so two devices holding the same
 * set write the same text.
 */
export function libraryMetaJson(
  catalogDelivered: readonly string[] | undefined,
  roleAwards?: readonly RoleAward[],
  roleAwardGeneration?: number,
): string {
  return JSON.stringify({
    version: 5,
    catalogDelivered: [...new Set(catalogDelivered ?? [])].sort(),
    ...(roleAwards !== undefined ? { roleAwards: mergeRoleAwards(roleAwards) } : {}),
    ...(roleAwardGeneration !== undefined ? { roleAwardGeneration } : {}),
  })
}

export function parseRoleMeta(json: string): { awards: RoleAward[]; generation: number } | null {
  try {
    const raw = JSON.parse(json) as Record<string, unknown>
    if (parseLibraryMeta(json) === null || Object.keys(raw).some((key) => !['version', 'catalogDelivered', 'roleAwards', 'roleAwardGeneration'].includes(key))) return null
    const awards = parseRoleAwards(raw.roleAwards)
    const generation = raw.roleAwardGeneration ?? 0
    if (!awards || !Number.isSafeInteger(generation) || (generation as number) < 0) return null
    return { awards, generation: generation as number }
  } catch {
    return null
  }
}

/** Atomic backend merge: stale writers cannot erase independently earned awards. */
export function mergeLibraryMetaJson(localJson: string, remoteJson: string | null): string {
  const localIds = parseLibraryMeta(localJson)
  const local = parseRoleMeta(localJson)
  const remoteIds = remoteJson === null ? [] : parseLibraryMeta(remoteJson)
  const remote = remoteJson === null ? { awards: [], generation: 0 } : parseRoleMeta(remoteJson)
  if (!localIds || !local || !remoteIds || !remote) throw new Error('Library metadata is unreadable; it was not overwritten.')
  const generation = Math.max(local.generation, remote.generation)
  const awards = local.generation === remote.generation ? mergeRoleAwards(local.awards, remote.awards)
    : generation === local.generation ? local.awards : remote.awards
  const holdsAwards = generation > 0 || awards.length > 0
    || 'roleAwards' in JSON.parse(localJson) || (remoteJson !== null && 'roleAwards' in JSON.parse(remoteJson))
  return libraryMetaJson([...localIds, ...remoteIds], holdsAwards ? awards : undefined, holdsAwards ? generation : undefined)
}

/** The delivered catalog ids a remote meta record holds, or null if it cannot be read. */
export function parseLibraryMeta(json: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return null
    const { version, catalogDelivered } = parsed as { version?: unknown; catalogDelivered?: unknown }
    if (version !== 5 || !Array.isArray(catalogDelivered)) return null
    if (!catalogDelivered.every((id): id is string => typeof id === 'string' && id.length > 0)) return null
    return catalogDelivered
  } catch {
    return null
  }
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
 * This reads only monotonic learner-progress fields: scored attempts and item
 * evidence, plus settled lesson support and the permanent acquisition-ready
 * anchor. It is not a merge and does not try to judge the rest of the record.
 */
interface Weight {
  history: number
  evidence: number
  settledLessons: number
  acquisitionReady: number
  /** Lesson stages finished (#296). Monotonic: a stage is never un-finished. */
  stages: number
}

function size(value: unknown): number {
  return value && typeof value === 'object' ? Object.keys(value as object).length : 0
}

function settledLessonCount(value: unknown): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0
  return Object.values(value as Record<string, unknown>).filter((level) => level === 'settled').length
}

function weigh(value: {
  history?: unknown
  itemEvidence?: unknown
  lessonProgress?: unknown
  acquisitionReadyAt?: unknown
  stageProgress?: unknown
}): Weight {
  return {
    history: Array.isArray(value.history) ? value.history.length : 0,
    evidence: size(value.itemEvidence),
    settledLessons: settledLessonCount(value.lessonProgress),
    acquisitionReady: typeof value.acquisitionReadyAt === 'string' ? 1 : 0,
    stages: size(value.stageProgress),
  }
}

function weighJson(json: string): Weight | null {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return null
    return weigh(parsed as {
      history?: unknown
      itemEvidence?: unknown
      lessonProgress?: unknown
      acquisitionReadyAt?: unknown
      stageProgress?: unknown
    })
  } catch {
    return null
  }
}

/** True when `a` holds at least as much monotonic learner progress as `b`. */
function covers(a: Weight, b: Weight): boolean {
  return a.history >= b.history
    && a.evidence >= b.evidence
    && a.settledLessons >= b.settledLessons
    && a.acquisitionReady >= b.acquisitionReady
    && a.stages >= b.stages
}

export function wouldLoseEvidence(remoteJson: string, local: Topic): boolean {
  const remote = weighJson(remoteJson)
  if (!remote) return true
  return !covers(remote, weigh(local))
}

/** Installation timestamps and JSON key order do not represent learner edits. */
function sameTopicRecord(local: Topic, remoteJson: string): boolean {
  function canonical(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonical)
    if (!value || typeof value !== 'object') return value
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, canonical(entry)]))
  }
  try {
    const remote: unknown = JSON.parse(remoteJson)
    if (!remote || typeof remote !== 'object' || Array.isArray(remote)) return false
    const { createdAt: _localCreated, ...mine } = local
    const { createdAt: _remoteCreated, ...theirs } = remote as Record<string, unknown>
    return JSON.stringify(canonical(mine)) === JSON.stringify(canonical(theirs))
  } catch {
    return false
  }
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
  if (sameTopicRecord(local, record.json)) {
    return { kind: 'adopt', topicId: local.id, json: record.json, revision: record.revision }
  }
  const remote = weighJson(record.json)
  // A remote copy this build cannot read is not evidence that it is worth less
  // than the local one: it may be a later build's format. Pushing over it would
  // destroy the only copy of whatever it holds, so it is reported instead.
  if (!remote) return null
  const mine = weigh(local)
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
    const candidate = locals.get(id)
    const localRetired = candidate !== undefined && isRetiredCatalogTopic(candidate)
    const local = localRetired ? undefined : candidate
    const record = remotes.get(id)
    const known = ledger[id]

    // A ledger/outbox deletion alone cannot cover first sync or stale clients
    // republishing after acknowledgement. Apply the owner retirement on every
    // pass, but never delete a learner-owned remote copy on the strength of an id.
    if (localRetired) actions.push({ kind: 'dropLocal', topicId: id })
    if (id === 'hex-digits-binary' && record) {
      let retired = false
      try {
        const parsed = JSON.parse(record.json) as Topic
        retired = parsed?.id === id && isRetiredCatalogTopic(parsed)
      } catch { /* Unreadable remote content keeps normal conflict handling. */ }
      if (retired) {
        actions.push(local
          ? { kind: 'push', topicId: id, json: topicJson(local), revision: record.revision + 1 }
          : { kind: 'deleteRemote', topicId: id })
        continue
      }
      if (!local) {
        actions.push({ kind: 'adopt', topicId: id, json: record.json, revision: record.revision })
        continue
      }
    }

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

    // Both moved, but to the same record: two devices applying the same
    // migration arrive here. There is nothing to settle, so take the server's
    // revision rather than report agreement as a conflict.
    if (sameTopicRecord(local, record.json)) {
      actions.push({ kind: 'adopt', topicId: id, json: record.json, revision: record.revision })
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
