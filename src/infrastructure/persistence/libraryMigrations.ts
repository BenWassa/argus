import type { CurrentLibrary } from '../../domain/library/library'
import { withLessonSitting } from '../../domain/morse/curriculum/lessonSitting'
import { readLessonSittingSidecar } from '../../domain/morse/curriculum/lessonSittingStorage'
import { seedLibrary } from '../../domain/library/catalogSeed'
import {
  SHIPPED_CATALOG_TOPIC_IDS,
  catalogDefinition,
  catalogDefinitions,
  freshCatalogTopic,
  reconcileCatalog,
  topicOrigin,
  type CatalogReconciliation,
} from '../../domain/library/catalog'
import { parseLibrary } from './libraryParser'

/**
 * Where a library comes from when there is not one yet, and what a valid
 * record goes through before it becomes the live one.
 *
 * Every migration here is append- or migration-only: the Morse baseline
 * absorption, the shipped-title renames and the retired sitting sidecar
 * adoption may settle provenance, rename or take over bookkeeping, but none may
 * rewrite unrelated learner state.
 */
/** A library holding nothing, and expecting nothing. Reset means reset. */
export function emptyLibrary(): CurrentLibrary {
  return { version: 5, topics: [], catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS].sort() }
}

/**
 * The library a learner who has never used Argus starts with (#71).
 *
 * Built from the shipped catalog through `freshCatalogTopic`, which is the same
 * door an existing library receives a new catalog topic through. That is the
 * whole point: a first install and a later delivery hand over identical topics,
 * so there is one definition of "a topic you have not done yet" rather than two.
 *
 * The seed carries demonstration learner state — a drilled NATO deck, a
 * completed bearings record, attempt history with dates — because it doubles as
 * the development and test fixture. None of it belongs to this learner. Shipping
 * it as their permanent record would put a completion on the Progress screen
 * that nobody earned, so delivery keeps the seed's *content* and drops every
 * status, timestamp, attempt and evidence field it carries.
 */
export function freshSeedLibrary(now: Date = new Date()): CurrentLibrary {
  const migrated = parseLibrary({
    version: 5,
    topics: catalogDefinitions().map((definition) => freshCatalogTopic(definition, now)),
  })
  if (!migrated.ok) return emptyLibrary()
  return {
    ...migrated.library,
    catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS].sort(),
  }
}

const SEEDED_MORSE_ID = 'international-morse-letters-printed'

/** Absorb the temporary #23 control topic without duplicating it or losing its
 * stable item evidence/history. Only the exact shipped 26-row identity is
 * upgraded; arbitrary user-authored Morse topics are left alone. */
export function absorbSeededMorseBaseline(library: CurrentLibrary): CurrentLibrary {
  const finalTopic = freshSeedLibraryUnreconciled().topics.find((topic) => topic.id === SEEDED_MORSE_ID)
  if (!finalTopic) return library
  const topics = library.topics.map((topic) => {
    if (topic.id !== SEEDED_MORSE_ID || topic.items.length !== finalTopic.items.length) return topic
    const sameRows = topic.items.every((item, index) =>
      item.id === finalTopic.items[index].id &&
      item.prompt === finalTopic.items[index].prompt &&
      item.answer === finalTopic.items[index].answer,
    )
    if (!sameRows) return topic
    const hadForwardCompletion = topic.completedAt !== null &&
      topic.items.some((item) => item.kind !== 'bidirectional')
    return {
      ...topic,
      title: finalTopic.title,
      scope: finalTopic.scope,
      items: finalTopic.items,
      learn: finalTopic.learn,
      // Absorption is the explicit statement that this record is the shipped
      // topic, so it also settles provenance for catalog reconciliation.
      origin: 'catalog' as const,
      // A #23 completion is retained in history, but cannot remain the active
      // completion state for the stronger bidirectional claim.
      ...(hadForwardCompletion ? { status: 'drilled' as const, completedAt: null } : {}),
    }
  })
  return { ...library, topics }
}

/**
 * Titles the catalog has shipped before, by topic id. Catalog delivery never
 * rewrites a topic a library already holds, so a shorter shipped name reaches
 * an existing library only through this explicit list.
 */
