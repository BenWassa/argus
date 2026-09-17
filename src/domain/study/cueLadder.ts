import { requiredDirections } from '../library/items'
import type { Item, Topic } from '../library/topic'
import type {
  CueState,
  DirectionEvidence,
  ItemCueEvidence,
  ItemDirection,
  ItemEvidenceStore,
} from './evidence'

/**
 * The acquisition ladder.
 *
 * Learn owns full first exposure. Test then fades support while keeping the
 * response mechanism stable: whenever the prompt is a printed letter and the
 * answer is Morse, the learner keys the pattern. The support rung changes only
 * what scaffolding is visible. Reverse printed recall remains typed character
 * entry. Scheduler/retention semantics stay completely separate.
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
  /** Retained for schema compatibility; current printed-Morse rungs do not delay choices. */
  choiceDelayMs: number
  revealPolicy: RevealPolicy
  /** Whether the cue panel may state how many elements the answer has. */
  showsLength: boolean
  /** Whether the secondary timing SVG may be shown at this rung. */
  allowsArtwork: boolean
  /** Whether a reduced fragment of the verbal mnemonic may be shown. */
  allowsVerbalCue: boolean
  /** Whether user-triggered canonical Morse playback may be offered. */
  allowsAudio: boolean
  label: string
  instruction: string
}

/**
 * Five rungs, richest first. The first four all require Morse production from a
 * printed letter; only their support differs. Canonical playback is deliberately
 * absent from these live visual-recall prompts (#52/#56) because it would reveal
 * the answer. The fifth rung reverses direction and takes a typed letter.
 */
export const CUE_RUNGS: readonly CueRung[] = [
  {
    id: 'rich-recognition',
    cue: 'rich',
    direction: 'prompt-to-answer',
    response: 'production',
    choiceDelayMs: 0,
    revealPolicy: 'half',
    showsLength: true,
    allowsArtwork: true,
    allowsVerbalCue: true,
    allowsAudio: false,
    label: 'Rhythm support',
    instruction: 'Key the pattern. The opening phrase and timing trace are shown.',
  },
  {
    id: 'delayed-recognition',
    cue: 'delayed-choice',
    direction: 'prompt-to-answer',
    response: 'production',
    choiceDelayMs: 0,
    revealPolicy: 'first',
    showsLength: true,
    allowsArtwork: true,
    allowsVerbalCue: true,
    allowsAudio: false,
    label: 'Reduced rhythm',
    instruction: 'Key the pattern. One opening beat remains.',
  },
  {
    id: 'reduced-recognition',
    cue: 'reduced',
    direction: 'prompt-to-answer',
    response: 'production',
    choiceDelayMs: 0,
    revealPolicy: 'none',
    showsLength: true,
    allowsArtwork: false,
    allowsVerbalCue: false,
    allowsAudio: false,
    label: 'Element count',
    instruction: 'Key the pattern. Only its element count remains.',
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
    allowsVerbalCue: false,
    allowsAudio: false,
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
    allowsVerbalCue: false,
    allowsAudio: false,
    label: 'Free reception',
    instruction: 'Read the pattern and name the character.',
  },
] as const

export const RICH_RUNG = 0
export const FREE_PRODUCTION_RUNG = 3
export const FREE_RECEPTION_RUNG = 4

/**
 * Whether a rung puts any scaffolding at all in front of the learner.
 *
 * One predicate, read by both the presentation layer and the evidence layer, so
 * "was this answer independent?" can never drift away from "what did the card
 * actually show?". Adding a new kind of support to `CueRung` without extending
 * this predicate is the mistake this single definition exists to prevent.
 */
export function isAssistedRung(rung: CueRung): boolean {
  return (
    rung.allowsArtwork ||
    rung.allowsVerbalCue ||
    rung.allowsAudio ||
    rung.showsLength ||
    rung.revealPolicy !== 'none'
  )
}

/** The rungs at which no cue of any kind may reach the learner. */
export const UNCUED_RUNGS = CUE_RUNGS.filter((rung) => !isAssistedRung(rung))

