import { describe, expect, it } from 'vitest'
import { morseAcquisitionProfile } from './acquisition'
import { catalogDefinition, freshCatalogTopic } from './catalog'
import {
  answerMorsePlacement,
  applyMorsePlacement,
  currentMorsePlacementTarget,
  expectedMorsePlacementPattern,
  startMorsePlacement,
  type MorsePlacementRun,
} from './morsePlacement'
import {
  hasLaterSittingSuccess,
  hasListeningCoverage,
  morseReviewOf,
  recordPrintedRetrieval,
  withMorseReview,
} from './morseReview'
import type { Topic } from './types'

const MORSE_ID = 'international-morse-letters-printed'
const NOW = new Date('2026-09-17T22:00:00.000Z')

function freshMorse(): Topic {
  const definition = catalogDefinition(MORSE_ID)
  if (!definition) throw new Error('Missing shipped Morse topic.')
  return freshCatalogTopic(definition, NOW)
}

function correct(run: MorsePlacementRun): MorsePlacementRun {
  const target = currentMorsePlacementTarget(run)
  if (!target) return run
  return answerMorsePlacement(run, expectedMorsePlacementPattern(target))
}

function perfect(topic: Topic, experience: 'some' | 'most'): MorsePlacementRun {
  let run = startMorsePlacement(topic, experience)
  if (!run) throw new Error('Expected placement to start.')
  let guard = 0
  while (!run.complete && guard < 100) {
    run = correct(run)
    guard += 1
  }
  if (!run.complete || !run.result) throw new Error('Placement did not finish.')
  return run
}

function itemIdFor(topic: Topic, glyph: string): string {
  const profile = morseAcquisitionProfile(topic)
  const match = profile && [...profile.values()].find((entry) => entry.glyph === glyph)
  if (!match) throw new Error(`Missing item for ${glyph}.`)
  return match.itemId
}

describe('Morse placement hardening', () => {
  it('keeps a miss on the final diagnostic target separated by two intervening prompts', () => {
    let run = startMorsePlacement(freshMorse(), 'most')!

    while (run.index < run.targets.length - 1) run = correct(run)
    const final = currentMorsePlacementTarget(run)!

    run = answerMorsePlacement(run, '----')

    expect(run.complete).toBe(false)
    expect(run.states[final.letter]?.status).toBe('uncertain')
    expect(run.targets[run.index]?.letter).not.toBe(final.letter)
    expect(run.targets[run.index + 1]?.letter).not.toBe(final.letter)
    expect(run.targets[run.index + 2]).toMatchObject({ letter: final.letter, retry: true })
  })

  it('treats placed-out settled items as independently established without persisting fake review history', () => {
    const topic = freshMorse()
    const run = perfect(topic, 'some')
    const throughTwo = {
      ...run.result!,
      throughLesson: 2,
      nextLesson: 3,
      verifiedLetters: run.lessons.slice(0, 2).flatMap((lesson) => lesson.letters),
    }
    const applied = applyMorsePlacement(topic, throughTwo, NOW)
    const glyph = throughTwo.verifiedLetters[0]
    const itemId = itemIdFor(applied, glyph)

    const derived = morseReviewOf(applied)
    expect(derived.items[itemId]?.introducedIn).toBe(0)
    expect(hasLaterSittingSuccess(derived, itemId)).toBe(true)
    expect(hasListeningCoverage(derived, itemId)).toBe(true)

    const afterCorrectReview = withMorseReview(
      applied,
      recordPrintedRetrieval(derived, itemId, true),
    )
    expect(afterCorrectReview.morseReview).toBeUndefined()

    const weakened: Topic = {
      ...applied,
      lessonProgress: { ...applied.lessonProgress, [itemId]: 'cued' },
    }
    const afterWeakness = morseReviewOf(weakened)
    expect(afterWeakness.items[itemId]).toBeUndefined()
    expect(hasLaterSittingSuccess(afterWeakness, itemId)).toBe(false)
  })
})
