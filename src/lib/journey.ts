import { hasCompleteDirectionalCoverage, itemKind } from './items'
import { morseAcquisitionPosition } from './morseLesson'
import {
  LESSON_RETRIEVAL_TARGET,
  lessonSittingIsFresh,
  lessonSittingOf,
} from './morseLessonSitting'
import { DUE_RANK, dueState, gapProgress } from './scheduling'
import type { Mode, Status, Topic } from './types'

/**
 * The shared learner journey (#62/#67).
 *
 * Argus carries several forms of learner state that answer genuinely different
 * questions, and #62 is emphatic that they must stay apart:
 *
 * ```text
 * acquisition   can I retrieve this without the teaching support I am using?
 * evidence      have I demonstrated the directions the scored boundary requires?
 * retention     has demonstrated recall survived the required gap?
 * sitting       where am I in the finite task I am doing right now?
 * ```
 *
 * What was missing was not another state variable. It was one *interpretation*
 * of the four, so the product can answer the only question the learner actually
 * asks — what should I do next, and why — with the same answer on every surface.
 * Today, Library, Topic and Progress previously each read raw fields and reached
 * their own conclusion, which is how the same Morse topic could say "Continue
 * lesson" on one screen and "Test" on another at the same instant.
 *
 * This module is that interpretation, and it is deliberately:
 *
 * - **pure** — `(topic, now) => TopicJourney`, no storage, no writes, no clock of
 *   its own, so a surface cannot get a different answer than a test does;
 * - **derived** — it holds nothing. Every value here is computed from durable
 *   fields owned by somebody else. There is no fifth progress database;
 * - **not a second scheduler** — `scheduling.ts` remains the retention
 *   authority. This layer decides *eligibility* and wording, and asks the
 *   scheduler for the rest.
 *
 * ## The one thing it adds: progressive acquisition
 *
 * The pre-Morse model assumed Learn was a single exposure, so `modeFor` could
 * treat `unstarted` as Learn and everything else as Test. Morse acquisition runs
 * for many sittings across many days while the status has been `learning` since
 * the first one, so that rule routed a learner who had met eight letters into a
 * 26-item scored Test and called it the required action.
 *
 * A progressive topic therefore has an explicit readiness boundary, and until it
 * is reached the topic is `acquiring`: every surface says Continue Learn, and a
 * Test result cannot advance the retention ladder (`advancementEligible`).
 *
 * ## Two deliberate limits on the gate
 *
 * The gate applies only while the topic is `unstarted` or `learning`. A topic
 * that has genuinely reached `drilled`, `completed` or `decayed` has retention
 * evidence, and retention evidence outranks lesson scaffolding: an existing
 * learner who drilled printed Morse before the guided lesson shipped is not sent
 * back to packet 1, and a later lesson miss cannot drag a completed topic
 * backwards.
 *
 * And readiness is permanent once reached, like `completedAt`. A miss in a later
 * lesson legitimately restores that letter's support, which is a fact about what
 * the lesson will scaffold next — not a retraction of having produced all 26
 * unaided.
 */

/** What the learner should do with this topic now. */
export type TopicAction = 'author' | 'learn' | 'test'

export interface AcquisitionView {
  /** True for a topic with a multi-sitting acquisition programme. Morse today. */
  progressive: boolean
  /** True once the learner has met any of the programme. */
  started: boolean
  /** True once acquisition has reached its endpoint, permanently. */
  ready: boolean
  /** Roster characters the lesson has stopped scaffolding. */
  settled: number
  total: number
  /** 1-based packet position within the programme. */
  packet: number
  packetCount: number
  /** When readiness was first reached. Null when not yet, or not recorded. */
  readyAt: string | null
}

export interface FormalEvidenceView {
  /** True when the topic's content requires evidence in both directions. */
  bidirectional: boolean
  /** Logical units holding independent correct evidence in every direction. */
  covered: number
  total: number
  complete: boolean
}

export interface RetentionView {
  status: Status
  /** The scheduler's own words, or the progressive wording where it differs. */
  label: string
  due: boolean
  waitDays: number
  gapProgress: number | null
  /** The timestamp the current gap is measured from, after readiness anchoring. */
  anchorAt: string | null
  /** True while progressive acquisition is holding retention back. */
  gated: boolean
}

