import { describe, expect, it } from 'vitest'
import { HIGH_CONFUSION, confusionScore, differsOnlyInFinalElement, isConfusable } from './confusion'
import { morsePattern, type MorseLetter } from '../morse/code'

/**
 * The confusion model, pinned to numbers.
 *
 * `confusionScore` is a hand-weighted float — `0.5*shape + 0.3*opening +
 * 0.2*length` — and `HIGH_CONFUSION` is a single cut through it that decides
 * what Learn offers as an alternative and what Test offers as a distractor.
 * Nothing about either is derivable from the type system, so every weight and
 * the threshold are asserted against exact values here: a well-meant tweak to
 * one coefficient changes which letters the learner is asked to tell apart,
 * and it should have to say so.
 *
 * `editDistance` and `sharedPrefix` are deliberately not exported, so they are
 * exercised through the score they feed. That is not a compromise: the score
 * is a strictly monotone reading of the distance at a fixed length, so an
 * exact score at a known length names exactly one distance. Each case below
 * says which one it pins.
 */

/** Real Morse, so a calibration claim is tested against the alphabet it was made for. */
const p = (letter: MorseLetter) => morsePattern(letter)

describe('confusionScore', () => {
  it('calls a pattern maximally confusable with itself', () => {
    expect(confusionScore('...', '...')).toBe(1)
    expect(confusionScore('', '')).toBe(1)
  })

  it('scores a pattern against nothing at zero', () => {
    // Distance 3 over length 3: no shape, no opening, no matching length.
    expect(confusionScore('', '...')).toBe(0)
    expect(confusionScore('...', '')).toBe(0)
  })

  it('leaves fully disjoint patterns with nothing but their length in common', () => {
    // Distance 3 over length 3 again, but the lengths agree, so only the
    // 0.2 length term survives.
    expect(confusionScore('...', '---')).toBe(0.2)
  })

  it('gives a single differing element no shared opening to trade on', () => {
    // Distance 1 over length 1. E and T differ in their only element, which
    // the module's own comment calls out as correctly *not* confusable: there
    // is no opening to hold in mind before the discriminating mark arrives.
    expect(confusionScore(p('E'), p('T'))).toBe(0.2)
  })

  it('rises as the shared opening lengthens', () => {
    // Distance 1 throughout; only the opening and the length term move.
    expect(confusionScore('..', '...')).toBeCloseTo(0.5333, 4)
    expect(confusionScore('....', '...')).toBe(0.6)
    expect(confusionScore('...', '..-')).toBeCloseTo(0.7333, 4)
  })
})

describe('the HIGH_CONFUSION threshold', () => {
  it('sits where the module says it does', () => {
    expect(HIGH_CONFUSION).toBe(0.6)
  })

  it('catches a pair sitting exactly on it', () => {
    // S/H is the near-miss the calibration comment names by pattern. It scores
    // the threshold itself, so the comparison has to be inclusive — a `>` here
    // would silently stop treating it as confusable.
    expect(confusionScore(p('S'), p('H'))).toBe(0.6)
    expect(isConfusable(p('S'), p('H'))).toBe(true)
  })

  it('rejects the pair immediately below it', () => {
    // I/S: same relationship as S/H, one element shorter, and it falls under.
    expect(confusionScore(p('I'), p('S'))).toBeLessThan(HIGH_CONFUSION)
    expect(isConfusable(p('I'), p('S'))).toBe(false)
  })

  it('never calls a pattern confusable with itself, whatever it scores', () => {
    // `confusionScore` answers 1 here, so only the explicit inequality in
    // `isConfusable` stops a character being offered as its own distractor.
    expect(confusionScore(p('S'), p('S'))).toBe(1)
    expect(isConfusable(p('S'), p('S'))).toBe(false)
  })
})

describe('the confusion families the programme rule names', () => {
  /**
   * Spragg's hardest family: same length, same opening, differing only at the
   * end. The comment on `HIGH_CONFUSION` claims this is caught from two
   * elements upward, and that a one-element pair is not. Both halves are
   * tested, because the claim is only useful if its exclusion holds too.
   */
  it('catches same-length final-element pairs from two elements upward', () => {
    for (const [a, b] of [
      ['M', 'N'], // -- / -.
      ['A', 'I'], // .- / ..
      ['S', 'U'], // ... / ..-
      ['H', 'V'], // .... / ...-
      ['B', 'X'], // -... / -..-
    ] as const) {
      expect(differsOnlyInFinalElement(p(a), p(b)), `${a}/${b}`).toBe(true)
      expect(isConfusable(p(a), p(b)), `${a}/${b}`).toBe(true)
    }
  })

  it('leaves the one-element pair out, by design', () => {
    expect(differsOnlyInFinalElement(p('E'), p('T'))).toBe(true)
    expect(isConfusable(p('E'), p('T'))).toBe(false)
  })
})

describe('differsOnlyInFinalElement', () => {
  it('is false for a pattern against itself', () => {
    expect(differsOnlyInFinalElement('...', '...')).toBe(false)
  })

  it('is false when the lengths differ, however much they share', () => {
    // S/H share their whole opening and differ only in that H has one more
    // element. That is a near-miss, not a final-element pair.
    expect(differsOnlyInFinalElement(p('S'), p('H'))).toBe(false)
  })

  it('is false when they diverge before the final element', () => {
    // A/N are each other reversed: same length, same last element, different
    // first one.
    expect(differsOnlyInFinalElement(p('A'), p('N'))).toBe(false)
    expect(differsOnlyInFinalElement('.--.', '.-..')).toBe(false)
  })

  it('is true only when everything before the last element matches', () => {
    expect(differsOnlyInFinalElement(p('U'), p('V'))).toBe(false)
    expect(differsOnlyInFinalElement(p('B'), p('X'))).toBe(true)
  })
})

describe('the model is symmetric', () => {
  it('scores a pair the same in either order', () => {
    // Order is an accident of which character the caller happened to be
    // holding, so it must never change what is offered.
    for (const [a, b] of [
      ['S', 'H'],
      ['A', 'I'],
      ['E', 'T'],
      ['B', 'X'],
    ] as const) {
      expect(confusionScore(p(a), p(b)), `${a}/${b}`).toBe(confusionScore(p(b), p(a)))
      expect(isConfusable(p(a), p(b)), `${a}/${b}`).toBe(isConfusable(p(b), p(a)))
    }
  })
})
