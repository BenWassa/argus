import type { CurrentLibrary } from '../../domain/library/library'
import { withLessonSitting } from '../../domain/morse/curriculum/lessonSitting'
import { readLessonSittingSidecar } from '../../domain/morse/curriculum/lessonSittingStorage'
import { seedLibrary } from '../../domain/library/catalogSeed'
import {
  SHIPPED_CATALOG_TOPIC_IDS,
  catalogDefinitions,
  freshCatalogTopic,
  reconcileCatalog,
  type CatalogReconciliation,
} from '../../domain/library/catalog'
import { parseLibrary } from './libraryParser'

/**
 * Where a library comes from when there is not one yet, and what a valid
 * record goes through before it becomes the live one.
 *
 * Migrations here are explicit and conservative: catalog-content upgrades,
 * legacy Morse absorption and retired sitting-sidecar adoption may settle
 * provenance or take over bookkeeping, but none may rewrite unrelated learner
 * state or silently broaden arbitrary user-authored topics.
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

function freshSeedLibraryUnreconciled(): CurrentLibrary {
  const parsed = parseLibrary(seedLibrary())
  return parsed.ok ? parsed.library : { version: 5, topics: [] }
}

const SCUBA_EQUIPMENT_ID = 'scuba-equipment-abbreviations'

/**
 * Exact six-card definition first shipped for the content-inbox request
 * “Scuba gear review and acronyms”. #121 strengthens that topic to a broader,
 * still finite gear-shorthand boundary. Keeping this snapshot here makes the
 * migration opt-in by identity: an edited/user-authored topic is never treated
 * as permission for the catalog to rewrite it.
 */
const SCUBA_EQUIPMENT_V1_ITEMS = [
  {
    id: 'scuba-equipment-abbreviations-item-01',
    prompt: 'SCUBA',
    answer: 'Self-contained underwater breathing apparatus — equipment that lets a diver breathe underwater from a carried gas supply.',
  },
  {
    id: 'scuba-equipment-abbreviations-item-02',
    prompt: 'BCD',
    answer: 'Buoyancy control device — the buoyancy bladder/system that helps a diver control buoyancy and commonly holds the cylinder.',
  },
  {
    id: 'scuba-equipment-abbreviations-item-03',
    prompt: 'SPG',
    answer: 'Submersible pressure gauge — an instrument that displays the pressure, and therefore remaining gas, in a cylinder.',
  },
  {
    id: 'scuba-equipment-abbreviations-item-04',
    prompt: 'LPI',
    answer: 'Low-pressure inflator — the hose and fitting that supplies low-pressure gas from a regulator to inflate a BCD.',
  },
  {
    id: 'scuba-equipment-abbreviations-item-05',
    prompt: 'DSMB',
    answer: 'Delayed surface marker buoy — an inflatable surface-signalling buoy deployed from underwater.',
  },
  {
    id: 'scuba-equipment-abbreviations-item-06',
    prompt: 'DPV',
    answer: 'Diver propulsion vehicle — a powered device used to propel a diver through the water.',
  },
] as const

/**
 * Upgrade only the exact #121 predecessor in place.
 *
 * The six original item ids remain stable inside the 13-item definition, so
 * evidence for vocabulary the learner already knew is retained. Any active
 * mastery/completion state is reopened because a six-card pass cannot satisfy
 * the stronger 13-term completion claim; its historical attempts stay intact.
 */
export function upgradeSeededScubaEquipment(library: CurrentLibrary): CurrentLibrary {
  const finalTopic = freshSeedLibraryUnreconciled().topics.find(
    (topic) => topic.id === SCUBA_EQUIPMENT_ID,
  )
  if (!finalTopic) return library

  let changed = false
  const topics = library.topics.map((topic) => {
    if (
      topic.id !== SCUBA_EQUIPMENT_ID ||
      topic.origin === 'user' ||
      topic.items.length !== SCUBA_EQUIPMENT_V1_ITEMS.length
    ) return topic

    const exactV1 = topic.items.every((item, index) => {
      const old = SCUBA_EQUIPMENT_V1_ITEMS[index]
      return (
        item.id === old.id &&
        (item.kind ?? 'forward') === 'forward' &&
        item.prompt === old.prompt &&
        item.answer === old.answer
      )
    })
    if (!exactV1) return topic

    changed = true
    const strongerBoundary = topic.status !== 'unstarted'
    return {
      ...topic,
      title: finalTopic.title,
      scope: finalTopic.scope,
      track: finalTopic.track,
      items: finalTopic.items,
      learn: finalTopic.learn,
      origin: 'catalog' as const,
      ...(strongerBoundary
        ? {
            status: 'learning' as const,
            learningAt: topic.learningAt ?? topic.lastTestedAt ?? topic.createdAt,
            drilledAt: null,
            completedAt: null,
            spotCheckedAt: null,
          }
        : {}),
    }
  })

  return changed ? { ...library, topics } : library
}


/**
 * Everything a stored or imported library goes through before it becomes the
 * live record: explicit content migrations first, then delivery of shipped
 * catalog topics this library has never been offered. These steps are append-
 * or migration-only and may not rewrite unrelated learner state.
 */
export function reconcileLoadedLibrary(
  library: CurrentLibrary,
  now: Date = new Date(),
): { library: CurrentLibrary; report: CatalogReconciliation } {
  return reconcileCatalog(
    upgradeSeededScubaEquipment(absorbSeededMorseBaseline(library)),
    now,
  )
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
