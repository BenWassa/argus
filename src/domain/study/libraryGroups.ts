import type { Topic } from '../library/topic'
import type { JourneyEntry } from './journey'

/**
 * How Library lays out the learner's topics: what they have started, most
 * recent first, then everything else alphabetically — except that a topic in a
 * sequence shelves under its sequence's first topic, in sequence order.
 *
 * Library used to shelve by what the schedule was asking for (`Due now`,
 * `Waiting`) and filter by track. Both answered questions Today already
 * answers, and the tracks read as a taxonomy to learn rather than a way to find
 * anything. The one distinction a library of finite topics needs is whether
 * you are in it yet.
 */
export interface LibraryGroups {
  /** Every topic the learner has begun, whatever state it is in now. */
  learning: JourneyEntry[]
  /** Topics nobody has started, by title, with each sequence kept together. */
  rest: JourneyEntry[]
}

/**
 * Begun means any durable sign of the learner: a status past `unstarted`, a
 * scored attempt, or a Morse lesson sitting that has settled a letter. Browsing
 * a topic writes none of these, so it never moves a topic into this group.
 */
export function hasStarted(entry: JourneyEntry): boolean {
  const { topic, journey } = entry
  return topic.status !== 'unstarted' || topic.history.length > 0 || journey.acquisition.started
}

/**
 * The latest moment this topic records the learner doing anything.
 *
 * Read from timestamps the record already keeps, not a new field. Morse lesson
 * sittings are counted rather than timestamped (`morseReview`), so for Morse
 * this reads the last test, the per-item evidence and the enrollment and
 * readiness dates — the nearest honest reading the record allows.
 */
export function lastActivityAt(topic: Topic): number {
  const stamps: (string | null | undefined)[] = [
    topic.learningAt,
    topic.drilledAt,
    topic.completedAt,
    topic.lastTestedAt,
    topic.spotCheckedAt,
    topic.acquisitionReadyAt,
    ...topic.history.map((attempt) => attempt.at),
  ]
  for (const item of Object.values(topic.itemEvidence ?? {})) {
    for (const direction of Object.values(item.directions)) stamps.push(direction?.lastAt)
  }

  let latest = 0
  for (const stamp of stamps) {
    if (!stamp) continue
    const time = Date.parse(stamp)
    if (Number.isFinite(time) && time > latest) latest = time
  }
  return latest
}

const byTitle = (a: JourneyEntry, b: JourneyEntry) =>
  a.topic.title.localeCompare(b.topic.title, undefined, { sensitivity: 'base' })

/**
 * Shipped topics that are steps of one programme, in learning order. Sorted by
 * title alone, Compass Bearings and its four follow-ons scatter across C, G, R,
 * T and W, and nothing shows which comes first. A missing id is skipped, so a
 * sequence can name a topic that has not shipped yet.
 */
export const TOPIC_SEQUENCES: readonly (readonly string[])[] = [
  [
    'cardinal-bearings',
    'whole-circle-bearings',
    'reciprocal-bearings',
    'north-references-declination',
    'grid-north-map-bearings',
  ],
  ['navigation-lights', 'vessel-day-shapes', 'signal-flags'],
]

const SEQUENCE_STEP = new Map(
  TOPIC_SEQUENCES.flatMap((sequence) => sequence.map((id, step) => [id, { sequence, step }] as const)),
)

/**
 * Unstarted topics by title, but a sequence step files under the title of the
 * first step present on the shelf, then by step. Learned-from topics leave the
 * shelf for the learning group, so the remaining steps still sit together.
 */
function shelfOrder(entries: JourneyEntry[]): JourneyEntry[] {
  const present = new Map(entries.map((entry) => [entry.topic.id, entry]))
  const key = (entry: JourneyEntry) => {
    const place = SEQUENCE_STEP.get(entry.topic.id)
    if (!place) return { title: entry.topic.title, step: 0 }
    const head = place.sequence.find((id) => present.has(id))!
    return { title: present.get(head)!.topic.title, step: place.step }
  }
  return [...entries].sort((a, b) => {
    const left = key(a)
    const right = key(b)
    return (
      left.title.localeCompare(right.title, undefined, { sensitivity: 'base' }) ||
      left.step - right.step ||
      byTitle(a, b)
    )
  })
}

export function libraryGroups(entries: JourneyEntry[]): LibraryGroups {
  const learning: JourneyEntry[] = []
  const rest: JourneyEntry[] = []
  for (const entry of entries) (hasStarted(entry) ? learning : rest).push(entry)

  learning.sort(
    (a, b) => lastActivityAt(b.topic) - lastActivityAt(a.topic) || byTitle(a, b),
  )
  return { learning, rest: shelfOrder(rest) }
}
