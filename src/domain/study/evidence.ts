/**
 * What Argus knows about a learner's recall of one item, and how much
 * scaffolding the scored Test still offers it.
 *
 * `ItemDirection` lives here rather than with the item model because it is a
 * study axis, not a property of the content: an item's `kind` says whether it
 * may be asked both ways, while a direction is one way of asking it, and
 * evidence is recorded per direction.
 */
export const ITEM_DIRECTIONS = ['prompt-to-answer', 'answer-to-prompt'] as const
export type ItemDirection = (typeof ITEM_DIRECTIONS)[number]

export const CUE_STATES = ['rich', 'reduced', 'delayed-choice', 'free', 'auditory'] as const
export type CueState = (typeof CUE_STATES)[number]

/**
 * Learning state: evidence for one stimulus/response direction of one item.
 *
 * `correct` and `unassistedCorrect` deliberately answer two different
 * questions, and #68 turns on keeping them apart:
 *
 *   correct            was the answer right? — the cue ladder fades on this
 *   unassistedCorrect  was it right with *no* scaffolding on screen? — the only
 *                      evidence the formal completion claim may read
 *
 * A correct answer at a supported rung is genuine acquisition progress and
 * genuinely earns a fade. It is not independent recall, so it cannot support a
 * claim that says `independently`. `unassistedCorrect` counts only answers given
 * at a rung that shows no artwork, no verbal fragment, no revealed prefix, no
 * element count and no audio.
 *
 * Additive within v5: absent in an older record means zero. That is deliberately
 * conservative — the support level of pre-#68 evidence was never recorded, so it
 * cannot be assumed independent — and it can only ever withhold a claim, never
 * fabricate one.
 */
export interface DirectionEvidence {
  attempts: number
  correct: number
  /** Correct answers given at a rung offering no scaffolding of any kind. */
  unassistedCorrect: number
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
