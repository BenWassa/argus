import type { Topic } from '../../domain/library/topic'

/**
 * The persisted shape of a library, and the versions storage still accepts.
 *
 * This is a storage concern rather than a domain one: the version number exists
 * because records written by older builds are still on disk, and `parseLibrary`
 * is the boundary that migrates them forward.
 */
/** Import compatibility shape. Older exports migrate forward at the v5 boundary. */
export interface LegacyLibraryV4 {
  version: 4
  topics: Topic[]
}

/** Every library returned by storage/export is normalized to this version. */
export interface CurrentLibrary {
  version: 5
  topics: Topic[]
  /**
   * Shipped catalog topic ids this library has already been offered. Delivery
   * is recorded rather than inferred from presence, so deleting a catalog
   * topic is durable and reconciliation never resurrects it.
   */
  catalogDelivered?: string[]
}

/** The seed is itself a v5 record; storage remains the migration boundary. */
export type Library = LegacyLibraryV4 | CurrentLibrary
