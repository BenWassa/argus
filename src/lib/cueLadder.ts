import { requiredDirections } from './items'
import type {
  CueState,
  DirectionEvidence,
  Item,
  ItemCueEvidence,
  ItemDirection,
  ItemEvidenceStore,
  Topic,
} from './types'

/**
 * The acquisition ladder (D3, ratified).
 *
 * Stages A and B are the richest *cue rungs inside Test*. Learn keeps its job —
 * ungraded first exposure — and the scheduler is not taught anything about
 * unfinished acquisition. `src/lib/scheduling.ts` is out of scope for this
 * workstream and is not imported here.
 *
 * The governing invariant from the programme plan:
 *
 *   retention state: learning / drilled / completed / decayed  (scheduler owns)
 *   cue state:       rich / reduced / delayed-choice / free    (acquisition owns)
 *
 * Nothing in this module reads or writes status, history or any retention
 * timestamp. Cue progression can *use* recall evidence; it can never qualify,
 * skip or reset a retention gap.
 */

export const RESPONSE_MODES = ['choice', 'production', 'entry'] as const
export type ResponseMode = (typeof RESPONSE_MODES)[number]

/** How much of the answer a rung discloses as scaffolding. */
export type RevealPolicy = 'half' | 'first' | 'none'

export interface CueRung {
  id: string
  /** The durable cue state this rung is stored as. */
  cue: CueState
  /** Which way round the item is asked at this rung. */
  direction: ItemDirection
  response: ResponseMode
  /**
   * Milliseconds the prompt stands alone before alternatives become available.
   * Per van den Broek et al. (2023) this creates a retrieval opportunity before
   * recognition support arrives. Tuned for a phone rather than copied from the
   * published figure.
   */
  choiceDelayMs: number
  revealPolicy: RevealPolicy
  /** Whether the cue panel may state how many elements the answer has. */
  showsLength: boolean
  /** Whether cue-bearing artwork may be shown at this rung at all. */
  allowsArtwork: boolean
  label: string
  instruction: string
}

/**
 * Five rungs, richest first. Rungs 4 and 5 are uncued: they carry no artwork,
 * no length hint and no revealed prefix, which is asserted mechanically rather
 * than by inspection.
 */
export const CUE_RUNGS: readonly CueRung[] = [
  {
    id: 'rich-recognition',
    cue: 'rich',
    direction: 'prompt-to-answer',
    response: 'choice',
    choiceDelayMs: 0,
    revealPolicy: 'half',
    showsLength: true,
    allowsArtwork: true,
    label: 'Prompted recognition',
    instruction: 'Choose the pattern. The opening of it is shown.',
  },
  {
    id: 'delayed-recognition',
    cue: 'delayed-choice',
    direction: 'prompt-to-answer',
    response: 'choice',
    choiceDelayMs: 1500,
    revealPolicy: 'first',
    showsLength: true,
    allowsArtwork: true,
    label: 'Delayed choice',
    instruction: 'Recall it first. The alternatives arrive in a moment.',
  },
  {
    id: 'reduced-recognition',
    cue: 'reduced',
    direction: 'prompt-to-answer',
    response: 'choice',
    choiceDelayMs: 1500,
    revealPolicy: 'none',
    showsLength: true,
    allowsArtwork: false,
    label: 'Reduced cue',
    instruction: 'Recall it first. Only the length is given.',
  },
  {
    id: 'free-production',
    cue: 'free',
    direction: 'prompt-to-answer',
    response: 'production',
    choiceDelayMs: 0,
    revealPolicy: 'none',
    showsLength: false,
    allowsArtwork: false,
    label: 'Free production',
    instruction: 'Key the pattern yourself.',
  },
  {
    id: 'free-reception',
    cue: 'free',
    direction: 'answer-to-prompt',
    response: 'entry',
    choiceDelayMs: 0,
    revealPolicy: 'none',
    showsLength: false,
    allowsArtwork: false,
    label: 'Free reception',
    instruction: 'Read the pattern and name the character.',
  },
] as const

export const RICH_RUNG = 0
export const FREE_PRODUCTION_RUNG = 3
export const FREE_RECEPTION_RUNG = 4

/** The rungs at which no cue of any kind may reach the learner. */
export const UNCUED_RUNGS = CUE_RUNGS.filter(
  (rung) => !rung.allowsArtwork && rung.revealPolicy === 'none' && !rung.showsLength,
)

/**
 * P3 — fade on N consecutive correct answers at a rung, accuracy-primary,
 * starting at N = 2. Latency is recorded from the first session and gates
 * nothing: per PRD §11.2 it must not quietly become a completion requirement
 * for a topic whose scope says nothing about speed.
 */
export const CUE_FADE_STREAK = 2

export const EMPTY_DIRECTION_EVIDENCE: DirectionEvidence = {
  attempts: 0,
  correct: 0,
  consecutiveCorrect: 0,
  lastAt: null,
  lastLatencyMs: null,
}

export function emptyCueEvidence(): ItemCueEvidence {
  return { cue: 'rich', directions: {} }
}

export function directionEvidence(
  evidence: ItemCueEvidence | undefined,
  direction: ItemDirection,
): DirectionEvidence {
  return evidence?.directions[direction] ?? EMPTY_DIRECTION_EVIDENCE
}

/** Cue states in ladder order. `auditory` belongs to workstream 6, not here. */
const CUE_ORDER: CueState[] = ['rich', 'delayed-choice', 'reduced', 'free']

