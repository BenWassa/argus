import {
  NO_RECONCILIATION,
  SHIPPED_CATALOG_TOPIC_IDS,
  catalogDefinitions,
  freshCatalogTopic,
  type CatalogReconciliation,
} from './catalog'
import { clearAllLessonSittings } from './morseLessonSittingStorage'
import {
  adoptLegacyLessonSittings,
  parseLibrary,
  reconcileLoadedLibrary,
} from './storage'
import type { CurrentLibrary, Topic } from './types'

const CACHE_FORMAT = 1 as const
const CACHE_PREFIX = 'argus.library.sync.v1.'
const RECOVERY_PREFIX = 'argus.library.recovery.v1.'
const LEGACY_OWNER_KEY = 'argus.library.v5.legacy-owner'
const LEGACY_KEYS = ['argus.library.v5', 'argus.library.v4', 'argus.library.v3', 'argus.library.v2'] as const
const TEST_CLOUD_PREFIX = 'argus.test-cloud.v1.'

export interface SyncMetadata {
  /** Last cloud revision this device reconciled against. Null means no shared ancestor. */
  revision: number | null
  /** Exact canonical library held by that revision. Used only as a three-way merge base. */
  base: CurrentLibrary | null
}

export interface UserProgressCache extends SyncMetadata {
  format: typeof CACHE_FORMAT
  uid: string
  library: CurrentLibrary
}

export interface CloudLibrarySnapshot {
  revision: number
  library: CurrentLibrary
  lastMutationId: string | null
}

export interface ProgressCloud {
  read(uid: string): Promise<CloudLibrarySnapshot | null>
  write(
    uid: string,
    expectedRevision: number | null,
    library: CurrentLibrary,
    mutationId: string,
  ): Promise<CloudLibrarySnapshot>
}

export class CloudRevisionConflictError extends Error {
  constructor() {
    super('The cloud learner library changed while this write was in flight.')
    this.name = 'CloudRevisionConflictError'
  }
}

export interface LibraryConflict {
  reason: 'divergent-topics' | 'cloud-missing-after-sync'
  topicIds: string[]
  local: CurrentLibrary
  cloud: CurrentLibrary | null
  cloudRevision: number | null
  metadata: SyncMetadata
}

export type CopyReconciliation =
  | { kind: 'merged'; library: CurrentLibrary }
  | { kind: 'conflict'; topicIds: string[] }

export type BootstrapResult =
  | {
      kind: 'ready'
      library: CurrentLibrary
      report: CatalogReconciliation
      metadata: SyncMetadata
      connectivity: 'online' | 'offline'
      restoredFrom: 'cache' | 'legacy' | 'cloud' | 'fresh' | 'merged'
    }
  | { kind: 'conflict'; conflict: LibraryConflict }
  | { kind: 'error'; error: string }

export type SyncOnceResult =
  | {
      kind: 'ready'
      library: CurrentLibrary
      report: CatalogReconciliation
      metadata: SyncMetadata
    }
  | { kind: 'conflict'; conflict: LibraryConflict }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function same<T>(a: T | undefined, b: T | undefined): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function sameLibrary(a: CurrentLibrary, b: CurrentLibrary): boolean {
  return same(a, b)
}

function mapTopics(library: CurrentLibrary | null): Map<string, Topic> {
  return new Map((library?.topics ?? []).map((topic) => [topic.id, topic]))
}

function chooseOrder(local: CurrentLibrary, cloud: CurrentLibrary): string[] {
  const order = local.topics.map((topic) => topic.id)
  for (const topic of cloud.topics) if (!order.includes(topic.id)) order.push(topic.id)
  return order
}

/**
 * Conservative semantic reconciliation.
 *
 * The unit of automatic composition is a whole topic. If only one side changed
 * a topic since the shared base, that side wins. Independent topic changes and
 * unique user-authored topics compose. If both sides changed the same topic, we
 * stop: evidence, scheduler clocks, formative state and author edits are too
 * meaningful to guess field-by-field. This is deliberately stricter than a
 * timestamp or "higher status" heuristic and therefore cannot fabricate
 * evidence or regress a legitimate stronger record silently.
 */
