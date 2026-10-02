import type { CurrentLibrary } from '../domain/library/library'
import { seedLibrary } from '../domain/library/catalogSeed'
import { NO_RECONCILIATION } from '../domain/library/catalog'
import { parseLibrary } from '../infrastructure/persistence/libraryParser'
import { freshSeedLibrary, reconcileLoadedLibrary } from '../infrastructure/persistence/libraryMigrations'
import type { LoadedLibrary } from '../infrastructure/persistence/localLibraryRepository'

/**
 * The library a demo visitor lands in: the shipped catalog with a little
 * progress already on it, so Today and Library show a learner part-way through
 * rather than an empty tracker.
 *
 * The progress is not invented here. `seedLibrary()` is the repository's own
 * development fixture and already holds a drilled NATO alphabet, an OODA loop in
 * learning and a banked cardinal-bearings topic, each with dated attempt
 * history. Real topics reach a real library through the same migration and
 * catalog delivery, so the rest of the catalog arrives unstarted exactly as it
 * would for a returning learner. The scheduler is untouched: it simply reads
 * these records as it reads any others.
 *
 * Dates in the fixture are offsets from load time, so the demo looks the same on
 * every visit. Absolute dates would age until every topic read as decayed.
 */
export function demoLibraryWithReport(now: Date = new Date()): LoadedLibrary {
  const parsed = parseLibrary(seedLibrary())
  // The fixture is covered by its own tests; falling back keeps the app up
  // rather than blank if it is ever edited into something unparseable.
  if (!parsed.ok) return { library: freshSeedLibrary(now), report: NO_RECONCILIATION }
  return reconcileLoadedLibrary(parsed.library, now)
}

export function demoLibrary(now: Date = new Date()): CurrentLibrary {
  return demoLibraryWithReport(now).library
}
