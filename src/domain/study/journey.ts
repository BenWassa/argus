import { curriculumFor } from '../learning/generatedCurriculum'
import { nextStage } from '../learning/stageProgress'
import { hasCompleteDirectionalCoverage, itemKind } from '../library/items'
import { morseAcquisitionPosition, owedLetters } from '../morse/curriculum/lesson'
import {
  LESSON_RETRIEVAL_TARGET,
  lessonSittingIsFresh,
  lessonSittingOf,
} from '../morse/curriculum/lessonSitting'
import { DUE_RANK, dueState, isLearned } from './scheduling'
import type { Status, Topic } from '../library/topic'

/**
 * One pure interpretation of the durable learning record for every surface.
 * Unfinished curricula continue their canonical acquisition task; ordinary
 * topics offer Test. Each required lesson once completes a curriculum; an
 * ordinary topic completes after a qualifying Test.
 * Existing evidence and lesson stores retain their own boundaries, but never
 * reopen a learned topic or create decay/repair work.
 */

/** What the learner should do with this topic now. */
export type TopicAction = 'author' | 'learn' | 'test'

/** The Topic page's primary label for a banked course. */
export const KEEP_GOING = 'Keep going'

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
  /** True once every letter has been met: the thirteen lessons have run. */
  afterCourse: boolean
  /** Letters the finished course still owes (`owedLetters`), in course order. */
  owed: string[]
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

/** `banked` is a completed topic: not in motion, and checkable at any time. */
export type JourneyPhase = 'authoring' | 'acquiring' | 'due' | 'banked'

export interface TopicJourney {
  topicId: string
  phase: JourneyPhase
  acquisition: AcquisitionView
  evidence: FormalEvidenceView
  retention: RetentionView
  /** Present only for a topic with a finite Learn sitting. */
  sitting: SittingView | null
  action: TopicAction
  /**
   * The verb on a row or button: `Start`, `Continue`, `Test`, `Add items`.
   *
   * Ordinary topics offer Test directly. Opening their content writes no
   * progress; progressive curricula keep their canonical `learn` action.
   */
  actionLabel: string
  /** The fuller name of the same action, for the Topic page's primary control. */
  primaryLabel: string
  /** Why the topic is where it is. The schedule/state line. */
  statusLabel: string
  /** One concise supporting line, or null when the status line says it all. */
  detail: string | null
  due: boolean
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
  afterCourse: false,
  owed: [],
}

