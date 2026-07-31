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
  items: Item[]
  status: Status
  createdAt: string
  /** When the topic first reached `drilled`. Starts the delayed-recall clock. */
  drilledAt: string | null
  /** Set once, the first time the topic completes. Never cleared by decay. */
  completedAt: string | null
  lastPracticedAt: string | null
  history: Attempt[]
}

export interface Library {
  version: 2
  topics: Topic[]
}

export type View = 'today' | 'library' | 'progress' | 'data'
