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

export interface Item {
  prompt: string
  answer: string
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
}

export interface Library {
  version: 4
  topics: Topic[]
}

export type View = 'today' | 'library' | 'progress' | 'data'

/** Learn is ungraded exposure; Test is the single scored recall interaction. */
export const MODES = ['learn', 'test'] as const
export type Mode = (typeof MODES)[number]
