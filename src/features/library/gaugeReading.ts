import type { TopicJourney } from '../../domain/study/journey'
import type { Topic } from '../../domain/library/topic'

/** A truthful finite reading: learned completion, acquisition or item evidence. */
export type GaugeReading =
  /** Nothing truthful to measure: no items, still being authored. */
  | { kind: 'none' }
  /** Banked. A settled fact, not a quantity in motion. */
  | { kind: 'complete' }
  /** A multi-sitting curriculum still introducing its roster. */
  | { kind: 'acquisition'; done: number; total: number }
  /** Independent evidence in every direction the content requires. */
  | { kind: 'evidence'; done: number; total: number }

/**
 * Whether this topic records per-item evidence at all.
 *
 * Presence of any entry is the whole test, and it is deliberately not "is this
 * a curriculum topic": what matters is whether the finer measure has anything
 * behind it, which is a fact about the record rather than about the topic's
 * kind. A topic that starts keeping evidence later starts reading in those
 * units on its own, with nothing here to update.
 */
function keepsItemEvidence(topic: Topic): boolean {
  const store = topic.itemEvidence
  return !!store && Object.keys(store).length > 0
}

export function gaugeReading(topic: Topic, journey: TopicJourney): GaugeReading {
  if (topic.items.length === 0 || journey.phase === 'authoring') return { kind: 'none' }

  // Learned progress stays full after optional later Tests.
  if (journey.retention.status === 'completed') return { kind: 'complete' }

  const { acquisition, evidence } = journey

  // Acquisition first, because while it is running it is the only thing the
  // learner can act on — the retention ladder is gated behind it anyway.
  if (acquisition.progressive && acquisition.total > 0) {
    return { kind: 'acquisition', done: acquisition.settled, total: acquisition.total }
  }

  if (keepsItemEvidence(topic) && evidence.total > 0 && !evidence.complete) {
    return { kind: 'evidence', done: evidence.covered, total: evidence.total }
  }

  return { kind: 'none' }
}

/**
 * The reading in words, for the gauge's own label and for the accessible name
 * of a row that would otherwise announce no progress at all.
 *
 * Units are always named. `18 / 26` alone invites the learner to read it as a
 * score, which is the one thing none of these measures is.
 */
export function gaugeLabel(reading: GaugeReading): string | null {
  switch (reading.kind) {
    case 'none':
      return null
    case 'complete':
      return 'Learned'
    case 'acquisition':
      return `${reading.done} of ${reading.total} letters`
    case 'evidence':
      return `${reading.done} of ${reading.total} items`
  }
}

/** How full the track reads, 0 to 1. Null where the reading has no fill. */
export function gaugeFill(reading: GaugeReading): number | null {
  switch (reading.kind) {
    case 'none':
      return null
    case 'complete':
      return 1
    case 'acquisition':
    case 'evidence':
      return reading.total > 0 ? Math.min(1, Math.max(0, reading.done / reading.total)) : null
  }
}