export function reconcileLibraryCopies(
  local: CurrentLibrary,
  cloud: CurrentLibrary,
  base: CurrentLibrary | null,
): CopyReconciliation {
  if (sameLibrary(local, cloud)) return { kind: 'merged', library: local }

  const localTopics = mapTopics(local)
  const cloudTopics = mapTopics(cloud)
  const baseTopics = mapTopics(base)
  const ids = new Set([...localTopics.keys(), ...cloudTopics.keys(), ...baseTopics.keys()])
  const chosen = new Map<string, Topic>()
  const conflicts: string[] = []

  for (const id of ids) {
    const l = localTopics.get(id)
    const c = cloudTopics.get(id)
    const b = baseTopics.get(id)

    if (same(l, c)) {
      if (l) chosen.set(id, l)
      continue
    }

    if (base) {
      // One side is still exactly the ancestor: the other side made the only
      // change, including an intentional deletion.
      if (same(l, b)) {
        if (c) chosen.set(id, c)
        continue
      }
      if (same(c, b)) {
        if (l) chosen.set(id, l)
        continue
      }

      // The id did not exist at the ancestor and only one side created it.
      if (!b && (!!l !== !!c)) {
        if (l) chosen.set(id, l)
        if (c) chosen.set(id, c)
        continue
      }

      conflicts.push(id)
      continue
    }

    // No shared ancestor (first rollout / imported install). Unique topic ids
    // are safely unionable; an unequal collision is not.
    if (!!l !== !!c) {
      if (l) chosen.set(id, l)
      if (c) chosen.set(id, c)
      continue
    }
    conflicts.push(id)
  }

  if (conflicts.length > 0) return { kind: 'conflict', topicIds: conflicts.sort() }

  const catalogDelivered = [
    ...new Set([...(local.catalogDelivered ?? []), ...(cloud.catalogDelivered ?? [])]),
  ].sort()
  const order = chooseOrder(local, cloud)
  return {
    kind: 'merged',
    library: {
      version: 5,
      topics: order.flatMap((id) => {
        const topic = chosen.get(id)
        return topic ? [topic] : []
      }),
      catalogDelivered,
    },
  }
}

function freshLibrary(now: Date): CurrentLibrary {
  const candidate: CurrentLibrary = {
    version: 5,
    topics: catalogDefinitions().map((definition) => freshCatalogTopic(definition, now)),
    catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS].sort(),
  }
  const parsed = parseLibrary(candidate)
  if (!parsed.ok) throw new Error(`The shipped catalog could not form a learner library: ${parsed.error}`)
  return parsed.library
}

function cacheKey(uid: string): string {
  return `${CACHE_PREFIX}${uid}`
}

function recoveryKey(uid: string): string {
  return `${RECOVERY_PREFIX}${uid}`
}

export function userCacheKey(uid: string): string {
  return cacheKey(uid)
}

export function preserveRecovery(uid: string, reason: string, raw: string): void {
  try {
    const key = recoveryKey(uid)
    const existingRaw = localStorage.getItem(key)
    const existing = existingRaw ? JSON.parse(existingRaw) : []
    const entries = Array.isArray(existing) ? existing : []
    entries.push({ reason, savedAt: new Date().toISOString(), raw })
    // Recovery is diagnostic insurance, not an unbounded log. Keep the latest
    // five snapshots; each contains a full portable/raw record.
    localStorage.setItem(key, JSON.stringify(entries.slice(-5)))
  } catch {
    // If storage itself is unavailable, the in-memory copy remains untouched.
  }
}

export function recoveryEntryCount(uid: string): number {
  try {
    const value = JSON.parse(localStorage.getItem(recoveryKey(uid)) ?? '[]')
    return Array.isArray(value) ? value.length : 0
  } catch {
    return 0
  }
}

export type CacheCandidate =
  | { kind: 'missing' }
  | { kind: 'valid'; cache: UserProgressCache }
  | { kind: 'invalid'; raw: string; error: string }

