export const TRACKS = ['learning', 'survival', 'tradecraft'] as const
export type Track = (typeof TRACKS)[number]

/**
 * The status ladder. Every topic sits on exactly one rung, and the rung
 * decides both what the topic looks like and when it comes back.
 *
 *   unstarted -> learning -> drilled -> completed
 *                              ^           |
 *                              +- decayed -+
 *
 * `completed` is permanent: decay routes a topic back to drilling without
 * erasing the fact that it was once completed.
 */
export const STATUSES = ['unstarted', 'learning', 'drilled', 'completed', 'decayed'] as const
export type Status = (typeof STATUSES)[number]

/**
 * Item semantics are content definition. Existing/legacy items are forward
 * unless normalized to another explicit kind by the v5 storage boundary.
 */
export const ITEM_KINDS = ['forward', 'bidirectional'] as const
export type ItemKind = (typeof ITEM_KINDS)[number]

export const ITEM_DIRECTIONS = ['prompt-to-answer', 'answer-to-prompt'] as const
export type ItemDirection = (typeof ITEM_DIRECTIONS)[number]

/**
 * `id` and `kind` are optional only on the broad in-memory Topic shape so old
 * fixtures and v4 seed authoring remain structurally compatible. Every v5
 * library produced by storage contains both fields for every item.
 */
export interface Item {
  id?: string
  kind?: ItemKind
  prompt: string
  answer: string
}

export interface IdentifiedItem extends Item {
  id: string
  kind: ItemKind
}

export const CUE_STATES = ['rich', 'reduced', 'delayed-choice', 'free', 'auditory'] as const
export type CueState = (typeof CUE_STATES)[number]

/** Learning state: evidence for one stimulus/response direction of one item. */
export interface DirectionEvidence {
  attempts: number
  correct: number
  consecutiveCorrect: number
  lastAt: string | null
  lastLatencyMs: number | null
}

/**
 * Learning state: deliberately a sibling of scheduler history. Cue progression
 * can use this evidence but cannot qualify, skip or reset a retention gap.
 */
export interface ItemCueEvidence {
  cue: CueState
  directions: Partial<Record<ItemDirection, DirectionEvidence>>
}

export type ItemEvidenceStore = Record<string, ItemCueEvidence>

/**
 * A narrow Morse Learn block. These fields are content definition: glyph,
 * canonical notation, mnemonic asset reference and the source text from which
 * the audio engine derives playback. The generated waveform/animation is
 * runtime presentation and is never persisted.
 */
export interface MorseCharacterLearnItem {
  glyph: string
  pattern: string
  mnemonicId: string
  audioText: string
  textLabel: string
}

/**
 * Learn support is deliberately plain structured data. The scored boundary
 * remains `scope` + `items`; none of these blocks are Test material unless an
 * author explicitly adds equivalent finite recall items to the deck.
 */
export type LearnBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'definitions'; items: { term: string; definition: string }[] }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'morse-character-packet'; characters: MorseCharacterLearnItem[] }

export interface LearnSection {
  heading: string
  blocks: LearnBlock[]
}

export interface LearnCaseStudy {
  title: string
  scenario: string
  /** Analyse the case as a whole; do not force one toy example per term. */
  analysis: LearnSection[]
  takeaway?: string
}

export interface LearnSource {
  label: string
  url?: string
  note?: string
}

export const LEARN_KINDS = ['concise', 'briefing'] as const
export type LearnKind = (typeof LEARN_KINDS)[number]

export interface LearnContent {
  /** Undefined `Topic.learn` is the third archetype: reference-only. */
  kind: LearnKind
  overview?: string
  sections?: LearnSection[]
  caseStudies?: LearnCaseStudy[]
  limitations?: string[]
  sources?: LearnSource[]
}

export interface Attempt {
  at: string
  correct: number
  total: number
  /** Status the topic held after this attempt resolved. */
  resolvedTo: Status
}

export interface Topic {
  id: string
  title: string
  /** The hard boundary. A topic cannot exist without one. */
  scope: string
  track: Track
  /** Finite scored recall material. Learn support never changes this set. */
  items: Item[]
  /** Optional explanatory support shown only in Learn. */
  learn?: LearnContent
  status: Status
  createdAt: string
  /** When the topic first reached `drilled`. Starts the delayed-recall clock. */
  drilledAt: string | null
  /** First exposure timestamp. Starts the one-day learning gap. */
  learningAt: string | null
  /** Set once, the first time the topic completes. Never cleared by decay. */
  completedAt: string | null
  /** Most recent scored Test, whether scheduled or voluntary. */
  lastTestedAt: string | null
  /** Most recent due completed-topic Test. Starts the spot-check clock. */
  spotCheckedAt: string | null
  history: Attempt[]
  /** v5 acquisition evidence. Optional only for legacy/internal Topic fixtures. */
  itemEvidence?: ItemEvidenceStore
}

/** Seed/import compatibility shape used only before the v5 storage boundary. */
export interface LegacyLibraryV4 {
  version: 4
  topics: Topic[]
}

/** Every library returned by storage/export is normalized to this version. */
export interface CurrentLibrary {
  version: 5
  topics: Topic[]
}

/** The seed remains an explicit v4 source record; storage is the v5 boundary. */
export type Library = LegacyLibraryV4 | CurrentLibrary

export type View = 'today' | 'library' | 'progress' | 'data'

/** Learn is ungraded exposure; Test is the single scored recall interaction. */
export const MODES = ['learn', 'test'] as const
export type Mode = (typeof MODES)[number]
