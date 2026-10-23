// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SHIPPED_CATALOG_TOPIC_IDS } from '../../domain/library/catalog'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../domain/library/topic'
import type { Mode } from '../../domain/study/mode'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { LibraryProvider, useLibrary } from '../../services/library/LibraryProvider'
import type { RunTarget } from '../../app/routing/routes'
import type { ItemLessonStore } from '../../domain/morse/progress'
import { lessonPackets } from '../../domain/morse/curriculum/lesson'
import { TopicPage } from './TopicPage'

const STORE_KEY = 'argus.library.v5'
const MORSE_ID = 'international-morse-letters-printed'

function seededMorse(): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const seeded = parsed.library.topics.find((topic) => topic.id === MORSE_ID)
  if (!seeded) throw new Error('Missing Morse topic.')
  return seeded
}

/** Every letter produced unaided: the alphabet is done. */
function allSettled(): ItemLessonStore {
  const store: ItemLessonStore = {}
  for (const item of seededMorse().items) if (item.id) store[item.id] = 'settled'
  return store
}

function morse(overrides: Partial<Topic>): Topic {
  return {
    ...seededMorse(),
    status: 'learning',
    learningAt: '2026-01-01T00:00:00.000Z',
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
    ...overrides,
  }
}

function Harness({ onStart }: { onStart: (mode: Mode, ids: string[], target?: RunTarget) => void }) {
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
    />
  )
}

/** The same page, pointed at an ordinary topic rather than the course. */
function NatoHarness() {
  const { topics } = useLibrary()
  const topic = topics.find((candidate) => candidate.id === 'nato-phonetic')
  if (!topic) return null
  return (
    <TopicPage
      topic={topic}
      onBack={() => undefined}
      onStart={vi.fn()}
      onReference={() => undefined}
      onEdit={() => undefined}
    />
  )
}

function open(topic: Topic, onStart = vi.fn()) {
  localStorage.setItem(
    STORE_KEY,
    JSON.stringify({ version: 5, topics: [topic], catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS] }),
  )
  render(
    <LibraryProvider>
      <Harness onStart={onStart} />
    </LibraryProvider>,
  )
  return onStart
}


beforeEach(() => localStorage.clear())
afterEach(() => { cleanup(); localStorage.clear() })

