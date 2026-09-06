import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../../lib/seed'
import {
  SWIPE_COMMIT_MAX_PX,
  SWIPE_COMMIT_MIN_PX,
  SWIPE_FLICK_VELOCITY,
  isTokenRecallDeck,
  swipeCommitDistance,
  swipeCueStrength,
  swipeIntent,
} from './swipeGrade'

/** A release with nothing happening, to be overridden one property at a time. */
function release(over: Partial<Parameters<typeof swipeIntent>[0]> = {}) {
  return { offsetX: 0, offsetY: 0, velocityX: 0, velocityY: 0, width: 390, ...over }
}

const PHONE = 390
const commit = swipeCommitDistance(PHONE)

describe('the commit distance', () => {
  it('scales with the card but never leaves the usable band', () => {
    expect(swipeCommitDistance(320)).toBeGreaterThanOrEqual(SWIPE_COMMIT_MIN_PX)
    expect(swipeCommitDistance(320)).toBeLessThan(swipeCommitDistance(PHONE))
    expect(swipeCommitDistance(1280)).toBe(SWIPE_COMMIT_MAX_PX)
    // A short-landscape card and an unmeasured one still ask for a real gesture.
    expect(swipeCommitDistance(0)).toBeGreaterThanOrEqual(SWIPE_COMMIT_MIN_PX)
    expect(swipeCommitDistance(Number.NaN)).toBeGreaterThanOrEqual(SWIPE_COMMIT_MIN_PX)
  })

  it('is a real gesture on the smallest supported phone', () => {
    expect(swipeCommitDistance(320)).toBeGreaterThan(60)
  })
})

describe('a deliberate drag commits in the direction it went', () => {
  it('reads left as incorrect and right as correct', () => {
    expect(swipeIntent(release({ offsetX: -commit }))).toBe('incorrect')
    expect(swipeIntent(release({ offsetX: commit }))).toBe('correct')
    expect(swipeIntent(release({ offsetX: -400 }))).toBe('incorrect')
    expect(swipeIntent(release({ offsetX: 400 }))).toBe('correct')
  })

  it('commits a fast flick without asking for the full travel', () => {
    expect(swipeIntent(release({ offsetX: 40, velocityX: SWIPE_FLICK_VELOCITY }))).toBe('correct')
    expect(swipeIntent(release({ offsetX: -40, velocityX: -SWIPE_FLICK_VELOCITY }))).toBe('incorrect')
  })

  it('commits a slow drag that went far enough, with no velocity at all', () => {
    expect(swipeIntent(release({ offsetX: commit + 1, velocityX: 0 }))).toBe('correct')
  })
})

describe('an ambiguous release scores nothing', () => {
  it('ignores a card that barely moved', () => {
    expect(swipeIntent(release())).toBeNull()
    expect(swipeIntent(release({ offsetX: 6 }))).toBeNull()
    expect(swipeIntent(release({ offsetX: -(commit - 1) }))).toBeNull()
  })

  it('ignores a flick too slow or too short to be a flick', () => {
    expect(swipeIntent(release({ offsetX: 40, velocityX: SWIPE_FLICK_VELOCITY - 1 }))).toBeNull()
    expect(swipeIntent(release({ offsetX: 10, velocityX: 3000 }))).toBeNull()
  })

  it('ignores a card thrown out and released on the way back', () => {
    // Travelled right, but moving left hard at the moment of release.
    expect(swipeIntent(release({ offsetX: 40, velocityX: -2000 }))).toBeNull()
  })
})

describe('vertical movement is the page, not a grade', () => {
  it('refuses a mostly vertical drag however far sideways it drifted', () => {
    expect(swipeIntent(release({ offsetX: -commit, offsetY: -300 }))).toBeNull()
    expect(swipeIntent(release({ offsetX: commit, offsetY: 300 }))).toBeNull()
    expect(swipeIntent(release({ offsetX: 200, offsetY: 400 }))).toBeNull()
  })

  it('refuses a fast vertical flick that carried some sideways travel', () => {
    expect(
      swipeIntent(release({ offsetX: 40, offsetY: 200, velocityX: 900, velocityY: 3000 })),
    ).toBeNull()
  })

  it('still commits a diagonal that is clearly horizontal', () => {
    expect(swipeIntent(release({ offsetX: commit + 20, offsetY: 30 }))).toBe('correct')
  })
})

describe('the drag cue', () => {
  it('is neutral at rest and saturates in the direction of travel', () => {
    expect(swipeCueStrength(0)).toBe(0)
    expect(swipeCueStrength(-1000)).toBe(-1)
    expect(swipeCueStrength(1000)).toBe(1)
    expect(swipeCueStrength(-24)).toBeLessThan(0)
    expect(swipeCueStrength(24)).toBeGreaterThan(0)
  })
})

describe('which decks grade by swipe alone', () => {
  const topics = seedLibrary().topics

  function topic(id: string) {
    const found = topics.find((candidate) => candidate.id === id)
    if (!found) throw new Error(`no seeded topic ${id}`)
    return found
  }

  it('takes the token-recall decks', () => {
    expect(isTokenRecallDeck(topic('nato-phonetic').items)).toBe(true)
    expect(isTokenRecallDeck(topic('primary-survey').items)).toBe(true)
    expect(isTokenRecallDeck(topic('cardinal-bearings').items)).toBe(true)
  })

  it('leaves a long-answer procedural deck its visible buttons', () => {
    expect(isTokenRecallDeck(topic('ooda-loop').items)).toBe(false)
  })

  it('is decided by content, not by topic id', () => {
    expect(isTokenRecallDeck([{ prompt: 'A', answer: 'Alfa' }])).toBe(true)
    expect(
      isTokenRecallDeck([
        { prompt: 'A', answer: 'Alfa' },
        { prompt: 'Stage 1 — name and core function', answer: 'Observe — notice things.' },
      ]),
    ).toBe(false)
    expect(isTokenRecallDeck([])).toBe(false)
  })
})
