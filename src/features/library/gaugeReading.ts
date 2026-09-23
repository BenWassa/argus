import type { TopicJourney } from '../../domain/study/journey'
import type { Topic } from '../../domain/library/topic'

/**
 * Which progress reading a topic is entitled to show, and in what units.
 *
 * `journeyFor` already computes four independent progress ratios — acquisition
 * settlement, formal evidence coverage, the retention gap and the lesson
 * sitting — and until now the interface rendered essentially none of them. The
 * Library row carried a three-pixel `aria-hidden` sliver of the third, and the
 * topic page, which is the page *about one topic*, carried no progress at all.
 * Nothing here computes a new measure. It chooses which existing one is the
 * true thing to say and hands over its units.
 *
 * ## Why this is a precedence list rather than a percentage
 *
 * The readings are not interchangeable and must never be averaged into a single
 * "mastery" number. They answer different questions, they become meaningful at
 * different times, and a topic that has not reached a given stage has no
 * honest value for that stage's measure. So exactly one is shown, the most
 * specific one the topic has actually earned, and it is labelled in its own
 * units — the instrument rule the rest of the product already follows.
 *
 * ## The reading that must not be shown
 *
 * `evidence.covered` counts items carrying complete directional evidence, which
 * requires both a durable item id and recorded per-item cue evidence. An
 * ordinary reveal-and-grade topic has neither: its items may carry no id at all
 * and its checks write no per-item evidence by design. Reading `covered/total`
 * for one of those returns `0 / 26` forever, no matter how thoroughly it has
 * been drilled or how long it has been banked. That is not a quiet
 * imprecision, it is the gauge contradicting the status line beside it, so
 * `keepsItemEvidence` gates that branch and such a topic falls through to the
 * gap — which for it is a true statement about a real clock.
 */
export type GaugeReading =
  /** Nothing truthful to measure: no items, still being authored. */
  | { kind: 'none' }
  /** Banked. A settled fact, not a quantity in motion. */
  | { kind: 'complete' }
  /** A multi-sitting curriculum still introducing its roster. */
  | { kind: 'acquisition'; done: number; total: number }
  /** Independent evidence in every direction the content requires. */
  | { kind: 'evidence'; done: number; total: number }
  /** Evidence is in; the required retention gap is elapsing. */
  | { kind: 'gap'; progress: number; waitDays: number }

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

  // Completion outranks every measure of work in progress. A banked topic that
  // has since decayed is deliberately not caught here: it is back in motion,
  // and its live reading is the truthful one to show.
  if (journey.retention.status === 'completed') return { kind: 'complete' }

  const { acquisition, evidence, retention } = journey

  // Acquisition first, because while it is running it is the only thing the
  // learner can act on — the retention ladder is gated behind it anyway.
  if (acquisition.progressive && !acquisition.ready && acquisition.total > 0) {
    return { kind: 'acquisition', done: acquisition.settled, total: acquisition.total }
  }

  if (keepsItemEvidence(topic) && evidence.total > 0 && !evidence.complete) {
    return { kind: 'evidence', done: evidence.covered, total: evidence.total }
  }

  // `gated` means acquisition is still holding retention back, so the gap has
  // not started and its progress would describe a clock that is not running.
  if (!retention.gated && retention.gapProgress !== null) {
    return { kind: 'gap', progress: retention.gapProgress, waitDays: retention.waitDays }
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
      return 'Banked'
    case 'acquisition':
      return `${reading.done} of ${reading.total} letters settled`
    case 'evidence':
      return `${reading.done} of ${reading.total} recalled both ways`
    case 'gap':
      return reading.waitDays > 0
        ? `${reading.waitDays} ${reading.waitDays === 1 ? 'day' : 'days'} of the gap to go`
        : 'Gap served'
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
    case 'gap':
      return Math.min(1, Math.max(0, reading.progress))
  }
}
