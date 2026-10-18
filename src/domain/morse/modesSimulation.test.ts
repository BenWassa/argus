import { describe, expect, it, vi } from 'vitest'
import type { Topic } from '../library/topic'
import { modeTopicFixtures, morseTopic } from './__fixtures__/modeTopics'
import { morseProgressPath } from './curriculum/progressPath'
import { recordFluencyBest, newFluencyProgress } from './fluency/progress'
import { MORSE_MODES, currentLevel, modeEntry, modeEligibleLetters } from './modes'
import { newMorsePractice, recordPracticeOutcome, selectPracticeLetter, type PracticeDirection } from './practice'

/** Simulate independent presentations and grades through the real formative engine. */
function practise(topic: Topic, direction: PracticeDirection, weak = false): Topic {
  let progress = topic.morsePractice ?? newMorsePractice()
  for (let pass = 0; pass < 5; pass += 1) {
    for (const glyph of modeEligibleLetters(topic)) {
      const selected = selectPracticeLetter(progress, direction, [glyph], { rng: () => 0.5 })
      progress = recordPracticeOutcome(selected.progress, direction, glyph, !(weak && glyph === 'Q'))
    }
  }
  return { ...topic, morsePractice: progress }
}

function projection(topic: Topic) {
  return { levels: MORSE_MODES.map(({ id }) => currentLevel(topic, id)),
    entries: MORSE_MODES.map(({ id }) => modeEntry(topic, id)), path: morseProgressPath(topic) }
}

function freeze(value: unknown) {
  if (!value || typeof value !== 'object') return
  Object.freeze(value)
  for (const child of Object.values(value)) freeze(child)
}

describe('Morse mode learner simulations', () => {
  it('routes different answer histories to different levels independently by direction', () => {
    const fresh = morseTopic()
    expect(currentLevel(fresh, 'key')?.id).toBe('letters')
    expect(modeEntry(fresh, 'key')).toBeNull()
    const initial = morseTopic(13)
    const confident = practise(practise(initial, 'key'), 'listen')
    const weak = practise(initial, 'key', true)
    expect(currentLevel(confident, 'key')?.id).toBe('send:words')
    expect(currentLevel(confident, 'listen')?.id).toBe('copy:common')
    expect(currentLevel(weak, 'key')?.id).toBe('letters')
    expect(currentLevel(weak, 'listen')?.id).toBe('letters')
    expect(currentLevel(confident, 'read')?.id).toBe('letters')
    const improved = { ...confident, morseFluency: recordFluencyBest(newFluencyProgress(), 'send:words', 90).progress }
    expect(currentLevel(improved, 'key')?.id).toBe('send:flow')
  })

  it('is identical at distant mocked dates and cannot call the Date constructor or Date.now', () => {
    const fixtures = { ...modeTopicFixtures(), practised: practise(morseTopic(13), 'listen') }
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('1990-01-01T00:00:00Z'))
      const early = Object.values(fixtures).map(projection)
      vi.setSystemTime(new Date('2090-01-01T00:00:00Z'))
      expect(Object.values(fixtures).map(projection)).toEqual(early)
      vi.stubGlobal('Date', class {
        constructor() { throw new Error('Domain projection read the clock.') }
        static now() { throw new Error('Domain projection read the clock.') }
      })
      expect(Object.values(fixtures).map(projection)).toEqual(early)
    } finally {
      vi.unstubAllGlobals()
      vi.useRealTimers()
    }
  })

  it('reads frozen records without mutation and formative sessions preserve every other topic field', () => {
    for (const original of Object.values(modeTopicFixtures())) {
      const before = structuredClone(original)
      freeze(original)
      projection(original)
      const practiced = practise(original, 'key')
      const advanced = { ...practiced, morseFluency: recordFluencyBest(practiced.morseFluency ?? newFluencyProgress(), 'send:words', 95).progress }
      projection(advanced)
      const { morsePractice: _practice, morseFluency: _fluency, ...formal } = advanced
      const { morsePractice: _oldPractice, morseFluency: _oldFluency, ...expected } = before
      expect(formal).toEqual(expected)
      expect(original).toEqual(before)
    }
  })
})