export interface SittingView {
  retrievals: number
  target: number
  correct: number
  /** Distinct letters this sitting has already missed once. */
  revisit: number
  /** True when the sitting has recorded something to come back to. */
  active: boolean
  listeningSuppressed: boolean
}

export type JourneyPhase = 'authoring' | 'acquiring' | 'due' | 'waiting' | 'repair'

export interface TopicJourney {
  topicId: string
  phase: JourneyPhase
  acquisition: AcquisitionView
  evidence: FormalEvidenceView
  retention: RetentionView
  /** Present only for a topic with a finite Learn sitting. */
  sitting: SittingView | null
  action: TopicAction
  /** The verb on a row or button: `Learn`, `Continue Learn`, `Test`, `Add items`. */
  actionLabel: string
  /** The fuller name of the same action, for the Topic page's primary control. */
  primaryLabel: string
  /** Why the topic is where it is. The schedule/state line. */
  statusLabel: string
  /** One concise supporting line, or null when the status line says it all. */
  detail: string | null
  due: boolean
  waitDays: number
  /** Whether a scored attempt may move this topic along the retention ladder. */
  advancementEligible: boolean
}

const NOT_PROGRESSIVE: AcquisitionView = {
  progressive: false,
  started: false,
  ready: false,
  settled: 0,
  total: 0,
  packet: 0,
  packetCount: 0,
  readyAt: null,
}

function days(n: number): string {
  return `${n} ${n === 1 ? 'day' : 'days'}`
}

function acquisitionView(topic: Topic): AcquisitionView {
  const position = morseAcquisitionPosition(topic)
  if (!position) return NOT_PROGRESSIVE
  return {
    progressive: true,
    started: position.started,
    // Readiness is permanent once recorded. See the module comment.
    ready: position.ready || Boolean(topic.acquisitionReadyAt),
    settled: position.settled,
    total: position.total,
    packet: position.packet,
    packetCount: position.packetCount,
    readyAt: topic.acquisitionReadyAt ?? null,
  }
}

function evidenceView(topic: Topic): FormalEvidenceView {
  const bidirectional = topic.items.some((item) => itemKind(item) === 'bidirectional')
  const covered = topic.items.filter(
    (item) => !!item.id && hasCompleteDirectionalCoverage(item, topic.itemEvidence?.[item.id]),
  ).length
  return {
    bidirectional,
    covered,
    total: topic.items.length,
    complete: topic.items.length > 0 && covered === topic.items.length,
  }
}

function sittingView(topic: Topic, acquisition: AcquisitionView): SittingView | null {
  if (!acquisition.progressive) return null
  const sitting = lessonSittingOf(topic)
  return {
    retrievals: sitting.retrievals,
    target: LESSON_RETRIEVAL_TARGET,
    correct: sitting.correct,
    revisit: sitting.revisitItemIds.length,
    active: !lessonSittingIsFresh(sitting),
    listeningSuppressed: Boolean(sitting.listeningSuppressed),
  }
}

/**
 * The timestamp the qualifying `learning → drilled` gap is measured from.
 *
 * For an ordinary topic that is first exposure, exactly as it has always been.
 *
 * For a progressive topic it is the moment acquisition became ready, which is
 * the whole point of #62's clock policy: a programme that runs for six weeks
 * must not arrive at its first scored Test having "waited" five weeks and six
 * days of that on a clock started while the learner was still on packet 1.
 *
 * A topic whose acquisition is complete but which carries no `acquisitionReadyAt`
 * was written before the field existed. It falls back to `learningAt`, which is
 * the pre-#62 behaviour: never stricter than what that learner already had.
 */
export function retentionAnchor(topic: Topic, acquisition: AcquisitionView): string | null {
  if (!acquisition.progressive) return topic.learningAt
  if (!acquisition.ready) return null
  return topic.acquisitionReadyAt ?? topic.learningAt
}

/**
 * The topic as the retention scheduler should read it.
 *
 * Only `learningAt` can differ, and only for a progressive topic. Handing the
 * scheduler an anchored copy keeps it the single implementation of every gap,
 * threshold and label rather than reimplementing `dueState` with one branch
 * changed.
 */