/**
 * Fade on N consecutive correct answers at a rung, accuracy-primary. Latency is
 * recorded but gates nothing so speed cannot silently become a completion rule.
 */
export const CUE_FADE_STREAK = 2

export const EMPTY_DIRECTION_EVIDENCE: DirectionEvidence = {
  attempts: 0,
  correct: 0,
  unassistedCorrect: 0,
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

/** Whether this item has ever actually been answered inside Test. */
export function hasTestAnswer(evidence: ItemCueEvidence | undefined): boolean {
  if (!evidence) return false
  return Object.values(evidence.directions).some((direction) => (direction?.attempts ?? 0) > 0)
}

/**
 * The rung an item starts Test at when it has never been tested (#90, item 6).
 *
 * Learn and Test keep separate evidence, and they must: a formative answer can
 * never become formal evidence. But separate evidence was being read as *no
 * information*, and the result was measurably absurd. A learner reaching
 * acquisition readiness has produced all twenty-six mappings unaided across
 * roughly two hundred formative retrievals; Test then opened every one of them
 * at `rich`, with the rhythm phrase and half the pattern on screen, and made
 * them climb four rungs again. The first run that could even qualify came about
 * two hundred and thirty questions later.
 *
 * So Learn state chooses the *presentation*, and only the presentation. This
 * writes nothing: `DirectionEvidence` stays at zero until an answer actually
 * happens in Test, a miss lets the ladder restore support in the ordinary way,
 * and a topic that never completed guided acquisition — an import, a legacy
 * library, an ordinary topic — keeps the richer opening it has always had.
 */
export function withBaselineCue(
  evidence: ItemCueEvidence | undefined,
  baseline: CueState,
): ItemCueEvidence | undefined {
  if (baseline === 'rich') return evidence
  if (hasTestAnswer(evidence)) return evidence
  return { cue: baseline, directions: evidence?.directions ?? {} }
}

/**
 * Which direction an untested bidirectional item is asked first.
 *
 * A stable split over the deck, so one run exercises both halves of the claim
 * instead of spending itself entirely on production. Seeded from the item id
 * rather than shuffled, so the allocation is repeatable in tests and identical
 * across devices, and paired with the weakness rule below it gives every item
 * both directions within two full runs.
 */
function directionSeed(id: string): number {
  let hash = 2166136261
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function firstUncuedDirection(item: Item): ItemDirection {
  const key = item.id ?? item.prompt
  return directionSeed(key) % 2 === 0 ? 'prompt-to-answer' : 'answer-to-prompt'
}

/** Cue states in ladder order. `auditory` belongs to later reception work. */
const CUE_ORDER: CueState[] = ['rich', 'delayed-choice', 'reduced', 'free']

function cueRungBase(cue: CueState): number {
  const at = CUE_ORDER.indexOf(cue)
  return at === -1 ? CUE_ORDER.length - 1 : at
}

/**
 * Cue state alone cannot distinguish free production from free reception, so
 * reverse direction opens only after production has held a full fade streak.
 *
 * Once both uncued rungs are open, the ladder asks whichever required direction
 * currently holds the *weaker independent* evidence, ties going to reception so
 * the moment reverse first opens is unchanged. Before #68 the item pinned to
 * reception permanently: `forward.consecutiveCorrect` only ever falls on a
 * forward error, and once the item stopped being asked forward there were no
 * forward answers left to make one. A topic whose claim asserts both directions
 * would then never ask for production again after two answers, and every later
 * qualifying Test was reception-only. Alternating keeps both halves of the
 * claim under active examination without adding a rung, a cue state or a card.
 */
export function rungIndexFor(item: Item, evidence: ItemCueEvidence | undefined): number {
  const base = cueRungBase(evidence?.cue ?? 'rich')
  if (base < FREE_PRODUCTION_RUNG) return base
  if (!requiredDirections(item).includes('answer-to-prompt')) return FREE_PRODUCTION_RUNG

  // Never asked in Test. Split the deck so the first uncued run exercises both
  // directions rather than production twenty-six times over.
  if (!hasTestAnswer(evidence)) {
    return firstUncuedDirection(item) === 'answer-to-prompt'
      ? FREE_RECEPTION_RUNG
      : FREE_PRODUCTION_RUNG
  }

  // Reverse opens once forward holds one *independent* correct answer, which is
  // a fact about recall without scaffolding rather than about a streak that any
  // supported answer could feed. The old guard needed two consecutive correct
  // answers counted at any rung, which in practice meant eight complete
  // production-only runs before reverse printed recall was ever asked for (#90,
  // item 7). Nothing about the completion claim moves: it still requires
  // independent evidence in both directions plus a fully unassisted attempt.
  const forward = directionEvidence(evidence, 'prompt-to-answer')
  if (forward.unassistedCorrect < 1) return FREE_PRODUCTION_RUNG
  const reverse = directionEvidence(evidence, 'answer-to-prompt')
  return reverse.unassistedCorrect <= forward.unassistedCorrect
    ? FREE_RECEPTION_RUNG
    : FREE_PRODUCTION_RUNG
}

export function rungFor(item: Item, evidence: ItemCueEvidence | undefined): CueRung {
  return CUE_RUNGS[rungIndexFor(item, evidence)]
}

/** How many leading elements of the answer a rung discloses. Never all of it. */
export function revealedElementCount(rung: CueRung, answerLength: number): number {
  if (rung.revealPolicy === 'none' || answerLength <= 0) return 0
  const wanted = rung.revealPolicy === 'half' ? Math.ceil(answerLength / 2) : 1
  return Math.max(0, Math.min(answerLength - 1, wanted))
}

export interface RecordedAnswer {
  direction: ItemDirection
  correct: boolean
  /**
   * Whether the rung this answer was given at showed the learner any
   * scaffolding. Required rather than defaulted: a caller that has a rung in
   * hand knows the answer, and a silent default would be exactly the way a
   * supported answer could once again be recorded as independent recall.
   */
  assisted: boolean
  /** Recorded from the first session. Gates nothing in v1. */
  latencyMs: number | null
  at: string
}

function nextCue(cue: CueState, correct: boolean, streak: number): CueState {
  const at = cueRungBase(cue)
  if (!correct) return CUE_ORDER[Math.max(0, at - 1)]
  if (streak < CUE_FADE_STREAK) return CUE_ORDER[at]
  return CUE_ORDER[Math.min(CUE_ORDER.length - 1, at + 1)]
}

/** Fold one answer into cue evidence only; no scheduler state is visible here. */
export function recordAnswer(
  evidence: ItemCueEvidence | undefined,
  answer: RecordedAnswer,
): ItemCueEvidence {
  const current = evidence ?? emptyCueEvidence()
  const before = directionEvidence(current, answer.direction)

  const unassisted = answer.correct && !answer.assisted

  const updated: DirectionEvidence = {
    attempts: before.attempts + 1,
    correct: before.correct + (answer.correct ? 1 : 0),
    // Fading still reads `correct`; only the formal claim reads this counter.
    unassistedCorrect: before.unassistedCorrect + (unassisted ? 1 : 0),
    consecutiveCorrect: answer.correct ? before.consecutiveCorrect + 1 : 0,
    lastAt: answer.at,
    lastLatencyMs: answer.latencyMs,
  }

  const cue = nextCue(current.cue, answer.correct, updated.consecutiveCorrect)
  const consecutiveCorrect = cue === current.cue ? updated.consecutiveCorrect : 0

  return {
    cue,
    directions: {
      ...current.directions,
      [answer.direction]: { ...updated, consecutiveCorrect },
    },
  }
}

/** Apply cue evidence to a topic without touching retention state. */
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

/** Acquisition/establishment split retained for distractor policy consumers. */
export function isInAcquisition(item: Item, evidence: ItemCueEvidence | undefined): boolean {
  return rungIndexFor(item, evidence) < REDUCED_RUNG
}

export function isEstablished(item: Item, evidence: ItemCueEvidence | undefined): boolean {
  return rungIndexFor(item, evidence) >= REDUCED_RUNG
}
