import { isEstablished, isInAcquisition } from './cueLadder'
import type { Item, ItemCueEvidence, ItemEvidenceStore } from './types'

/**
 * Evidence-informed, stage-aware distractor selection.
 *
 * The programme rule this implements, from #21 and the plan:
 *
 *   during acquisition   — separate highly confusable items (Rothkopf 1958);
 *   during discrimination — deliberately contrast them, once both are learned
 *                           (Spragg 1943).
 *
 * The confusion relationship is *derived* from the answers rather than kept as
 * a hard-coded list, so it holds for any symbol deck and cannot fall out of
 * step with the content.
 */

function editDistance(a: string, b: string): number {
  if (a === b) return 0
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i]
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(
        previous[j] + 1,
        row[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    previous = row
  }
  return previous[b.length]
}

function sharedPrefix(a: string, b: string): number {
  let at = 0
  while (at < a.length && at < b.length && a[at] === b[at]) at += 1
  return at
}

/**
 * How readily two answers could be mistaken for one another, 0 to 1.
 *
 * Weighted so that the family Spragg identifies as hardest — same length, same
 * opening, differing only at the end — scores highest among genuinely distinct
 * answers.
 */
export function confusionScore(a: string, b: string): number {
  if (a === b) return 1
  const longest = Math.max(a.length, b.length)
  if (longest === 0) return 1
  const shape = 1 - editDistance(a, b) / longest
  const opening = sharedPrefix(a, b) / longest
  const length = a.length === b.length ? 1 : 0
  return 0.5 * shape + 0.3 * opening + 0.2 * length
}

/** Same length, same opening, differing only in the final element. */
export function differsOnlyInFinalElement(a: string, b: string): boolean {
  return a.length === b.length && a !== b && a.slice(0, -1) === b.slice(0, -1)
}

/**
 * At or above this, an alternative is treated as a genuine confusable.
 *
 * Calibrated so that a same-length pair sharing everything but its last element
 * is caught from two elements upward, along with near-misses like `...`/`....`.
 * A one-element pair such as `.`/`-` scores well below it, correctly: there is
 * no shared opening to hold in mind before the discriminating element arrives,
 * which is the mechanism the confusion families are about.
 */
export const HIGH_CONFUSION = 0.6

export type DistractorStage = 'acquisition' | 'discrimination'

export function distractorStage(item: Item, evidence: ItemCueEvidence | undefined): DistractorStage {
  return isInAcquisition(item, evidence) ? 'acquisition' : 'discrimination'
}

export interface DistractorRequest {
  target: Item
  /** Every other scored item in the topic. */
  pool: Item[]
  evidence: ItemEvidenceStore
  count: number
  /** Injectable so selection is deterministic under test. */
  random?: () => number
}

interface Ranked {
  item: Item
  confusion: number
  established: boolean
}

function shuffle<T>(list: T[], random: () => number): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Choose alternatives for one prompt.
 *
 * During acquisition: prefer alternatives the learner already knows and that
 * are clearly different from the target, so a wrong option is wrong for an
 * obvious reason. A highly confusable alternative is admitted only if it is
 * itself established — never while both items are still being encoded.
 *
 * During discrimination: prefer established confusables, which is the whole
 * point of the stage. An unlearned confusable is still excluded: contrasting a
 * pair requires both members to be learned, not one.
 */
export function selectDistractors(request: DistractorRequest): Item[] {
  const { target, pool, evidence, count } = request
  const random = request.random ?? Math.random
  if (count <= 0) return []

  const stage = distractorStage(target, evidence[target.id ?? ''])
  const ranked: Ranked[] = pool
    .filter((candidate) => candidate.id !== target.id && candidate.answer !== target.answer)
    .map((candidate) => ({
      item: candidate,
      confusion: confusionScore(target.answer, candidate.answer),
      established: isEstablished(candidate, evidence[candidate.id ?? '']),
    }))

  // Rothkopf applies in both stages: a confusable that is not itself learned is
  // never used as an alternative.
  const unsafe = ranked.filter((entry) => entry.confusion >= HIGH_CONFUSION && !entry.established)
  const safe = ranked.filter((entry) => !unsafe.includes(entry))

  const bands: Ranked[][] =
    stage === 'discrimination'
      ? [
          safe.filter((entry) => entry.established && entry.confusion >= HIGH_CONFUSION),
          safe.filter((entry) => entry.established && entry.confusion < HIGH_CONFUSION),
          safe.filter((entry) => !entry.established),
        ]
      : [
          safe.filter((entry) => entry.established && entry.confusion < HIGH_CONFUSION),
          safe.filter((entry) => !entry.established && entry.confusion < HIGH_CONFUSION),
          safe.filter((entry) => entry.confusion >= HIGH_CONFUSION),
        ]

  const chosen: Item[] = []
  for (const band of bands) {
    if (chosen.length >= count) break
    const ordered =
      stage === 'discrimination'
        ? [...band].sort((a, b) => b.confusion - a.confusion)
        : [...band].sort((a, b) => a.confusion - b.confusion)
    // Within equally suitable candidates the choice is arbitrary, so vary it
    // rather than asking the same three alternatives every time.
    const banded = groupByConfusion(ordered).flatMap((group) => shuffle(group, random))
    for (const entry of banded) {
      if (chosen.length >= count) break
      chosen.push(entry.item)
    }
  }

  // Only if the safe pool genuinely cannot fill the alternatives does an
  // unlearned confusable appear at all, and then least confusable first.
  for (const entry of [...unsafe].sort((a, b) => a.confusion - b.confusion)) {
    if (chosen.length >= count) break
    chosen.push(entry.item)
  }

  return chosen
}

function groupByConfusion(ranked: Ranked[]): Ranked[][] {
  const groups: Ranked[][] = []
  for (const entry of ranked) {
    const last = groups[groups.length - 1]
    if (last && Math.abs(last[0].confusion - entry.confusion) < 1e-9) last.push(entry)
    else groups.push([entry])
  }
  return groups
}
