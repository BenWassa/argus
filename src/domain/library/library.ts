import type { Topic } from './topic'

/**
 * A library: the topics this learner owns, and the record versions Argus
 * still recognises as one.
 *
 * The version tag looks like a storage detail, and the migration that reads
 * it is one — but the domain cannot express "reconcile the shipped catalog
 * into a library" without naming the thing being reconciled, so the type
 * belongs here and `infrastructure/persistence` imports it, not the reverse.
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
