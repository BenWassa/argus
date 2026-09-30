import type { CurrentLibrary } from '../../domain/library/library'
import { clearAllLessonSittings } from '../../domain/morse/curriculum/lessonSittingStorage'
import { NO_RECONCILIATION, type CatalogReconciliation } from '../../domain/library/catalog'
import { parseLibrary } from './libraryParser'
import {
  adoptLegacyLessonSittings,
  freshSeedLibrary,
  reconcileLoadedLibrary,
} from './libraryMigrations'

/**
 * The library as this device holds it: localStorage, and the legacy keys a
 * returning learner may still have.
 *
 * This is the only module that reads or writes the store. Parsing and migration
 * are asked for by name rather than done here, so "what is on disk" and "is it
 * valid" and "is it current" stay three separate questions.
 */
const KEY = 'argus.library.v5'
const LEGACY_KEYS = ['argus.library.v4', 'argus.library.v3', 'argus.library.v2'] as const

/**
 * Which account the library under `KEY` belongs to. Absent until an account
 * first signs in on this device, which then claims whatever library is here:
 * that is the local-only progress #93 says must seed the cloud on first rollout.
 */
const OWNER_KEY = 'argus.library.owner.v1'
/** Another account's library, set aside while a different one is signed in. */
const PARKED_PREFIX = 'argus.library.parked.v1.'
/**
 * Stored records that could not be read, kept rather than overwritten. A record
 * this build cannot parse may be a later build's, or damaged in a way a person
 * can still repair by hand; either way it is not this build's to destroy.
 */
const RECOVERY_KEY = 'argus.library.recovery.v1'
const RECOVERY_LIMIT = 5

export interface LoadedLibrary {
  library: CurrentLibrary
  report: CatalogReconciliation
}

export function loadLibraryWithReport(now: Date = new Date()): LoadedLibrary {
  try {
    const found = [KEY, ...LEGACY_KEYS]
      .map((key) => ({ key, raw: localStorage.getItem(key) }))
      .find((entry) => entry.raw !== null)
    if (!found?.raw) {
      // Nothing stored, so there is no record for a stray sidecar to belong to.
      clearAllLessonSittings()
      return { library: freshSeedLibrary(now), report: NO_RECONCILIATION }
    }

    let json: unknown
    try {
      json = JSON.parse(found.raw)
    } catch {
      preserveRecovery(found.key, 'Not valid JSON.', found.raw, now)
      return { library: freshSeedLibrary(now), report: NO_RECONCILIATION }
    }
    const parsed = parseLibrary(json)
    if (!parsed.ok) {
      preserveRecovery(found.key, parsed.error, found.raw, now)
      clearAllLessonSittings()
      return { library: freshSeedLibrary(now), report: NO_RECONCILIATION }
    }

    // Promote a valid legacy record immediately. This makes the migration
    // durable even before the provider's first effect runs.
    const adopted = adoptLegacyLessonSittings(parsed.library)
    const reconciled = reconcileLoadedLibrary(adopted, now)
    if (found.key !== KEY || reconciled.library !== parsed.library) saveLibrary(reconciled.library)
    // The canonical store now holds everything the sidecar did. Remove it so it
    // can never become a competing source of truth again.
    clearAllLessonSittings()
    return reconciled
  } catch {
    return { library: freshSeedLibrary(now), report: NO_RECONCILIATION }
  }
}

export function loadLibrary(): CurrentLibrary {
  return loadLibraryWithReport().library
}

export function saveLibrary(library: CurrentLibrary): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(library))
  } catch {
    // Storage can be full or blocked in private mode. The app stays usable
    // for the session; export is the recovery path and it stays reachable.
  }
}

export function clearLibrary(): void {
  try {
    localStorage.removeItem(KEY)
    for (const key of LEGACY_KEYS) localStorage.removeItem(key)
  } catch {
    /* nothing to recover from */
  }
}

export interface RecoveryEntry {
  /** When this device set the record aside. */
  at: string
  /** The storage key it was found under. */
  key: string
  /** Why it could not be read. */
  reason: string
  /** Exactly what was stored. */
  raw: string
}

function preserveRecovery(key: string, reason: string, raw: string, now: Date): void {
  try {
    const kept = recoveryEntries()
    // The same unreadable record found again is not a second loss.
    if (kept.some((entry) => entry.raw === raw)) return
    const next = [...kept, { at: now.toISOString(), key, reason, raw }].slice(-RECOVERY_LIMIT)
    localStorage.setItem(RECOVERY_KEY, JSON.stringify(next))
  } catch {
    // A full store cannot hold a copy either. The original is still under its
    // own key until the fresh library is first saved over it.
  }
}

/** Records this device could not read and kept, oldest first. */
export function recoveryEntries(): RecoveryEntry[] {
  try {
    const raw = localStorage.getItem(RECOVERY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is RecoveryEntry =>
      !!entry
      && typeof entry === 'object'
      && typeof (entry as RecoveryEntry).at === 'string'
      && typeof (entry as RecoveryEntry).key === 'string'
      && typeof (entry as RecoveryEntry).reason === 'string'
      && typeof (entry as RecoveryEntry).raw === 'string')
  } catch {
    return []
  }
}

export function libraryOwner(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY)
  } catch {
    return null
  }
}

/**
 * Make the library on this device belong to `uid`.
 *
 * Returns null when nothing on screen needs to change: the library is already
 * this account's, or it belonged to nobody and this account has just claimed
 * it. Otherwise the current library is another account's. It is parked under
 * that account, and this account's own parked library — or, failing that, a
 * fresh seed that sync's first meeting will fill from the cloud — is returned
 * to be shown instead. One account's progress never becomes another's.
 *
 * Throws when the other account's library cannot be parked, so the caller can
 * refuse the switch rather than show or sync the wrong library.
 */
export function switchLibraryOwner(
  uid: string,
  current: CurrentLibrary,
  now: Date = new Date(),
): LoadedLibrary | null {
  const owner = libraryOwner()
  if (owner === uid) return null
  if (owner === null) {
    try {
      localStorage.setItem(OWNER_KEY, uid)
    } catch {
      // Unclaimed and unwritable: the next sign-in claims it instead.
    }
    return null
  }

  // Throws on a full store. Nothing below runs, and nothing has been lost.
  localStorage.setItem(`${PARKED_PREFIX}${owner}`, JSON.stringify(current))

  const parkedKey = `${PARKED_PREFIX}${uid}`
  const parkedRaw = localStorage.getItem(parkedKey)
  let next: LoadedLibrary = { library: freshSeedLibrary(now), report: NO_RECONCILIATION }
  if (parkedRaw !== null) {
    let parsed: ReturnType<typeof parseLibrary> | null = null
    try {
      parsed = parseLibrary(JSON.parse(parkedRaw))
    } catch {
      parsed = null
    }
    if (parsed?.ok) next = reconcileLoadedLibrary(parsed.library, now)
    else preserveRecovery(parkedKey, parsed ? parsed.error : 'Not valid JSON.', parkedRaw, now)
  }

  localStorage.setItem(KEY, JSON.stringify(next.library))
  localStorage.setItem(OWNER_KEY, uid)
  localStorage.removeItem(parkedKey)
  return next
}

export function exportFilename(now: Date = new Date()): string {
  return `argus-library-${now.toISOString().slice(0, 10)}.json`
}
