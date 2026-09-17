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

    const parsed = parseLibrary(JSON.parse(found.raw))
    if (!parsed.ok) {
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

export function exportFilename(now: Date = new Date()): string {
  return `argus-library-${now.toISOString().slice(0, 10)}.json`
}