const PREVIOUS_SHIPPED_TITLES: Readonly<Record<string, readonly string[]>> = {
  'nato-phonetic': ['NATO phonetic alphabet'],
  'international-morse-letters-printed': ['International Morse — Letters (printed)'],
  'ooda-loop': ['OODA loop'],
  'primary-survey': ['Primary survey'],
  'cardinal-bearings': ['Cardinal and intercardinal bearings'],
  'scuba-equipment-abbreviations': ['Recreational scuba equipment abbreviations'],
  'radiotelephony-numbers': ['Radiotelephony numbers'],
  'si-prefixes': ['SI prefixes'],
  'greek-alphabet': ['Greek alphabet'],
  'hex-digits-binary': ['Hexadecimal digits in binary'],
  'beaufort-wind-scale': ['Beaufort wind scale'],
  'firearm-safety-acts-prove': ['Canadian firearm safety — ACTS & PROVE'],
}

/**
 * Carry a renamed shipped title into a library that already holds the topic.
 *
 * A title is presentation, not evidence, so this touches nothing else. It only
 * applies to a topic the catalog still owns whose title is exactly one the
 * catalog once shipped: a learner who renamed or edited the topic keeps what
 * they wrote. Idempotent, so every device that loads the library arrives at the
 * same record, which sync then sees as agreement rather than a conflict.
 */
export function renameShippedTitles(library: CurrentLibrary): CurrentLibrary {
  let changed = false
  const topics = library.topics.map((topic) => {
    const previous = PREVIOUS_SHIPPED_TITLES[topic.id]
    if (!previous?.includes(topic.title) || topicOrigin(topic) !== 'catalog') return topic
    const definition = catalogDefinition(topic.id)
    if (!definition || definition.title === topic.title) return topic
    changed = true
    return { ...topic, title: definition.title }
  })
  return changed ? { ...library, topics } : library
}

function freshSeedLibraryUnreconciled(): CurrentLibrary {
  const parsed = parseLibrary(seedLibrary())
  return parsed.ok ? parsed.library : { version: 5, topics: [] }
}

/**
 * Everything a stored or imported library goes through before it becomes the
 * live record: the one explicit Morse migration, the shipped-title renames,
 * then delivery of shipped catalog topics this library has never been offered.
 * All are append- or migration-only; none may rewrite unrelated learner state.
 */
export function reconcileLoadedLibrary(
  library: CurrentLibrary,
  now: Date = new Date(),
): { library: CurrentLibrary; report: CatalogReconciliation } {
  return reconcileCatalog(renameShippedTitles(absorbSeededMorseBaseline(library)), now)
}

/**
 * Take over any active sitting the retired `argus.morse-learn-sittings.v1`
 * sidecar still holds (#66).
 *
 * Adoption is deliberately one-directional and conservative: a sidecar sitting
 * is used only for a topic whose canonical `lessonSitting` is absent, so the
 * durable field always wins a disagreement, and revisit ids naming items the
 * topic no longer has are dropped rather than failing the load — this is a
 * migration of local formative bookkeeping, not an import that could fabricate
 * progress. Running it a second time is a no-op, because the sidecar is removed
 * as soon as the canonical store has taken over.
 *
 * It is called only from `loadLibraryWithReport`. An import or a reset replaces
 * the whole library and clears the sidecar instead, so a sitting belonging to a
 * replaced library can never appear inside its successor.
 */
export function adoptLegacyLessonSittings(library: CurrentLibrary): CurrentLibrary {
  const sidecar = readLessonSittingSidecar()
  if (Object.keys(sidecar).length === 0) return library

  let changed = false
  const topics = library.topics.map((topic) => {
    if (topic.lessonSitting !== undefined) return topic
    const found = sidecar[topic.id]
    if (!found) return topic

    const liveIds = new Set(topic.items.flatMap((item) => (item.id ? [item.id] : [])))
    const revisitItemIds = found.revisitItemIds.filter((itemId) => liveIds.has(itemId))
    const adopted = withLessonSitting(topic, { ...found, revisitItemIds })
    if (adopted === topic) return topic
    changed = true
    return adopted
  })

  return changed ? { ...library, topics } : library
}