export function readUserCache(uid: string): CacheCandidate {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(cacheKey(uid))
  } catch (error) {
    return { kind: 'invalid', raw: '', error: error instanceof Error ? error.message : 'Local storage is unavailable.' }
  }
  if (raw === null) return { kind: 'missing' }

  try {
    const data: unknown = JSON.parse(raw)
    if (!isRecord(data) || data.format !== CACHE_FORMAT || data.uid !== uid) {
      return { kind: 'invalid', raw, error: 'The per-account cache envelope is invalid.' }
    }
    const revision = data.revision === null
      ? null
      : Number.isInteger(data.revision) && Number(data.revision) >= 1
        ? Number(data.revision)
        : undefined
    if (revision === undefined) return { kind: 'invalid', raw, error: 'The per-account cache revision is invalid.' }

    const parsedLibrary = parseLibrary(data.library)
    if (!parsedLibrary.ok) return { kind: 'invalid', raw, error: parsedLibrary.error }

    let base: CurrentLibrary | null = null
    if (data.base !== null) {
      const parsedBase = parseLibrary(data.base)
      if (!parsedBase.ok) return { kind: 'invalid', raw, error: `Sync base: ${parsedBase.error}` }
      base = parsedBase.library
    }
    if ((revision === null) !== (base === null)) {
      return { kind: 'invalid', raw, error: 'The per-account cache has an incomplete sync base.' }
    }

    return {
      kind: 'valid',
      cache: {
        format: CACHE_FORMAT,
        uid,
        revision,
        base,
        library: parsedLibrary.library,
      },
    }
  } catch (error) {
    return { kind: 'invalid', raw, error: error instanceof Error ? error.message : 'The per-account cache is not valid JSON.' }
  }
}

export function writeUserCache(uid: string, library: CurrentLibrary, metadata: SyncMetadata): void {
  try {
    const cache: UserProgressCache = {
      format: CACHE_FORMAT,
      uid,
      revision: metadata.revision,
      base: metadata.base,
      library,
    }
    localStorage.setItem(cacheKey(uid), JSON.stringify(cache))

    // Existing Playwright tests intentionally exercise the old storage key.
    // Mirror only in the explicit test-auth build so production account
    // isolation is never weakened for test convenience.
    if (import.meta.env.VITE_ARGUS_TEST_AUTH_UID) {
      localStorage.setItem('argus.library.v5', JSON.stringify(library))
    }
  } catch {
    // The live library stays usable in memory. Sync diagnostics surface that a
    // durable local write could not be retained on this device.
  }
}

interface LegacyCandidate {
  kind: 'missing' | 'invalid' | 'valid'
  raw?: string
  library?: CurrentLibrary
}

function readLegacyCandidate(uid: string, now: Date): LegacyCandidate {
  try {
    const owner = localStorage.getItem(LEGACY_OWNER_KEY)
    if (owner && owner !== uid) return { kind: 'missing' }

    const found = LEGACY_KEYS
      .map((key) => ({ key, raw: localStorage.getItem(key) }))
      .find((entry) => entry.raw !== null)
    if (!found?.raw) return { kind: 'missing' }

    try {
      const json: unknown = JSON.parse(found.raw)
      const parsed = parseLibrary(json)
      if (!parsed.ok) return { kind: 'invalid', raw: found.raw }
      const adopted = adoptLegacyLessonSittings(parsed.library)
      return { kind: 'valid', raw: found.raw, library: reconcileLoadedLibrary(adopted, now).library }
    } catch {
      return { kind: 'invalid', raw: found.raw }
    }
  } catch {
    return { kind: 'missing' }
  }
}

function bindLegacyTo(uid: string): void {
  try {
    if (!localStorage.getItem(LEGACY_OWNER_KEY)) localStorage.setItem(LEGACY_OWNER_KEY, uid)
  } catch {
    /* account isolation still holds for the per-UID cache */
  }
}

function mutationId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

function describeSyncError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : ''
  if (code.includes('permission-denied')) return 'Firebase denied access to this account’s learner library.'
  if (code.includes('unavailable') || code.includes('network') || code.includes('offline')) {
    return 'The cloud learner library could not be reached.'
  }
  if (error instanceof Error && error.message) return error.message
  return 'The cloud learner library could not be reached.'
}

function conflict(
  reason: LibraryConflict['reason'],
  topicIds: string[],
  local: CurrentLibrary,
  cloud: CloudLibrarySnapshot | null,
  metadata: SyncMetadata,
): LibraryConflict {
  return {
    reason,
    topicIds,
    local,
    cloud: cloud?.library ?? null,
    cloudRevision: cloud?.revision ?? null,
    metadata,
  }
}

/**
 * Reconcile the account at application entry before any learner route mounts.
 */
