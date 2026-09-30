import { describe, expect, it } from 'vitest'
import { parseLibrary } from '../../../infrastructure/persistence/libraryParser'
import { seedLibrary } from '../../library/catalogSeed'
import type { Topic } from '../../library/topic'
import { morseFocusLetters } from './focus'

function morse(): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  return parsed.library.topics.find((topic) => topic.id === 'international-morse-letters-printed')!
}

describe('the letters a learner is missing', () => {
  it('is empty for a learner who has missed nothing', () => {
    expect(morseFocusLetters(morse())).toEqual([])
  })

  it('names a letter whose last Test answer was wrong, once, in alphabet order', () => {
    const topic = morse()
    const [q, b] = ['Q', 'B'].map((glyph) => topic.items.find((item) => item.prompt === glyph)!)
    const missed = {
      attempts: 1, correct: 0, unassistedCorrect: 0, consecutiveCorrect: 0,
      lastAt: '2026-09-01T00:00:00.000Z', lastLatencyMs: 900,
    }
    const withMisses: Topic = {
      ...topic,
      itemEvidence: {
        [q.id!]: { cue: 'free', directions: { 'prompt-to-answer': missed } },
        [b.id!]: { cue: 'free', directions: { 'answer-to-prompt': missed } },
      },
    }
    expect(morseFocusLetters(withMisses)).toEqual(['B', 'Q'])
  })
})