function retentionTopic(topic: Topic, acquisition: AcquisitionView): Topic {
  const anchor = retentionAnchor(topic, acquisition)
  return anchor === topic.learningAt ? topic : { ...topic, learningAt: anchor }
}

export function journeyFor(topic: Topic, now: Date = new Date()): TopicJourney {
  const acquisition = acquisitionView(topic)
  const evidence = evidenceView(topic)
  const sitting = sittingView(topic, acquisition)

  // Retention evidence outranks lesson scaffolding: a topic that has genuinely
  // reached `drilled` or beyond is never pulled back into acquisition.
  const gated =
    acquisition.progressive &&
    !acquisition.ready &&
    (topic.status === 'unstarted' || topic.status === 'learning')

  const scheduled = dueState(retentionTopic(topic, acquisition), now)
  const retention: RetentionView = {
    status: topic.status,
    label: scheduled.label,
    due: scheduled.due,
    waitDays: scheduled.waitDays,
    gapProgress: gapProgress(topic, now),
    anchorAt: retentionAnchor(topic, acquisition),
    gated,
  }

  if (topic.items.length === 0) {
    return {
      topicId: topic.id,
      phase: 'authoring',
      acquisition,
      evidence,
      retention: { ...retention, label: 'Needs items', due: false, waitDays: 0 },
      sitting,
      action: 'author',
      actionLabel: 'Add items',
      primaryLabel: 'Add items',
      statusLabel: 'Needs items',
      detail: 'No prompts and answers yet, so there is nothing to read or test.',
      due: false,
      waitDays: 0,
      advancementEligible: false,
    }
  }

  if (gated) {
    // Acquisition is the work. It is available now — that is what makes the
    // topic due — and it stays the recommended action on every surface until the
    // programme's own endpoint is reached.
    const parts = [
      `${acquisition.settled} of ${acquisition.total} letters settled`,
      `packet ${acquisition.packet} of ${acquisition.packetCount}`,
    ]
    if (sitting?.active) {
      parts.push(`${sitting.retrievals} of ${sitting.target} retrievals this sitting`)
    }
    return {
      topicId: topic.id,
      phase: 'acquiring',
      acquisition,
      evidence,
      retention: {
        ...retention,
        label: 'Not yet drilling',
        due: false,
        waitDays: 0,
        gapProgress: null,
      },
      sitting,
      action: 'learn',
      actionLabel: acquisition.started ? 'Continue Learn' : 'Learn',
      primaryLabel: acquisition.started ? 'Continue lesson' : 'Start lesson',
      statusLabel: acquisition.started ? 'Lesson in progress' : 'Not started',
      detail: acquisition.started
        ? parts.join(' · ')
        : `Guided lesson, packet 1 of ${acquisition.packetCount}. ${acquisition.total} letters.`,
      due: true,
      waitDays: 0,
      advancementEligible: false,
    }
  }

  if (topic.status === 'unstarted') {
    // Ordinary first exposure. Unchanged: read it, then it comes back to be
    // proved. This is the branch `modeFor` used to be the whole of.
    return {
      topicId: topic.id,
      phase: 'acquiring',
      acquisition,
      evidence,
      retention,
      sitting,
      action: 'learn',
      actionLabel: 'Learn',
      primaryLabel: 'Learn',
      statusLabel: retention.label,
      detail: null,
      due: true,
      waitDays: 0,
      advancementEligible: true,
    }
  }

  // A progressive topic waiting out its anchored learning gap is not "drilled
  // today" — nothing drilled it. Say what is actually true of it.
  const progressiveLearning = acquisition.progressive && topic.status === 'learning'
  const statusLabel = progressiveLearning
    ? scheduled.due
      ? 'Ready to test'
      : `Test in ${days(scheduled.waitDays)}`
    : scheduled.label

  const phase: JourneyPhase =
    topic.status === 'decayed' ? 'repair' : scheduled.due ? 'due' : 'waiting'

  return {
    topicId: topic.id,
    phase,
    acquisition,
    evidence,
    retention: { ...retention, label: statusLabel },
    sitting,
    action: 'test',
    actionLabel: 'Test',
    primaryLabel: 'Test',
    statusLabel,
    detail:
      acquisition.progressive && acquisition.ready
        ? `${acquisition.settled} of ${acquisition.total} letters settled in Learn`
        : null,
    due: scheduled.due,
    waitDays: scheduled.waitDays,
    advancementEligible: true,
  }
}