function acquisitionView(topic: Topic): AcquisitionView {
  const position = morseAcquisitionPosition(topic)
  if (!position) return NOT_PROGRESSIVE
  return {
    progressive: true,
    started: position.started,
    // Readiness is permanent once recorded. See the module comment.
    ready: isLearned(topic) || position.ready || Boolean(topic.acquisitionReadyAt),
    settled: isLearned(topic) ? position.total : position.settled,
    total: position.total,
    packet: position.packet,
    packetCount: position.packetCount,
    readyAt: topic.acquisitionReadyAt ?? null,
    afterCourse: position.metAll,
    owed: !isLearned(topic) && position.metAll ? owedLetters(topic) : [],
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

export function journeyFor(topic: Topic): TopicJourney {
  const acquisition = acquisitionView(topic)
  const evidence = evidenceView(topic)
  const sitting = sittingView(topic, acquisition)

  // Retention evidence outranks lesson scaffolding: a topic that has genuinely
  // reached `drilled` or beyond is never pulled back into acquisition.
  const gated =
    !isLearned(topic) && acquisition.progressive &&
    !acquisition.ready &&
    (topic.status === 'unstarted' || topic.status === 'learning')

  const scheduled = dueState(topic)
  const retention: RetentionView = {
    status: isLearned(topic) ? 'completed' : topic.status,
    label: scheduled.label,
    due: scheduled.due,
    gated,
  }

  if (topic.items.length === 0) {
    return {
      topicId: topic.id,
      phase: 'authoring',
      acquisition,
      evidence,
      retention: { ...retention, label: 'Needs items', due: false },
      sitting,
      action: 'author',
      actionLabel: 'Add items',
      primaryLabel: 'Add items',
      statusLabel: 'Needs items',
      detail: 'No prompts and answers yet, so there is nothing to read or test.',
      due: false,
      advancementEligible: false,
    }
  }


  const curriculum = curriculumFor(topic)
  if (curriculum && !isLearned(topic)) {
    const next = nextStage(topic, curriculum)
    const position = next ? curriculum.stages.indexOf(next) + 1 : curriculum.stages.length
    const started = Object.keys(topic.stageProgress ?? {}).length > 0 || topic.history.length > 0
    return {
      topicId: topic.id, phase: 'acquiring', acquisition, evidence, retention, sitting,
      action: next ? 'learn' : 'test', actionLabel: next ? started ? 'Continue' : 'Start' : 'Final Test',
      primaryLabel: next ? started ? 'Continue' : 'Start' : 'Final Test',
      statusLabel: `Lesson ${position} of ${curriculum.stages.length}`, detail: null,
      due: true, advancementEligible: true,
    }
  }


  if (gated) {
    // Acquisition is the work. It is available now — that is what makes the
    // topic due — and it stays the recommended action on every surface until the
    // programme's own endpoint is reached.
    const parts = [
      `${acquisition.settled} of ${acquisition.total} letters`,
      `lesson ${acquisition.packet} of ${acquisition.packetCount}`,
    ]
    if (sitting?.active) {
      parts.push(`${sitting.retrievals} retrievals this sitting`)
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
      },
      sitting,
      action: 'learn',
      actionLabel: acquisition.started ? 'Continue' : 'Start lesson',
      primaryLabel: `${acquisition.started ? 'Continue' : 'Start'} lesson ${acquisition.packet}`,
      statusLabel: acquisition.started ? 'Lesson in progress' : 'Not started',
      detail: acquisition.started
        ? parts.join(' · ')
        : `Guided lesson, ${acquisition.packetCount} lessons, ${acquisition.total} letters.`,
      due: true,
      advancementEligible: false,
    }
  }


  const statusLabel = scheduled.label

  const phase: JourneyPhase =
    scheduled.due ? 'due' : 'banked'

  // Once a course is banked, the fuller recommendation is to keep learning past
  // it — Copy, from letters up to sentences. The action stays `test`: a banked
  // course can be checked whenever the learner chooses, and the topic page
  // offers that check beside a short unscored review.
  const keepGoing = acquisition.progressive && acquisition.ready && phase === 'banked'

  return {
    topicId: topic.id,
    phase,
    acquisition,
    evidence,
    retention: { ...retention, label: statusLabel },
    sitting,
    action: 'test',
    actionLabel: 'Test',
    primaryLabel: keepGoing ? KEEP_GOING : phase === 'banked' ? 'Test again' : 'Test',
    statusLabel,
    detail:
      acquisition.progressive && acquisition.ready
        ? `${acquisition.settled} of ${acquisition.total} letters`
        : null,
    due: scheduled.due,
    advancementEligible: true,
  }
}

export interface JourneyEntry {
  topic: Topic
  journey: TopicJourney
}

export function journeysFor(topics: Topic[]): JourneyEntry[] {
  return topics.map((topic) => ({ topic, journey: journeyFor(topic) }))
}

/**
 * Everything that wants doing now, in the order the ladder reads it. Ranked by
 * the scheduler's own `DUE_RANK` so acquisition work sorts alongside ordinary
 * work rather than in a category of its own, and the longest untested goes first
 * within a rank — the order the day has always been read in, now with only one
 * implementation of it.
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

/** Shown wherever a Test action is offered, so Today and Library never drift
 *  into stating this consequence two different ways. */
export const TEST_CONSEQUENCE_NOTE =
  'Lessons build recall. Finish every lesson or a clean Final Test to complete a topic. Later Tests are optional.'

export type ShelfId = 'due' | 'banked' | 'unfinished'

export interface JourneyShelf {
  id: ShelfId
  label: string
  entries: JourneyEntry[]
}

/** Unfinished learning, learned topics and empty drafts, derived consistently. */
export function journeyShelves(entries: JourneyEntry[]): JourneyShelf[] {
  const due = dueEntries(entries)
  const claimed = new Set(due.map((entry) => entry.topic.id))
  const rest = entries.filter((entry) => !claimed.has(entry.topic.id))
  const banked = rest.filter((entry) => entry.topic.items.length > 0)

  const byTitle = (a: JourneyEntry, b: JourneyEntry) => a.topic.title.localeCompare(b.topic.title)

  const all: JourneyShelf[] = [
    { id: 'due', label: 'Due now', entries: due },
    { id: 'banked', label: 'Learned', entries: banked.sort(byTitle) },
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
 * earned it land together.
 *
 * Set once and never cleared, for the same reason `completedAt` is never
 * cleared: reaching the acquisition boundary is a historical fact about the
 * learner, not a description of the lesson's current scaffolding.
 */
export function withAcquisitionReadiness(topic: Topic, now: Date = new Date()): Topic {
  const position = morseAcquisitionPosition(topic)
  if (!position?.ready) return topic

  // A legacy readiness date is authoritative. For older all-settled records
  // without the date, normalize on the next actual write; never add Test data.
  const readyAt = topic.acquisitionReadyAt ?? now.toISOString()
  const completedAt = topic.completedAt ?? readyAt
  if (topic.status === 'completed' &&
      topic.acquisitionReadyAt === readyAt && topic.completedAt === completedAt) return topic
  return { ...topic, acquisitionReadyAt: readyAt, completedAt, status: 'completed' }
}
