// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { parseLibrary } from '../../../infrastructure/persistence/libraryParser'
import { seedLibrary } from '../../../domain/library/catalogSeed'
import type { Topic } from '../../../domain/library/topic'
import { LibraryProvider } from '../../../services/library/LibraryProvider'
import { MORSE_LETTERS } from '../../../domain/morse/code'
import { spokenRhythm } from '../../../domain/morse/mnemonics'
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

function topicWithLetters(letters: string[]): Topic {
  const base = preparedTopic(false)
  const progress: Record<string, 'settled'> = {}
  for (const letter of letters) {
    const item = base.items.find((candidate) => candidate.prompt === letter)
    if (!item?.id) throw new Error(`The ${letter} item is missing an id.`)
    progress[item.id] = 'settled'
  }
  return { ...base, lessonProgress: progress }
}

function storeTopic(topic: Topic) {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...parsed.library,
    topics: parsed.library.topics.map((candidate) => candidate.id === topic.id ? topic : candidate),
  }))
}

function renderSurface(onExit = vi.fn(), direction?: 'read' | 'listen') {
  render(<LibraryProvider><LetterPracticeSurface topicId={MORSE_ID} direction={direction} onExit={onExit} /></LibraryProvider>)
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

  it('persists Read answers only in the separate recognition record', () => {
    storeTopic(topicWithLetters(['E', 'T', 'I', 'M']))
    renderSurface(vi.fn(), 'read')
    const before = JSON.parse(localStorage.getItem(STORAGE_KEY)!).topics.find((topic: Topic) => topic.id === MORSE_ID)
    expect(screen.getAllByRole('button', { name: /^Letter [A-Z]$/ })).toHaveLength(4)
    const rhythm = screen.getByRole('img', { name: /^(dit|dah)/ }).getAttribute('aria-label')
    const target = (['E', 'T', 'I', 'M'] as const).find((letter) => spokenRhythm(MORSE_LETTERS[letter]) === rhythm)!
    fireEvent.click(screen.getByRole('button', { name: `Letter ${target}` }))
    const after = JSON.parse(localStorage.getItem(STORAGE_KEY)!).topics.find((topic: Topic) => topic.id === MORSE_ID)

    expect(after.morseRecognition.streams['read/practice'].characters[target].outcomes).toEqual([true])
    expect(after.morsePractice).toBeUndefined()
    expect({ ...after, morseRecognition: undefined }).toEqual({ ...before, morseRecognition: undefined })
  })

  it('keeps Speed as a bounded variant: its own stream, no Test or completion evidence', () => {
    storeTopic(topicWithLetters(['E', 'T', 'I', 'M']))
    renderSurface(vi.fn(), 'read')
    const before = JSON.parse(localStorage.getItem(STORAGE_KEY)!).topics.find((topic: Topic) => topic.id === MORSE_ID)
    fireEvent.click(screen.getByRole('button', { name: 'Speed' }))
    const rhythm = screen.getByRole('img', { name: /^(dit|dah)/ }).getAttribute('aria-label')
    const target = (['E', 'T', 'I', 'M'] as const).find((letter) => spokenRhythm(MORSE_LETTERS[letter]) === rhythm)!
    fireEvent.click(screen.getByRole('button', { name: `Letter ${target}` }))
    const after = JSON.parse(localStorage.getItem(STORAGE_KEY)!).topics.find((topic: Topic) => topic.id === MORSE_ID)

    expect(Object.keys(after.morseRecognition.streams)).toEqual(['read/speed'])
    for (const field of ['itemEvidence', 'history', 'lessonProgress', 'status', 'completedAt', 'lastTestedAt', 'acquisitionReadyAt', 'morseFluency']) {
      expect(after[field], field).toEqual(before[field])
    }
  })
})