describe('one Morse topic screen', () => {
  it('opens fresh on Start, with every mode open and placement inside the Begin plate (#257)', () => {
    const onStart = open(morse({ status: 'unstarted', learningAt: null }))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('International Morse Code')
    expect(screen.getByRole('img', { name: '0 of 26 letters' })).toBeTruthy()
    for (const name of ['Key', 'Listen', 'Read', 'Free play']) {
      expect(screen.getByRole('button', { name }).hasAttribute('aria-disabled')).toBe(false)
    }
    fireEvent.click(screen.getByRole('button', { name: 'Key' }))
    expect(onStart).toHaveBeenLastCalledWith('learn', [MORSE_ID], { kind: 'letter-practice', direction: 'key' })
    fireEvent.click(screen.getByRole('button', { name: 'Free play' }))
    expect(onStart).toHaveBeenLastCalledWith('learn', [MORSE_ID], { kind: 'fluency', free: true })
    const skip = screen.getByRole('button', { name: 'Skip ahead' })
    expect(skip.closest('[data-node-id]')?.getAttribute('data-node-id')).toBe('start')
    expect(skip.closest('header')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Start, current' }))
    expect(onStart).toHaveBeenLastCalledWith('learn', [MORSE_ID], { kind: 'lesson' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('says in one line why a locked level or lesson cannot start, without a dialog', () => {
    const onStart = open(morse({ status: 'unstarted', learningAt: null }))
    fireEvent.click(screen.getByRole('button', { name: 'Words, Key, locked' }))
    expect(screen.getByRole('status').textContent).toBe('Learn a few more letters first')
    fireEvent.click(screen.getByRole('button', { name: /Lesson 2, .*locked/ }))
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status').textContent).toBe('After Lesson 1')
    expect(onStart).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('uses settled letters mid-course and starts the current lesson and reached word check', () => {
    const known = new Set(lessonPackets().slice(0, 4).flatMap(packet => packet.novel))
    const progress: ItemLessonStore = {}
    for (const item of seededMorse().items) if (item.id && known.has(item.prompt as never)) progress[item.id] = 'settled'
    const onStart = open(morse({ lessonProgress: progress }))
    expect(screen.getByRole('img', { name: '8 of 26 letters' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Lesson 5, .*current/ }))
    expect(onStart).toHaveBeenLastCalledWith('learn', [MORSE_ID], { kind: 'lesson' })
    fireEvent.click(screen.getByRole('button', { name: 'Words after Lesson 4, reached' }))
    expect(onStart).toHaveBeenLastCalledWith('learn', [MORSE_ID], { kind: 'checkpoint', afterLesson: 4 })
    fireEvent.click(screen.getByRole('button', { name: 'Read' }))
    expect(onStart).toHaveBeenLastCalledWith('learn', [MORSE_ID], { kind: 'letter-practice', direction: 'read' })
    expect(screen.queryByRole('button', { name: 'Skip ahead' })).toBeNull()
  })

  it('keeps a finished pre-anchor learner active with eight controls outside the path', () => {
    const onStart = open(morse({ lessonProgress: allSettled(), status: 'completed', completedAt: '2026-01-01T00:00:00Z' }))
    expect(screen.getByRole('img', { name: '26 of 26 letters' })).toBeTruthy()
    const controls = [...document.querySelectorAll('button')].filter(button => !button.closest('.morse-progress-path'))
    expect(controls).toHaveLength(8)
    expect(document.querySelector('.topic-action-bar, .topic-options, .topic-play, .topic-state, .topic-scope')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Curriculum' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /A–Z Test, available, reached/ }))
    expect(onStart).toHaveBeenLastCalledWith('test', [MORSE_ID])
    fireEvent.click(screen.getByRole('button', { name: /Lesson 1, E and I, done/ }))
    expect(onStart).toHaveBeenLastCalledWith('learn', [MORSE_ID], { kind: 'replay', index: 0 })
    fireEvent.click(screen.getByRole('button', { name: 'Words, Key, available' }))
    expect(onStart).toHaveBeenLastCalledWith('learn', [MORSE_ID], { kind: 'fluency', send: 'words' })
    fireEvent.click(screen.getByRole('button', { name: 'Free play' }))
    expect(onStart).toHaveBeenLastCalledWith('learn', [MORSE_ID], { kind: 'fluency', free: true })
  })

  it('pins a compact Morse header once the page is scrolled (#257)', () => {
    let report: IntersectionObserverCallback = () => {}
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { report = callback }
      observe() {}
      disconnect() {}
    })
    try {
      open(morse({}))
      const header = document.querySelector('.topic-morse-header')!
      expect(header.classList.contains('is-compact')).toBe(false)
      act(() => report([{ isIntersecting: false, boundingClientRect: { top: -40 } } as IntersectionObserverEntry], {} as IntersectionObserver))
      expect(header.classList.contains('is-compact')).toBe(true)
      // Title and n / 26 stay in the compact header.
      expect(header.querySelector('h1')?.textContent).toBe('International Morse Code')
      expect(header.querySelector('.screen-header-readout')?.textContent).toBe('0 / 26')
      act(() => report([{ isIntersecting: true, boundingClientRect: { top: 10 } } as IntersectionObserverEntry], {} as IntersectionObserver))
      expect(header.classList.contains('is-compact')).toBe(false)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('keeps the ordinary topic reference and its own tray', () => {
    render(<LibraryProvider><NatoHarness /></LibraryProvider>)
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Study' })).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'Course path' })).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Play' })).toBeNull()
  })

  it('offers early Test without writing progress merely by browsing', () => {
    const onStart = open(morse({}))
    const before = localStorage.getItem(STORE_KEY)
    const early = screen.getByRole('button', { name: 'Test early' })
    expect(early.closest('[data-node-id]')?.getAttribute('data-node-id')).toBe('test')
    fireEvent.click(early)
    expect(onStart).toHaveBeenCalledWith('test', [MORSE_ID])
    expect(localStorage.getItem(STORE_KEY)).toBe(before)
  })
})
