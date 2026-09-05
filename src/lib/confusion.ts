/**
 * How readily two answers could be mistaken for one another.
 *
 * Extracted so the one confusion model serves everything that needs it —
 * character ordering, Test distractors and the Learn lesson's alternatives —
 * rather than each growing its own. It is deliberately dependency-free: pure
 * string comparison, no learner state, no cue ladder, no scheduler, so a module
 * can use it without acquiring the ability to write evidence.
 *
 * The programme rule it exists to implement, from #21 and the plan:
 *
 *   during acquisition    — separate highly confusable items (Rothkopf 1958);
 *   during discrimination — deliberately contrast them, once both are learned
 *                           (Spragg 1943).
 *
 * The relationship is *derived* from the answers rather than kept as a
 * hard-coded list, so it holds for any symbol deck and cannot fall out of step
 * with the content.
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
 * Confusability, 0 to 1.
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

export function isConfusable(a: string, b: string): boolean {
  return a !== b && confusionScore(a, b) >= HIGH_CONFUSION
}
