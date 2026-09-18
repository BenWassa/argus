// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SHIPPED_CATALOG_TOPIC_IDS } from '../../../domain/library/catalog'
import { seedLibrary } from '../../../domain/library/catalogSeed'
import type { Topic } from '../../../domain/library/topic'
import { parseLibrary } from '../../../infrastructure/persistence/libraryParser'
import { LibraryProvider } from '../../../services/library/LibraryProvider'
import { LessonRun } from './LessonRun'

const STORE_KEY = 'argus.library.v5'
const MORSE_ID = 'international-morse-letters-printed'

function freshMorse(): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((candidate) => candidate.id === MORSE_ID)
  if (!topic) throw new Error('Missing Morse topic.')
  return {
    ...topic,
    status: 'unstarted',
    learningAt: null,
    history: [],
    itemEvidence: {},
    lessonProgress: {},
    lessonSitting: undefined,
    morseReview: undefined,
    acquisitionReadyAt: undefined,
  }
}

function install(topic: Topic) {
  localStorage.setItem(
    STORE_KEY,
    JSON.stringify({
      version: 5,
      topics: [topic],
      catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS],
    }),
  )
}

function renderLesson() {
  render(
    <LibraryProvider>
      <LessonRun
        topicId={MORSE_ID}
        target={{ kind: 'lesson' }}
        onExit={vi.fn()}
        onCheck={vi.fn()}
        onReference={vi.fn()}
      />
    </LibraryProvider>,
  )
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('fresh Morse lesson boundary', () => {
  it('offers placement before constructing Lesson 1 from any launch surface', () => {
    install(freshMorse())
    renderLesson()

    expect(screen.getByRole('dialog', { name: 'Check your Morse level' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /New to Morse/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Know some Morse/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Know most Morse/i })).toBeTruthy()

    const stored = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as { topics?: Topic[] }
    const topic = stored.topics?.find((candidate) => candidate.id === MORSE_ID)
    expect(topic?.status).toBe('unstarted')
    expect(topic?.learningAt).toBeNull()
  })

  it('New to Morse records the decision and enters the canonical lesson without re-prompting', () => {
    install(freshMorse())
    renderLesson()

    fireEvent.click(screen.getByRole('button', { name: /New to Morse/i }))

    expect(screen.queryByRole('dialog', { name: 'Check your Morse level' })).toBeNull()
    const stored = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as { topics?: Topic[] }
    const topic = stored.topics?.find((candidate) => candidate.id === MORSE_ID)
    expect(topic?.status).toBe('learning')
    expect(topic?.learningAt).not.toBeNull()
  })

  it('does not offer placement after genuine Morse progress already exists', () => {
    const progressed = freshMorse()
    progressed.status = 'learning'
    progressed.learningAt = '2026-09-18T12:00:00.000Z'
    install(progressed)
    renderLesson()

    expect(screen.queryByRole('dialog', { name: 'Check your Morse level' })).toBeNull()
  })
})
