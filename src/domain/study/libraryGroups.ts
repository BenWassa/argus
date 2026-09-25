import type { Topic } from '../library/topic'
import type { JourneyEntry } from './journey'

/**
 * How Library lays out the learner's topics: what they have started, most
 * recent first, then everything else alphabetically.
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
  /** Topics nobody has started, by title. */
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

export function libraryGroups(entries: JourneyEntry[]): LibraryGroups {
  const learning: JourneyEntry[] = []
  const rest: JourneyEntry[] = []
  for (const entry of entries) (hasStarted(entry) ? learning : rest).push(entry)

  learning.sort(
    (a, b) => lastActivityAt(b.topic) - lastActivityAt(a.topic) || byTitle(a, b),
  )
  rest.sort(byTitle)
  return { learning, rest }
}