export async function bootstrapProgress(
  uid: string,
  cloud: ProgressCloud,
  now: Date = new Date(),
  retry = 0,
): Promise<BootstrapResult> {
  const cached = readUserCache(uid)
  if (cached.kind === 'invalid') preserveRecovery(uid, 'invalid-per-uid-cache', cached.raw)

  const legacy = cached.kind === 'missing' ? readLegacyCandidate(uid, now) : { kind: 'missing' as const }
  if (legacy.kind === 'invalid' && legacy.raw) preserveRecovery(uid, 'invalid-legacy-library', legacy.raw)

  const local = cached.kind === 'valid'
    ? cached.cache.library
    : legacy.kind === 'valid'
      ? legacy.library ?? null
      : null
  const metadata: SyncMetadata = cached.kind === 'valid'
    ? { revision: cached.cache.revision, base: cached.cache.base }
    : { revision: null, base: null }

  let remote: CloudLibrarySnapshot | null
  try {
    remote = await cloud.read(uid)
  } catch (error) {
    // Offline is safe only after this UID already has a validated per-account
    // cache. First binding must see cloud once, otherwise a recoverable remote
    // record could be overwritten later by an unknowingly stale local copy.
    if (cached.kind === 'valid') {
      const reconciled = reconcileLoadedLibrary(cached.cache.library, now)
      writeUserCache(uid, reconciled.library, metadata)
      return {
        kind: 'ready',
        library: reconciled.library,
        report: reconciled.report,
        metadata,
        connectivity: 'offline',
        restoredFrom: 'cache',
      }
    }
    return { kind: 'error', error: `${describeSyncError(error)} First authenticated setup needs one successful cloud check.` }
  }

  if (remote === null && cached.kind === 'valid' && metadata.revision !== null) {
    return {
      kind: 'conflict',
      conflict: conflict('cloud-missing-after-sync', [], cached.cache.library, null, metadata),
    }
  }

  let resolved: CurrentLibrary
  let restoredFrom: Extract<BootstrapResult, { kind: 'ready' }>['restoredFrom']

  if (local && remote) {
    const merged = reconcileLibraryCopies(local, remote.library, metadata.base)
    if (merged.kind === 'conflict') {
      return {
        kind: 'conflict',
        conflict: conflict('divergent-topics', merged.topicIds, local, remote, metadata),
      }
    }
    resolved = merged.library
    restoredFrom = sameLibrary(resolved, local)
      ? (cached.kind === 'valid' ? 'cache' : 'legacy')
      : sameLibrary(resolved, remote.library)
        ? 'cloud'
        : 'merged'
  } else if (local) {
    resolved = local
    restoredFrom = cached.kind === 'valid' ? 'cache' : 'legacy'
  } else if (remote) {
    resolved = remote.library
    restoredFrom = 'cloud'
  } else {
    resolved = freshLibrary(now)
    restoredFrom = 'fresh'
  }

  const normalized = reconcileLoadedLibrary(resolved, now)
  resolved = normalized.library

  const needsCloudWrite = remote === null || !sameLibrary(resolved, remote.library)
  let finalRevision = remote?.revision ?? null
  if (needsCloudWrite) {
    // Persist locally before the network mutation. If the process is interrupted
    // here, the next bootstrap sees the exact pending library and reconciles it.
    writeUserCache(uid, resolved, {
      revision: remote?.revision ?? null,
      base: remote?.library ?? null,
    })
    try {
      const written = await cloud.write(uid, remote?.revision ?? null, resolved, mutationId())
      finalRevision = written.revision
      remote = written
    } catch (error) {
      if (error instanceof CloudRevisionConflictError && retry < 2) {
        return bootstrapProgress(uid, cloud, now, retry + 1)
      }
      return { kind: 'error', error: describeSyncError(error) }
    }
  }

  if (finalRevision === null) {
    return { kind: 'error', error: 'The cloud learner library did not return a revision.' }
  }

  const finalMetadata: SyncMetadata = { revision: finalRevision, base: resolved }
  writeUserCache(uid, resolved, finalMetadata)
  if (legacy.kind !== 'missing') bindLegacyTo(uid)
  clearAllLessonSittings()

  return {
    kind: 'ready',
    library: resolved,
    report: normalized.report ?? NO_RECONCILIATION,
    metadata: finalMetadata,
    connectivity: 'online',
    restoredFrom,
  }
}

