import type {
  IdentifiedItem,
  Item,
  ItemDirection,
  ItemEvidenceStore,
  ItemKind,
  ItemCueEvidence,
} from './types'

let fallbackIdCounter = 0

export function newItemId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `item-${crypto.randomUUID()}`
    }
  } catch {
    // Some embedded/private contexts expose crypto but deny randomUUID.
  }
  fallbackIdCounter += 1
  return `item-${Date.now().toString(36)}-${fallbackIdCounter.toString(36)}`
}

/** Stable deterministic identity for a one-time v4 -> v5 migration. */
export function migratedItemId(topicId: string, index: number): string {
  return `${topicId}-item-${String(index + 1).padStart(2, '0')}`
}

export function identifiedItem(item: Item, idFactory: () => string = newItemId): IdentifiedItem {
  return {
    id: item.id?.trim() || idFactory(),
    kind: item.kind ?? 'forward',
    prompt: item.prompt,
    answer: item.answer,
  }
}

export interface ItemDraft {
  prompt: string
  answer: string
}

/**
 * Preserve durable identity through the plain `prompt | answer` authoring
 * surface without exposing ids to authors. Exact rows match first; then a
 * unique unchanged prompt or answer preserves identity across a text edit.
 * Everything truly unmatched is a new item and receives a new id.
 */
export function reconcileAuthoredItems(
  existing: Item[],
  drafts: ItemDraft[],
  idFactory: () => string = newItemId,
): IdentifiedItem[] {
  const available = existing.map((item, index) => ({ item: identifiedItem(item, idFactory), index }))
  const used = new Set<number>()
  const result: (IdentifiedItem | undefined)[] = new Array(drafts.length)

  function takeMatch(draftIndex: number, predicate: (item: IdentifiedItem) => boolean): boolean {
    const matches = available.filter(({ item, index }) => !used.has(index) && predicate(item))
    if (matches.length !== 1) return false
    const match = matches[0]
    used.add(match.index)
    result[draftIndex] = {
      ...match.item,
      prompt: drafts[draftIndex].prompt,
      answer: drafts[draftIndex].answer,
    }
    return true
  }

  // Reordering is lossless because identity follows the exact row, not index.
  drafts.forEach((draft, index) => {
    takeMatch(index, (item) => item.prompt === draft.prompt && item.answer === draft.answer)
  })

  // A typo/fix on one side still maps to the same item when the other side is
  // unique. Ambiguous duplicates are deliberately not guessed.
  drafts.forEach((draft, index) => {
    if (result[index]) return
    takeMatch(index, (item) => item.prompt === draft.prompt)
  })
  drafts.forEach((draft, index) => {
    if (result[index]) return
    takeMatch(index, (item) => item.answer === draft.answer)
  })

  return drafts.map((draft, index) =>
    result[index] ?? {
      id: idFactory(),
      kind: 'forward',
      prompt: draft.prompt,
      answer: draft.answer,
    },
  )
}

export function pruneItemEvidence(
  evidence: ItemEvidenceStore | undefined,
  items: Item[],
): ItemEvidenceStore {
  if (!evidence) return {}
  const live = new Set(items.flatMap((item) => item.id ? [item.id] : []))
  return Object.fromEntries(Object.entries(evidence).filter(([itemId]) => live.has(itemId)))
}

export function itemKind(item: Item): ItemKind {
  return item.kind ?? 'forward'
}

export function requiredDirections(item: Item): ItemDirection[] {
  return itemKind(item) === 'bidirectional'
    ? ['prompt-to-answer', 'answer-to-prompt']
    : ['prompt-to-answer']
}

/**
 * Coverage is not scheduler completion. It answers only whether each direction
 * required by this item's content semantics has at least one *independent*
 * correct evidence event — one earned at a rung showing no scaffolding at all.
 *
 * #68: this deliberately reads `unassistedCorrect` rather than `correct`. The
 * printed Morse claim says the learner recalls each mapping *independently*, so
 * a correct answer given with half the pattern, the timing artwork, a verbal
 * beat or the element count on screen cannot be part of it. Such an answer is
 * still real acquisition progress and still fades the cue; it simply is not
 * evidence of the thing the claim asserts. A bidirectional item can therefore
 * report complete coverage neither from forward evidence alone nor from
 * supported evidence in either direction.
 */
export function hasCompleteDirectionalCoverage(
  item: Item,
  evidence: ItemCueEvidence | undefined,
): boolean {
  if (!evidence) return false
  return requiredDirections(item).every(
    (direction) => (evidence.directions[direction]?.unassistedCorrect ?? 0) > 0,
  )
}

/** A bidirectional topic cannot submit a passing retention attempt until every
 * logical item has independent correct evidence in every direction its content
 * requires. */
export function hasCompleteTopicDirectionalCoverage(
  items: Item[],
  evidence: ItemEvidenceStore | undefined,
): boolean {
  return items.every((item) => !!item.id && hasCompleteDirectionalCoverage(item, evidence?.[item.id]))
}

/**
 * One scored answer as the qualifying attempt actually happened, rather than as
 * the accumulated store later remembers it.
 *
 * `itemEvidence` is a lifetime, monotonically non-decreasing record. Read alone
 * it can only ever answer "has this learner ever…", which is not the question a
 * *delayed* retention attempt asks. This is the attempt's own testimony, and it
 * is what stops history from carrying a run that the learner did not give
 * independently today.
 */
export interface AttemptAnswer {
  itemId: string
  direction: ItemDirection
  correct: boolean
  /** True when any scaffolding at all was on screen for this answer. */
  assisted: boolean
}

/**
 * Whether an attempt may be presented to the unchanged scheduler as a passing
 * retention attempt for a topic carrying bidirectional units.
 *
 * Three conditions, and the first two are about this attempt rather than about
 * history:
 *
 * 1. the attempt testified about every logical unit — an attempt that says
 *    nothing about how a unit was asked cannot be taken to have asked it
 *    unaided, so silence withholds the claim rather than passing it;
 * 2. every answer it gave was independent — one supported answer means the
 *    learner did not recall all 26 mappings unaided in this run, and a run like
 *    that cannot bank a claim that says `independently`;
 * 3. every logical unit holds independent correct evidence in every direction
 *    its content requires, counting this attempt's own answers.
 *
 * Condition 3 still reads accumulated evidence, and that is a deliberate,
 * documented limit rather than an oversight. The topic has exactly 26 logical
 * scoring units and one card each; the two directions of one mapping cannot be
 * asked back to back without each disclosing the other, so no single attempt
 * can demonstrate all 52 directional requirements. What #68 changes is that
 * every event which may contribute is now independent recall. See the audit
 * section of `docs/MORSE_CUE_LADDER.md`.
 */
export function isQualifyingAttempt(
  items: Item[],
  evidence: ItemEvidenceStore | undefined,
  attempt: readonly AttemptAnswer[],
): boolean {
  if (attempt.some((answer) => answer.assisted)) return false
  const testified = new Set(attempt.map((answer) => answer.itemId))
  if (!items.every((item) => !!item.id && testified.has(item.id))) return false
  return hasCompleteTopicDirectionalCoverage(items, evidence)
}

export function retentionCorrectCount(
  items: Item[],
  evidence: ItemEvidenceStore | undefined,
  correct: number,
  attempt: readonly AttemptAnswer[] = [],
): number {
  if (!items.some((item) => itemKind(item) === 'bidirectional')) return correct
  return isQualifyingAttempt(items, evidence, attempt) ? correct : 0
}
