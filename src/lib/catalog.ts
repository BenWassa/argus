import shippedCatalog from './shippedCatalog.json'
import { seedLibrary } from './seed'
import type { CurrentLibrary, IdentifiedItem, Topic } from './types'

/**
 * The shipped catalog is the set of topic ids Argus itself ships. It is held as
 * a plain manifest rather than derived from the seed so that ownership is
 * explicit, reviewable in a diff, and readable by the maintainer ingestion
 * tooling, which cannot execute the TypeScript seed.
 */
export const SHIPPED_CATALOG_TOPIC_IDS: readonly string[] = Object.freeze([
  ...shippedCatalog.topicIds,
])

const SHIPPED_IDS = new Set(SHIPPED_CATALOG_TOPIC_IDS)

export function isShippedCatalogId(id: string): boolean {
  return SHIPPED_IDS.has(id)
}

/**
 * Content definitions for the shipped catalog, taken from the seed. The seed
 * additionally carries demonstration learner state for a first-run library;
 * catalog delivery deliberately strips all of it.
 */
export function catalogDefinitions(): Topic[] {
  const byId = new Map(seedLibrary().topics.map((topic) => [topic.id, topic]))
  return SHIPPED_CATALOG_TOPIC_IDS.map((id) => {
    const topic = byId.get(id)
    if (!topic) {
      throw new Error(`Shipped catalog manifest lists "${id}", which the seed does not define.`)
    }
    return topic
  })
}

export function catalogDefinition(id: string): Topic | null {
  if (!isShippedCatalogId(id)) return null
  return catalogDefinitions().find((topic) => topic.id === id) ?? null
}

/**
 * A shipped topic as it should first appear in an existing library: the
 * catalog's content, and nothing that could be mistaken for learner evidence.
 */
export function freshCatalogTopic(definition: Topic, now: Date = new Date()): Topic {
  // Learner-state fields are stripped and then restated, rather than inherited.
  // A catalog definition carries none of them today; if one ever did, delivery
  // must not hand it over as progress this learner earned.
  const { lessonSitting: _sitting, acquisitionReadyAt: _ready, ...content } = definition
  return {
    ...content,
    origin: 'catalog',
    status: 'unstarted',
    createdAt: now.toISOString(),
    drilledAt: null,
    learningAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
    itemEvidence: {},
    lessonProgress: {},
  }
}

/**
 * A topic's scored identity as a single comparable string. JSON rather than a
 * delimiter, so no prompt or answer text can forge a boundary between fields.
 */
function scoredIdentity(items: Topic['items']): string {
  return JSON.stringify(
    items.map((item) => {
      const identified = item as Partial<IdentifiedItem>
      return [identified.id ?? '', identified.kind ?? '', item.prompt, item.answer]
    }),
  )
}

/**
 * Provenance for a topic that predates durable `origin`. A topic counts as
 * catalog-owned only when its scored identity is still exactly what the catalog
 * ships. Anything edited, or authored under a colliding id, is treated as the
 * learner's. That is the conservative answer, because ownership can only ever
 * widen what reconciliation is permitted to do.
 */
export function inferredOrigin(topic: Topic): NonNullable<Topic['origin']> {
  const definition = catalogDefinition(topic.id)
  if (!definition) return 'user'
  return scoredIdentity(topic.items) === scoredIdentity(definition.items) ? 'catalog' : 'user'
}

export function topicOrigin(topic: Topic): NonNullable<Topic['origin']> {
  return topic.origin ?? inferredOrigin(topic)
}

export type WithheldReason =
  /** A local topic the learner owns holds this id. Never overwritten. */
  | 'user-authored-collision'
  /** Already delivered once and since removed. Deletion is durable. */
  | 'previously-delivered'

export interface CatalogReconciliation {
  /** Catalog ids added to the library as fresh unstarted topics. */
  added: string[]
  /** Catalog ids already present and owned by the catalog. */
  present: string[]
  /** Catalog ids deliberately not delivered, with the reason. */
  withheld: { id: string; reason: WithheldReason }[]
}

export const NO_RECONCILIATION: CatalogReconciliation = { added: [], present: [], withheld: [] }

export function collisions(report: CatalogReconciliation): string[] {
  return report.withheld
    .filter((entry) => entry.reason === 'user-authored-collision')
    .map((entry) => entry.id)
}

/**
 * Deliver shipped catalog topics that an existing library has never been
 * offered.
 *
 * This is a delivery mechanism, not a replacement policy. It only ever appends.
 * A topic that already exists locally is left exactly as it is, whoever owns
 * it, so no status, timestamp, attempt, item id or cue-evidence record can be
 * changed by the catalog growing. Changing the meaning of a topic that has
 * already shipped therefore remains an explicit migration decision, of which
 * `absorbSeededMorseBaseline` is the one Argus has made.
 *
 * Deterministic: the same library and `now` always produce the same result, and
 * running it a second time changes nothing.
 */
export function reconcileCatalog(
  library: CurrentLibrary,
  now: Date = new Date(),
): { library: CurrentLibrary; report: CatalogReconciliation } {
  const byId = new Map(library.topics.map((topic) => [topic.id, topic]))
  // An absent list means a record written before delivery was tracked. Infer it
  // from what the library already holds, so an upgrade never re-delivers a
  // topic the learner has had all along. An empty list is a real, different
  // answer and is honoured as written.
  const delivered = new Set(
    library.catalogDelivered ??
      library.topics
        .filter((topic) => isShippedCatalogId(topic.id) && topicOrigin(topic) === 'catalog')
        .map((topic) => topic.id),
  )

  const report: CatalogReconciliation = { added: [], present: [], withheld: [] }
  const additions: Topic[] = []

  for (const definition of catalogDefinitions()) {
    const local = byId.get(definition.id)
    if (local) {
      if (topicOrigin(local) === 'catalog') {
        report.present.push(definition.id)
        delivered.add(definition.id)
      } else {
        // The learner owns this id. Withhold the shipped topic rather than
        // replace their work, and keep reporting it: silently dropping the
        // catalog topic would hide a real conflict.
        report.withheld.push({ id: definition.id, reason: 'user-authored-collision' })
      }
      continue
    }

    if (delivered.has(definition.id)) {
      report.withheld.push({ id: definition.id, reason: 'previously-delivered' })
      continue
    }

    additions.push(freshCatalogTopic(definition, now))
    report.added.push(definition.id)
    delivered.add(definition.id)
  }

  // Sorted so the record is deterministic, and inclusive of ids the current
  // manifest no longer lists: a delivery that happened stays recorded.
  const catalogDelivered = [...delivered].sort()
  const listUnchanged =
    library.catalogDelivered !== undefined &&
    library.catalogDelivered.length === catalogDelivered.length &&
    library.catalogDelivered.every((id, index) => id === catalogDelivered[index])

  if (additions.length === 0 && listUnchanged) return { library, report }

  return {
    library: { ...library, topics: [...library.topics, ...additions], catalogDelivered },
    report,
  }
}