/** One coalesced/reconnect synchronization pass for an already-bootstrapped UID. */
export async function synchronizeProgress(
  uid: string,
  local: CurrentLibrary,
  metadata: SyncMetadata,
  cloud: ProgressCloud,
  now: Date = new Date(),
  retry = 0,
): Promise<SyncOnceResult> {
  const remote = await cloud.read(uid)
  if (remote === null) {
    if (metadata.revision !== null) {
      return { kind: 'conflict', conflict: conflict('cloud-missing-after-sync', [], local, null, metadata) }
    }
    const written = await cloud.write(uid, null, local, mutationId())
    return {
      kind: 'ready',
      library: local,
      report: NO_RECONCILIATION,
      metadata: { revision: written.revision, base: written.library },
    }
  }

  const merged = reconcileLibraryCopies(local, remote.library, metadata.base)
  if (merged.kind === 'conflict') {
    return {
      kind: 'conflict',
      conflict: conflict('divergent-topics', merged.topicIds, local, remote, metadata),
    }
  }

  const normalized = reconcileLoadedLibrary(merged.library, now)
  if (sameLibrary(normalized.library, remote.library)) {
    return {
      kind: 'ready',
      library: normalized.library,
      report: normalized.report,
      metadata: { revision: remote.revision, base: remote.library },
    }
  }

  try {
    const written = await cloud.write(uid, remote.revision, normalized.library, mutationId())
    return {
      kind: 'ready',
      library: normalized.library,
      report: normalized.report,
      metadata: { revision: written.revision, base: written.library },
    }
  } catch (error) {
    if (error instanceof CloudRevisionConflictError && retry < 2) {
      return synchronizeProgress(uid, local, metadata, cloud, now, retry + 1)
    }
    throw error
  }
}

/** Explicit user choice for a conflict we refused to guess about. */
export async function resolveProgressConflict(
  uid: string,
  choice: 'local' | 'cloud',
  current: LibraryConflict,
  cloudBackend: ProgressCloud,
  now: Date = new Date(),
): Promise<Extract<BootstrapResult, { kind: 'ready' }>> {
  if (choice === 'cloud') {
    if (!current.cloud || current.cloudRevision === null) {
      throw new Error('There is no cloud copy to restore.')
    }
    preserveRecovery(uid, 'conflict-local-copy', JSON.stringify(current.local))
    const normalized = reconcileLoadedLibrary(current.cloud, now)
    const metadata = { revision: current.cloudRevision, base: current.cloud }
    writeUserCache(uid, normalized.library, metadata)
    return {
      kind: 'ready',
      library: normalized.library,
      report: normalized.report,
      metadata,
      connectivity: 'online',
      restoredFrom: 'cloud',
    }
  }

  preserveRecovery(uid, 'conflict-cloud-copy', JSON.stringify(current.cloud))
  const normalized = reconcileLoadedLibrary(current.local, now)
  const written = await cloudBackend.write(
    uid,
    current.cloudRevision,
    normalized.library,
    mutationId(),
  )
  const metadata = { revision: written.revision, base: written.library }
  writeUserCache(uid, normalized.library, metadata)
  return {
    kind: 'ready',
    library: normalized.library,
    report: normalized.report,
    metadata,
    connectivity: 'online',
    restoredFrom: 'cache',
  }
}

/**
 * Browser-test cloud with the same revision/CAS contract, persisted separately
 * per UID in localStorage. It exists only when the explicit test-auth build flag
 * is present; production always uses Firestore.
 */
export function browserTestProgressCloud(): ProgressCloud {
  function key(uid: string) {
    return `${TEST_CLOUD_PREFIX}${uid}`
  }
  return {
    async read(uid) {
      const raw = localStorage.getItem(key(uid))
      if (!raw) return null
      const value = JSON.parse(raw) as CloudLibrarySnapshot
      const parsed = parseLibrary(value.library)
      if (!parsed.ok) throw new Error(parsed.error)
      return { ...value, library: parsed.library }
    },
    async write(uid, expectedRevision, library, id) {
      const current = await this.read(uid)
      if (current?.lastMutationId === id) return current
      if ((current?.revision ?? null) !== expectedRevision) throw new CloudRevisionConflictError()
      const next: CloudLibrarySnapshot = {
        revision: (current?.revision ?? 0) + 1,
        library,
        lastMutationId: id,
      }
      localStorage.setItem(key(uid), JSON.stringify(next))
      return next
    },
  }
}