/** The mode the journey's recommended action launches. Authoring launches none. */
export function modeForAction(action: TopicAction): Mode | null {
  return action === 'author' ? null : action
}

export interface JourneyEntry {
  topic: Topic
  journey: TopicJourney
}

export function journeysFor(topics: Topic[], now: Date = new Date()): JourneyEntry[] {
  return topics.map((topic) => ({ topic, journey: journeyFor(topic, now) }))
}

export function journeyOf(entries: JourneyEntry[], topicId: string): TopicJourney | null {
  return entries.find((entry) => entry.topic.id === topicId)?.journey ?? null
}

/**
 * Everything that wants doing now, in the order the ladder reads it. Ranked by
 * the scheduler's own `DUE_RANK` so acquisition work sorts alongside ordinary
 * work rather than in a category of its own, and the longest untested goes first
 * within a rank — exactly as `dueTopics` has always ordered the day.
 */
export function dueEntries(entries: JourneyEntry[]): JourneyEntry[] {
  return entries
    .filter((entry) => entry.journey.due && entry.topic.items.length > 0)
    .sort((a, b) => {
      const byRank = DUE_RANK[a.topic.status] - DUE_RANK[b.topic.status]
      if (byRank !== 0) return byRank
      return (a.topic.lastTestedAt ?? '').localeCompare(b.topic.lastTestedAt ?? '')
    })
}

export type ShelfId = 'due' | 'active' | 'completed' | 'unfinished'

export interface JourneyShelf {
  id: ShelfId
  label: string
  entries: JourneyEntry[]
}

/**
 * The library ordered the way the schedule reads it. Shelf placement now follows
 * the journey rather than raw status, so the shelf a topic sits on and the verb
 * on its action button are two readings of one derivation and cannot disagree.
 */
export function journeyShelves(entries: JourneyEntry[]): JourneyShelf[] {
  const due = dueEntries(entries)
  const claimed = new Set(due.map((entry) => entry.topic.id))
  const rest = entries.filter((entry) => !claimed.has(entry.topic.id))
  const waiting = rest.filter((entry) => entry.topic.items.length > 0)

  const byTitle = (a: JourneyEntry, b: JourneyEntry) => a.topic.title.localeCompare(b.topic.title)
  const bySoonest = (a: JourneyEntry, b: JourneyEntry) =>
    a.journey.waitDays - b.journey.waitDays || byTitle(a, b)

  const all: JourneyShelf[] = [
    { id: 'due', label: 'Due now', entries: due },
    {
      id: 'active',
      label: 'In progress',
      entries: waiting.filter((entry) => entry.topic.status !== 'completed').sort(bySoonest),
    },
    {
      id: 'completed',
      label: 'Completed',
      entries: waiting.filter((entry) => entry.topic.status === 'completed').sort(bySoonest),
    },
    {
      id: 'unfinished',
      label: 'Needs items',
      entries: rest.filter((entry) => entry.topic.items.length === 0).sort(byTitle),
    },
  ]

  return all.filter((shelf) => shelf.entries.length > 0)
}

/**
 * Record that progressive acquisition has just become ready.
 *
 * Written by Learn, through the same functional topic update that persists the
 * lesson answer which achieved it, so the anchor and the support level that
 * earned it land together and the retention clock cannot start late.
 *
 * Set once and never cleared, for the same reason `completedAt` is never
 * cleared: reaching the acquisition boundary is a historical fact about the
 * learner, not a description of the lesson's current scaffolding.
 */
export function withAcquisitionReadiness(topic: Topic, now: Date = new Date()): Topic {
  if (topic.acquisitionReadyAt) return topic
  const position = morseAcquisitionPosition(topic)
  if (!position?.ready) return topic
  return { ...topic, acquisitionReadyAt: now.toISOString() }
}
