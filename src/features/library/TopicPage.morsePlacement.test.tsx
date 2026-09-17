// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SHIPPED_CATALOG_TOPIC_IDS } from '../../lib/catalog'
import { LibraryProvider, useLibrary } from '../../lib/store'
import { seedLibrary } from '../../lib/seed'
import { parseLibrary } from '../../lib/storage'
import type { Mode, Topic } from '../../lib/types'
import type { RunTarget } from '../../lib/navigation'
import { TopicPage } from './TopicPage'

const STORE_KEY = 'argus.library.v5'
const MORSE_ID = 'international-morse-letters-printed'

function freshMorse(): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const seeded = parsed.library.topics.find((topic) => topic.id === MORSE_ID)
  if (!seeded) throw new Error('Missing Morse topic.')
  return {
    ...seeded,
    status: 'unstarted',
    learningAt: null,
    drilledAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
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

function Harness({
  onStart,
}: {
  onStart: (mode: Mode, topicIds: string[], target?: RunTarget) => void
}) {
  const { topics } = useLibrary()
  const topic = topics.find((candidate) => candidate.id === MORSE_ID)
  if (!topic) return null
  return (
    <TopicPage
      topic={topic}
      onBack={() => undefined}
      onStart={onStart}
      onReference={() => undefined}
      onEdit={() => undefined}
      onDelete={() => undefined}
    />
  )
}

function renderFresh(onStart = vi.fn()) {
  install(freshMorse())
  render(
    <LibraryProvider>
      <Harness onStart={onStart} />
    </LibraryProvider>,
  )
  return onStart
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('fresh Morse placement entry', () => {
  it('offers exactly New, Some and Most before the first lesson starts', () => {
    renderFresh()
    fireEvent.click(screen.getByRole('button', { name: /start lesson/i }))

    expect(screen.getByRole('dialog', { name: 'Check your Morse level' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /New to Morse/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Know some Morse/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Know most Morse/i })).toBeTruthy()
    expect(screen.getAllByRole('button').filter((button) => /Morse$/.test(button.textContent ?? ''))).toHaveLength(3)
  })

  it('New to Morse bypasses placement and launches the canonical lesson run', () => {
    const onStart = renderFresh()
    fireEvent.click(screen.getByRole('button', { name: /start lesson/i }))
    fireEvent.click(screen.getByRole('button', { name: /New to Morse/i }))

    expect(onStart).toHaveBeenCalledWith('learn', [MORSE_ID], { kind: 'lesson' })
    expect(screen.queryByRole('dialog', { name: 'Check your Morse level' })).toBeNull()
  })

  it('closing the assessment before a result leaves learner progress untouched', () => {
    renderFresh()
    fireEvent.click(screen.getByRole('button', { name: /start lesson/i }))
    fireEvent.click(screen.getByRole('button', { name: /Know some Morse/i }))
    expect(screen.getByRole('dialog', { name: 'Morse placement check' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Exit placement check' }))

    const stored = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as { topics?: Topic[] }
    const topic = stored.topics?.find((candidate) => candidate.id === MORSE_ID)
    expect(topic?.status).toBe('unstarted')
    expect(topic?.learningAt).toBeNull()
    expect(topic?.lessonProgress).toEqual({})
    expect(topic?.history).toEqual([])
  })

  it('does not re-offer placement once real Morse progress exists', () => {
    const progressed = freshMorse()
    progressed.status = 'learning'
    progressed.learningAt = new Date().toISOString()
    install(progressed)
    const onStart = vi.fn()
    render(
      <LibraryProvider>
        <Harness onStart={onStart} />
      </LibraryProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /continue lesson/i }))

    expect(screen.queryByRole('dialog', { name: 'Check your Morse level' })).toBeNull()
    expect(onStart).toHaveBeenCalledWith('learn', [MORSE_ID], { kind: 'lesson' })
  })
})
