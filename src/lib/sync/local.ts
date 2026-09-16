import {
  SHIPPED_CATALOG_TOPIC_IDS,
  catalogDefinitions,
  freshCatalogTopic,
} from '../catalog'
import {
  adoptLegacyLessonSittings,
  parseLibrary,
  reconcileLoadedLibrary,
} from '../storage'
import type { CurrentLibrary } from '../types'

const CACHE_FORMAT = 1 as const
const CACHE_PREFIX = 'argus.library.sync.v1.'
const RECOVERY_PREFIX = 'argus.library.recovery.v1.'
const PENDING_PREFIX = 'argus.library.sync.pending.v1.'
const LEGACY_OWNER_KEY = 'argus.library.v5.legacy-owner'
const LEGACY_KEYS = ['argus.library.v5', 'argus.library.v4', 'argus.library.v3', 'argus.library.v2'] as const

interface CacheEnvelope {
  format: typeof CACHE_FORMAT
  uid: string
  library: CurrentLibrary
}

export type LocalLibraryCandidate =
  | { kind: 'missing' }
  | { kind: 'valid'; source: 'uid' | 'legacy'; library: CurrentLibrary }
  | { kind: 'invalid'; source: 'uid' | 'legacy'; raw: string; error: string }

function cacheKey(uid: string): string {
  return `${CACHE_PREFIX}${uid}`
}

function recoveryKey(uid: string): string {
  return `${RECOVERY_PREFIX}${uid}`
}

function pendingKey(uid: string): string {
  return `${PENDING_PREFIX}${uid}`
}

function parseStoredLibrary(value: unknown, now: Date): CurrentLibrary | null {
  const parsed = parseLibrary(value)
  if (!parsed.ok) return null
  const adopted = adoptLegacyLessonSittings(parsed.library)
  return reconcileLoadedLibrary(adopted, now).library
}

export function freshLibrary(now: Date = new Date()): CurrentLibrary {
  const candidate: CurrentLibrary = {
    version: 5,
    topics: catalogDefinitions().map((definition) => freshCatalogTopic(definition, now)),
    catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS].sort(),
  }
  const parsed = parseLibrary(candidate)
  if (!parsed.ok) throw new Error(`The shipped catalog could not form a learner library: ${parsed.error}`)
  return parsed.library
}

export function readLocalLibrary(uid: string, now: Date = new Date()): LocalLibraryCandidate {
  try {
    const rawCache = localStorage.getItem(cacheKey(uid))
    if (rawCache !== null) {
      try {
        const parsed: unknown = JSON.parse(rawCache)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return { kind: 'invalid', source: 'uid', raw: rawCache, error: 'The account cache envelope is invalid.' }
        }
        const envelope = parsed as Partial<CacheEnvelope>
        if (envelope.format !== CACHE_FORMAT || envelope.uid !== uid) {
          return { kind: 'invalid', source: 'uid', raw: rawCache, error: 'The account cache belongs to a different identity or format.' }
        }
        const library = parseStoredLibrary(envelope.library, now)
        if (!library) {
          return { kind: 'invalid', source: 'uid', raw: rawCache, error: 'The account cache contains an invalid learner library.' }
        }
        return { kind: 'valid', source: 'uid', library }
      } catch (error) {
        return {
          kind: 'invalid',
          source: 'uid',
          raw: rawCache,
          error: error instanceof Error ? error.message : 'The account cache is not valid JSON.',
        }
      }
    }

    const owner = localStorage.getItem(LEGACY_OWNER_KEY)
    if (owner && owner !== uid) return { kind: 'missing' }

    const found = LEGACY_KEYS
      .map((key) => ({ key, raw: localStorage.getItem(key) }))
      .find((entry) => entry.raw !== null)
    if (!found?.raw) return { kind: 'missing' }

    try {
      const library = parseStoredLibrary(JSON.parse(found.raw), now)
      if (!library) {
        return { kind: 'invalid', source: 'legacy', raw: found.raw, error: 'The legacy learner library is invalid.' }
      }
      return { kind: 'valid', source: 'legacy', library }
    } catch (error) {
      return {
        kind: 'invalid',
        source: 'legacy',
        raw: found.raw,
        error: error instanceof Error ? error.message : 'The legacy learner library is not valid JSON.',
      }
    }
  } catch (error) {
    return {
      kind: 'invalid',
      source: 'uid',
      raw: '',
      error: error instanceof Error ? error.message : 'Local storage is unavailable.',
    }
  }
}

export function writeLocalLibrary(uid: string, library: CurrentLibrary): void {
  try {
    const envelope: CacheEnvelope = { format: CACHE_FORMAT, uid, library }
    localStorage.setItem(cacheKey(uid), JSON.stringify(envelope))
  } catch {
    // The in-memory library remains authoritative for this session. Export and
    // the cloud copy remain recovery paths when browser storage is unavailable.
  }
}

export function bindLegacyLibrary(uid: string): void {
  try {
    if (!localStorage.getItem(LEGACY_OWNER_KEY)) localStorage.setItem(LEGACY_OWNER_KEY, uid)
  } catch {
    // Per-UID storage still isolates accounts even if this migration marker
    // cannot be written.
  }
}

export function preserveRecovery(uid: string, reason: string, raw: string): void {
  try {
    const key = recoveryKey(uid)
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    const entries = Array.isArray(parsed) ? parsed : []
    entries.push({ reason, savedAt: new Date().toISOString(), raw })
    localStorage.setItem(key, JSON.stringify(entries.slice(-5)))
  } catch {
    // Recovery preservation is best effort when localStorage itself is broken.
  }
}

export function recoveryEntryCount(uid: string): number {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(recoveryKey(uid)) ?? '[]')
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

export function markPending(uid: string): void {
  try {
    localStorage.setItem(pendingKey(uid), '1')
  } catch {
    // The validated UID cache itself is also a durable pending snapshot.
  }
}

export function clearPending(uid: string): void {
  try {
    localStorage.removeItem(pendingKey(uid))
  } catch {
    /* the next reconciliation remains conservative */
  }
}

export function hasPending(uid: string): boolean {
  try {
    return localStorage.getItem(pendingKey(uid)) === '1'
  } catch {
    return true
  }
}

export function libraryMetaJson(library: CurrentLibrary): string {
  return JSON.stringify({
    version: 5,
    catalogDelivered: [...new Set(library.catalogDelivered ?? [])].sort(),
  })
}

export function parseLibraryMeta(json: string | null): string[] {
  if (!json) return []
  try {
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return []
    const raw = (parsed as { catalogDelivered?: unknown }).catalogDelivered
    if (!Array.isArray(raw)) return []
    return [...new Set(raw.filter((value): value is string => typeof value === 'string' && value.trim().length > 0))].sort()
  } catch {
    return []
  }
}