function cueRungBase(cue: CueState): number {
  const at = CUE_ORDER.indexOf(cue)
  // An `auditory` cue can only arrive from a future workstream's data. Clamp to
  // the hardest rung this version implements rather than inventing behaviour.
  return at === -1 ? CUE_ORDER.length - 1 : at
}

/**
 * Which rung an item is currently on.
 *
 * Cue state alone cannot distinguish free production from free reception —
 * both are stored as `free` — so the direction is derived from evidence:
 * production comes first, and reception opens only once production has held a
 * full fade streak, and only for an item whose content semantics actually
 * require the reverse direction. A forward item therefore tops out at free
 * production, which is what its declared coverage claims.
 */
export function rungIndexFor(item: Item, evidence: ItemCueEvidence | undefined): number {
  const base = cueRungBase(evidence?.cue ?? 'rich')
  if (base < FREE_PRODUCTION_RUNG) return base
  if (!requiredDirections(item).includes('answer-to-prompt')) return FREE_PRODUCTION_RUNG
  const forward = directionEvidence(evidence, 'prompt-to-answer')
  return forward.consecutiveCorrect >= CUE_FADE_STREAK ? FREE_RECEPTION_RUNG : FREE_PRODUCTION_RUNG
}

export function rungFor(item: Item, evidence: ItemCueEvidence | undefined): CueRung {
  return CUE_RUNGS[rungIndexFor(item, evidence)]
}

/** How many leading elements of the answer a rung discloses. Never all of it. */
export function revealedElementCount(rung: CueRung, answerLength: number): number {
  if (rung.revealPolicy === 'none' || answerLength <= 0) return 0
  const wanted = rung.revealPolicy === 'half' ? Math.ceil(answerLength / 2) : 1
  // A cue that reveals the whole answer is not a cue.
  return Math.max(0, Math.min(answerLength - 1, wanted))
}

export interface RecordedAnswer {
  direction: ItemDirection
  correct: boolean
  /** Recorded from the first session. Gates nothing in v1. */
  latencyMs: number | null
  at: string
}

function nextCue(cue: CueState, correct: boolean, streak: number): CueState {
  const at = cueRungBase(cue)
  if (!correct) {
    // Stronger scaffolding may return after an error. One rung, not a reset to
    // the bottom: an error is evidence about this item, not about the learner.
    return CUE_ORDER[Math.max(0, at - 1)]
  }
  if (streak < CUE_FADE_STREAK) return CUE_ORDER[at]
  return CUE_ORDER[Math.min(CUE_ORDER.length - 1, at + 1)]
}

/**
 * Fold one answer into an item's cue evidence.
 *
 * Returns cue evidence only. It cannot touch a topic's status, history or any
 * scheduler timestamp, because it never receives one.
 */
export function recordAnswer(
  evidence: ItemCueEvidence | undefined,
  answer: RecordedAnswer,
): ItemCueEvidence {
  const current = evidence ?? emptyCueEvidence()
  const before = directionEvidence(current, answer.direction)

  const updated: DirectionEvidence = {
    attempts: before.attempts + 1,
    correct: before.correct + (answer.correct ? 1 : 0),
    consecutiveCorrect: answer.correct ? before.consecutiveCorrect + 1 : 0,
    lastAt: answer.at,
    lastLatencyMs: answer.latencyMs,
  }

  const cue = nextCue(current.cue, answer.correct, updated.consecutiveCorrect)
  // The streak means "consecutive correct *at this rung*", so it resets when the
  // rung changes. At the top of the ladder the cue state cannot change, and the
  // surviving streak is what opens the reverse direction.
  const consecutiveCorrect = cue === current.cue ? updated.consecutiveCorrect : 0

  return {
    cue,
    directions: {
      ...current.directions,
      [answer.direction]: { ...updated, consecutiveCorrect },
    },
  }
}

/**
 * Apply cue evidence to a topic without touching anything else about it.
 *
 * Deliberately the only writer in this module that sees a `Topic`, and it
 * copies every other field through verbatim so that cue state and retention
 * state stay independently observable and independently settable.
 */
export function withItemEvidence(
  topic: Topic,
  itemId: string,
  evidence: ItemCueEvidence,
): Topic {
  const store: ItemEvidenceStore = { ...(topic.itemEvidence ?? {}), [itemId]: evidence }
  return { ...topic, itemEvidence: store }
}

export function mergeItemEvidence(topic: Topic, updates: ItemEvidenceStore): Topic {
  if (Object.keys(updates).length === 0) return topic
  return { ...topic, itemEvidence: { ...(topic.itemEvidence ?? {}), ...updates } }
}

export const REDUCED_RUNG = 2

/**
 * The two halves of the programme's distractor rule.
 *
 * Rothkopf (1958): during acquisition, keep highly confusable material apart.
 * Spragg (1943): once both members are learned, contrast them deliberately.
 *
 * `isInAcquisition` marks an item still on the two richest rungs, where a
 * confusable alternative would be actively harmful. `isEstablished` marks one
 * that has faded past them, and is therefore safe to *use* as a contrasting
 * alternative for something else.
 */
export function isInAcquisition(item: Item, evidence: ItemCueEvidence | undefined): boolean {
  return rungIndexFor(item, evidence) < REDUCED_RUNG
}

export function isEstablished(item: Item, evidence: ItemCueEvidence | undefined): boolean {
  return rungIndexFor(item, evidence) >= REDUCED_RUNG
}
