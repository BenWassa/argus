import { describe, expect, it } from 'vitest'
import { MORSE_LETTERS, type MorseLetter } from './morse'
import {
  confusionScore,
  differsOnlyInFinalElement,
  distractorStage,
  HIGH_CONFUSION,
  selectDistractors,
} from './distractors'
import { isAssistedRung, recordAnswer, rungFor } from './cueLadder'
import type { IdentifiedItem, ItemCueEvidence, ItemEvidenceStore } from './types'

const deck: IdentifiedItem[] = (Object.keys(MORSE_LETTERS) as MorseLetter[]).map((letter) => ({
  id: `i-${letter}`,
  kind: 'forward',
  prompt: letter,
  answer: MORSE_LETTERS[letter],
}))

function item(letter: MorseLetter): IdentifiedItem {
  return deck.find((candidate) => candidate.prompt === letter)!
}

/** Drive an item up the ladder with `count` correct answers. */
function climbed(target: IdentifiedItem, count: number): ItemCueEvidence {
  let evidence: ItemCueEvidence | undefined
  for (let i = 0; i < count; i += 1) {
    const rung = rungFor(target, evidence)
    evidence = recordAnswer(evidence, {
      direction: rung.direction,
      correct: true,
      assisted: isAssistedRung(rung),
      latencyMs: 800,
      at: '2026-01-01T00:00:00.000Z',
    })
  }
  return evidence!
}

function evidenceFor(entries: [MorseLetter, number][]): ItemEvidenceStore {
  return Object.fromEntries(entries.map(([letter, count]) => [item(letter).id, climbed(item(letter), count)]))
}

const sequential = () => 0

describe('confusion is derived, not hard-coded', () => {
  it('scores an identical answer at the top and a wholly different one low', () => {
    expect(confusionScore('...', '...')).toBe(1)
    expect(confusionScore('.', '----')).toBeLessThan(0.4)
  })

  it('ranks the final-element family highest among distinct answers', () => {
    // S/U differ only in the last element; S/O share nothing but length.
    expect(confusionScore('...', '..-')).toBeGreaterThan(confusionScore('...', '---'))
    expect(confusionScore('...', '..-')).toBeGreaterThanOrEqual(HIGH_CONFUSION)
    expect(differsOnlyInFinalElement('...', '..-')).toBe(true)
    expect(differsOnlyInFinalElement('.-', '.--')).toBe(false)
  })

  it('is symmetric', () => {
    for (const a of Object.values(MORSE_LETTERS)) {
      for (const b of Object.values(MORSE_LETTERS)) {
        expect(confusionScore(a, b)).toBeCloseTo(confusionScore(b, a), 10)
      }
    }
  })

  it('treats every multi-element final-element pair in the alphabet as confusable', () => {
    const patterns = Object.values(MORSE_LETTERS)
    const pairs = patterns.flatMap((a) =>
      patterns.filter((b) => differsOnlyInFinalElement(a, b)).map((b) => [a, b] as const),
    )
    expect(pairs.length).toBeGreaterThan(10)
    for (const [a, b] of pairs) {
      if (a.length < 2) continue
      expect(confusionScore(a, b)).toBeGreaterThanOrEqual(HIGH_CONFUSION)
    }
  })

  it('scores the one-element pair low, and that is the right answer', () => {
    // `.` and `-` differ only in their final element, but there is no shared
    // opening to hold in mind before the difference arrives — which is the
    // mechanism the confusion families describe. Treating E and T as a
    // confusable pair here would misapply the finding.
    expect(differsOnlyInFinalElement('.', '-')).toBe(true)
    expect(confusionScore('.', '-')).toBeLessThan(HIGH_CONFUSION)
    expect(confusionScore('...', '..-')).toBeGreaterThan(confusionScore('.', '-'))
  })

  it('ranks a final-element pair above a same-length pair differing in more', () => {
    for (const [a, b, c] of [
      ['...', '..-', '.--'],
      ['-...', '-..-', '-.--'],
      ['.-.', '.--', '-.-'],
    ] as const) {
      expect(differsOnlyInFinalElement(a, b)).toBe(true)
      expect(confusionScore(a, b)).toBeGreaterThan(confusionScore(a, c))
    }
  })
})

