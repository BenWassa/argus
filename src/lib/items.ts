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
 * required by this item's content semantics has at least one correct evidence
 * event. A bidirectional item can therefore never report complete directional
 * coverage from forward evidence alone.
 */
export function hasCompleteDirectionalCoverage(
  item: Item,
  evidence: ItemCueEvidence | undefined,
): boolean {
  if (!evidence) return false
  return requiredDirections(item).every((direction) => (evidence.directions[direction]?.correct ?? 0) > 0)
}
