import { describe, expect, it } from 'vitest'
import { catalogDefinition, freshCatalogTopic } from './catalog'
import { morseAcquisitionPosition } from './morseLesson'
import {
  answerMorsePlacement,
  applyMorsePlacement,
  canOfferMorsePlacement,
  currentMorsePlacementTarget,
  expectedMorsePlacementPattern,
  startMorsePlacement,
  type MorsePlacementRun,
} from './morsePlacement'
import type { Topic } from './types'

const MORSE_ID = 'international-morse-letters-printed'
const NOW = new Date('2026-09-17T20:00:00.000Z')

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
  if (!run) throw new Error('Expected Morse placement to start.')
  let guard = 0
  while (!run.complete && guard < 100) {
    run = correct(run)
    guard += 1
  }
  if (!run.complete) throw new Error('Placement did not finish within its bounded run.')
  return run
}

describe('Morse placement policy', () => {
  it('offers placement only at a genuinely fresh Morse start', () => {
    const topic = freshMorse()
    expect(canOfferMorsePlacement(topic)).toBe(true)

    const started = { ...topic, status: 'learning' as const, learningAt: NOW.toISOString() }
    expect(canOfferMorsePlacement(started)).toBe(false)
  })

  it('uses meaningfully different Some and Most strategies', () => {
    const topic = freshMorse()
    const some = startMorsePlacement(topic, 'some')
    const most = startMorsePlacement(topic, 'most')
    expect(some).not.toBeNull()
    expect(most).not.toBeNull()

    expect(some?.targets).toHaveLength(42)
    expect(most?.targets).toHaveLength(30)
    expect(some?.targets.slice(0, 4).map((target) => target.lesson)).toEqual([1, 1, 2, 2])
    expect(most?.targets.slice(0, 4).map((target) => target.lesson)).toEqual([1, 2, 3, 4])
  })

  it('treats one miss as uncertainty and rechecks after intervening prompts', () => {
    const topic = freshMorse()
    let run = startMorsePlacement(topic, 'some')!
    const first = currentMorsePlacementTarget(run)!

    run = answerMorsePlacement(run, first.pattern === undefined ? '----' : '----')
    expect(run.states[first.letter]?.status).toBe('uncertain')
    expect(run.targets[3]).toMatchObject({ letter: first.letter, retry: true })

    run = correct(run)
    run = correct(run)
    expect(currentMorsePlacementTarget(run)).toMatchObject({ letter: first.letter, retry: true })
    run = correct(run)

    expect(run.states[first.letter]?.status).toBe('pass')
    expect(run.complete).toBe(false)
  })

  it('stops Some at the earliest repeated weakness', () => {
    const topic = freshMorse()
    let run = startMorsePlacement(topic, 'some')!
    const weak = currentMorsePlacementTarget(run)!.letter
    let guard = 0

    while (!run.complete && guard < 20) {
      const target = currentMorsePlacementTarget(run)!
      run = answerMorsePlacement(
        run,
        target.letter === weak ? '----' : expectedMorsePlacementPattern(target),
      )
      guard += 1
    }

    expect(run.complete).toBe(true)
    expect(run.result).toMatchObject({ throughLesson: 0, nextLesson: 1 })
  })

  it('places a Some learner after the last fully demonstrated lesson', () => {
    const topic = freshMorse()
    let run = startMorsePlacement(topic, 'some')!
    const lesson3Weak = run.lessons[2].letters[0]
    let guard = 0

    while (!run.complete && guard < 30) {
      const target = currentMorsePlacementTarget(run)!
      run = answerMorsePlacement(
        run,
        target.letter === lesson3Weak ? '----' : expectedMorsePlacementPattern(target),
      )
      guard += 1
    }

    expect(run.result).toMatchObject({ throughLesson: 2, nextLesson: 3 })
  })

  it('does not let later Most successes compensate for an early repeated gap', () => {
    const topic = freshMorse()
    let run = startMorsePlacement(topic, 'most')!
    const earlyWeak = run.lessons[0].letters[0]
    let guard = 0

    while (!run.complete && guard < 100) {
      const target = currentMorsePlacementTarget(run)!
      run = answerMorsePlacement(
        run,
        target.letter === earlyWeak ? '----' : expectedMorsePlacementPattern(target),
      )
      guard += 1
    }

    expect(run.result).toMatchObject({ throughLesson: 0, nextLesson: 1 })
    expect(run.promptCount).toBeLessThanOrEqual(31)
  })

  it('can place a perfect experienced learner through all 13 lessons', () => {
    const run = perfect(freshMorse(), 'most')
    expect(run.result).toMatchObject({ throughLesson: 13, nextLesson: null })
    expect(run.promptCount).toBe(30)
    expect(run.retries).toBe(0)
  })
})

describe('Morse placement application', () => {
  it('marks only the contiguous prerequisite prefix settled and creates no Test evidence', () => {
    const topic = freshMorse()
    const run = perfect(topic, 'some')
    const result = { ...run.result!, throughLesson: 2, nextLesson: 3, verifiedLetters: run.lessons.slice(0, 2).flatMap((lesson) => lesson.letters) }
    const applied = applyMorsePlacement(topic, result, NOW)

    expect(applied.status).toBe('learning')
    expect(applied.learningAt).toBe(NOW.toISOString())
    expect(Object.values(applied.lessonProgress ?? {}).filter((support) => support === 'settled')).toHaveLength(4)
    expect(applied.acquisitionReadyAt).toBeUndefined()
    expect(applied.itemEvidence).toEqual(topic.itemEvidence)
    expect(applied.history).toEqual([])
    expect(applied.lastTestedAt).toBeNull()
    expect(canOfferMorsePlacement(applied)).toBe(false)
  })

  it('full placement reaches acquisition readiness without banking formal completion', () => {
    const topic = freshMorse()
    const run = perfect(topic, 'most')
    const applied = applyMorsePlacement(topic, run.result!, NOW)
    const position = morseAcquisitionPosition(applied)

    expect(position?.settled).toBe(26)
    expect(position?.ready).toBe(true)
    expect(applied.acquisitionReadyAt).toBe(NOW.toISOString())
    expect(applied.status).toBe('learning')
    expect(applied.drilledAt).toBeNull()
    expect(applied.completedAt).toBeNull()
    expect(applied.history).toEqual([])
    expect(applied.itemEvidence).toEqual(topic.itemEvidence)
  })
})
