// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { parseLibrary } from '../../../infrastructure/persistence/libraryParser'
import { seedLibrary } from '../../../domain/library/catalogSeed'
import type { Topic } from '../../../domain/library/topic'
import { LibraryProvider } from '../../../services/library/LibraryProvider'
import { LetterPracticeSurface } from './LetterPracticeSurface'

vi.mock('../input/MorseKeyInput', () => ({
  MorseKeyInput: ({ onSubmit }: { onSubmit: (pattern: string) => void }) => <button onClick={() => onSubmit('.')}>Key correct</button>,
}))

vi.mock('../useMorseAudio', () => ({
  useMorseAudio: () => ({ sounding: null, audioError: null, clearError: vi.fn(), play: vi.fn(), stop: vi.fn(), toggle: vi.fn() }),
}))

const STORAGE_KEY = 'argus.library.v5'
const MORSE_ID = 'international-morse-letters-printed'

afterEach(() => { cleanup(); localStorage.clear() })

function preparedTopic(settled: boolean): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const seeded = parsed.library.topics.find((topic) => topic.id === MORSE_ID)
  if (!seeded) throw new Error('The Morse topic is missing from the seed.')
  const e = seeded.items.find((item) => item.prompt === 'E')
  if (!e?.id) throw new Error('The E item is missing an id.')
  return {
    ...seeded,
    ...(settled ? { lessonProgress: { [e.id]: 'settled' as const } } : {}),
  }
}

function storeTopic(topic: Topic) {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...parsed.library,
    topics: parsed.library.topics.map((candidate) => candidate.id === topic.id ? topic : candidate),
  }))
}

function renderSurface(onExit = vi.fn()) {
  render(<LibraryProvider><LetterPracticeSurface topicId={MORSE_ID} onExit={onExit} /></LibraryProvider>)
  return onExit
}

describe('LetterPracticeSurface', () => {
  it('starts on Lesson 1\'s letters when none are settled, instead of locking (#257)', () => {
    storeTopic(preparedTopic(false))
    const onExit = renderSurface()
    expect(screen.queryByRole('heading', { name: 'Learn letters first' })).toBeNull()
    expect(['E', 'I']).toContain(document.querySelector('.lesson-glyph')?.textContent)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onExit).toHaveBeenCalledOnce()
  })

  it('persists only formative practice when a learner answers', () => {
    storeTopic(preparedTopic(true))
    renderSurface()
    const before = JSON.parse(localStorage.getItem(STORAGE_KEY)!).topics.find((topic: Topic) => topic.id === MORSE_ID)
    fireEvent.click(screen.getByRole('button', { name: 'Key correct' }))
    const after = JSON.parse(localStorage.getItem(STORAGE_KEY)!).topics.find((topic: Topic) => topic.id === MORSE_ID)

    expect(after.morsePractice.characters.key.E.outcomes).toEqual([true])
    expect({ ...after, morsePractice: undefined }).toEqual({ ...before, morsePractice: undefined })
  })
})