describe('stage-aware distractor selection', () => {
  it('reports the stage from the item’s own rung', () => {
    expect(distractorStage(item('S'), undefined)).toBe('acquisition')
    expect(distractorStage(item('S'), climbed(item('S'), 4))).toBe('discrimination')
  })

  it('keeps a confusable away from an item still being acquired', () => {
    // S is novel. U differs from it only in the final element and is itself
    // novel, so Rothkopf says keep them apart.
    const chosen = selectDistractors({
      target: item('S'),
      pool: deck,
      evidence: {},
      count: 3,
      random: sequential,
    })
    expect(chosen.map((entry) => entry.prompt)).not.toContain('U')
    for (const entry of chosen) {
      expect(confusionScore(item('S').answer, entry.answer)).toBeLessThan(HIGH_CONFUSION)
    }
  })

  it('contrasts a confusable deliberately once both items are learned', () => {
    const evidence = evidenceFor([['S', 6], ['U', 6], ['O', 6], ['M', 6], ['T', 6]])
    const chosen = selectDistractors({
      target: item('S'),
      pool: deck,
      evidence,
      count: 3,
      random: sequential,
    })
    expect(chosen.map((entry) => entry.prompt)).toContain('U')
  })

  it('still withholds a confusable that the learner has not learned', () => {
    // S is established, U is not. Contrasting a pair needs both members.
    const evidence = evidenceFor([['S', 6], ['O', 6], ['M', 6], ['T', 6], ['A', 6], ['E', 6]])
    const chosen = selectDistractors({
      target: item('S'),
      pool: deck,
      evidence,
      count: 3,
      random: sequential,
    })
    expect(chosen.map((entry) => entry.prompt)).not.toContain('U')
  })

  it('prefers already-encountered alternatives during acquisition', () => {
    const evidence = evidenceFor([['O', 4], ['M', 4], ['J', 4]])
    const chosen = selectDistractors({
      target: item('S'),
      pool: deck,
      evidence,
      count: 3,
      random: sequential,
    })
    expect(chosen.map((entry) => entry.prompt).sort()).toEqual(['J', 'M', 'O'])
  })

  it('never offers the answer as one of its own alternatives', () => {
    for (const target of deck) {
      const chosen = selectDistractors({
        target,
        pool: deck,
        evidence: {},
        count: 3,
        random: sequential,
      })
      expect(chosen).toHaveLength(3)
      expect(chosen.map((entry) => entry.answer)).not.toContain(target.answer)
      expect(new Set(chosen.map((entry) => entry.id)).size).toBe(3)
    }
  })

  it('fills the alternatives even from a pool with nothing safe in it', () => {
    const tiny: IdentifiedItem[] = [item('S'), item('U')]
    const chosen = selectDistractors({
      target: item('S'),
      pool: tiny,
      evidence: {},
      count: 3,
      random: sequential,
    })
    // Only U exists, and it is an unlearned confusable. A prompt with no
    // alternatives is worse than a hard one, so it is used as a last resort.
    expect(chosen.map((entry) => entry.prompt)).toEqual(['U'])
  })

  it('returns nothing when nothing is asked for', () => {
    expect(selectDistractors({ target: item('S'), pool: deck, evidence: {}, count: 0 })).toEqual([])
  })

  it('varies equally suitable alternatives rather than always asking the same three', () => {
    const seeds = [0.05, 0.4, 0.75, 0.95]
    const seen = new Set<string>()
    for (const seed of seeds) {
      let at = 0
      const chosen = selectDistractors({
        target: item('S'),
        pool: deck,
        evidence: {},
        count: 3,
        random: () => seeds[(at++ + seeds.indexOf(seed)) % seeds.length],
      })
      seen.add(chosen.map((entry) => entry.prompt).sort().join(''))
    }
    expect(seen.size).toBeGreaterThan(1)
  })
})
