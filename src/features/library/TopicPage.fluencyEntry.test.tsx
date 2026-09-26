// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SHIPPED_CATALOG_TOPIC_IDS } from '../../domain/library/catalog'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../domain/library/topic'
import type { Mode } from '../../domain/study/mode'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { LibraryProvider, useLibrary } from '../../services/library/LibraryProvider'
import type { RunTarget } from '../../app/routing/routes'
import type { ItemLessonStore } from '../../domain/morse/progress'
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
      onDelete={() => undefined}
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
      onDelete={() => undefined}
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

const fluency = () => screen.queryByRole('button', { name: /Copy and speed practice|Keep going/ })
const keepGoing = () => screen.queryByRole('button', { name: /Keep going/ })
const quickReview = () => screen.queryByRole('button', { name: /Quick review/ })

beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('the Fluency entry', () => {
  it('is absent before the alphabet is acquired', () => {
    open(morse({}))
    expect(fluency()).toBeNull()
  })

  it('appears once the acquisition anchor is recorded', () => {
    open(morse({ acquisitionReadyAt: '2026-02-01T00:00:00.000Z' }))
    expect(fluency()).toBeTruthy()
  })

  /**
   * The regression this file exists for.
   *
   * `acquisitionReadyAt` postdates the programme, so a learner who finished
   * the alphabet before the field existed has every letter settled and no
   * timestamp. Gating on the raw field hid Fluency from exactly the learner it
   * was built for — the one who has already finished. `journeyFor` resolves
   * the derived and stored answers into one, and that is what the page reads.
   */
  it('appears for a finished learner whose record predates the anchor', () => {
    open(morse({ lessonProgress: allSettled(), acquisitionReadyAt: undefined }))
    expect(fluency()).toBeTruthy()
  })

  it('launches a fluency run on the topic', () => {
    const onStart = open(morse({ lessonProgress: allSettled() }))
    fireEvent.click(fluency()!)
    expect(onStart).toHaveBeenCalledWith('learn', [MORSE_ID], { kind: 'fluency' })
  })

  it('stays text weight while a scheduled check is due, because only the check can earn', () => {
    open(morse({ lessonProgress: allSettled() }))
    expect(fluency()!.className).toContain('topic-alt')
    expect(keepGoing()).toBeNull()
    expect(screen.getByRole('button', { name: /^Test/ }).className).toContain('topic-primary')
  })

  it('leads between checks, and the Test becomes a quick review of weak letters', () => {
    // Acquisition finished just now: the one-day gap has not passed, so no
    // check is due and a full Test could move nothing.
    const onStart = open(morse({ status: 'completed', completedAt: new Date().toISOString(), acquisitionReadyAt: new Date().toISOString() }))
    expect(keepGoing()!.className).toContain('topic-primary')
    expect(keepGoing()!.textContent).toContain('Next: letters')

    fireEvent.click(keepGoing()!)
    expect(onStart).toHaveBeenLastCalledWith('learn', [MORSE_ID], { kind: 'fluency' })

    expect(quickReview()!.className).toContain('topic-alt')
    fireEvent.click(quickReview()!)
    expect(onStart).toHaveBeenLastCalledWith('test', [MORSE_ID])
  })

  it('names the next copy level from the learner\'s own bests', () => {
    open(
      morse({
        status: 'completed', completedAt: new Date().toISOString(),
        acquisitionReadyAt: new Date().toISOString(),
        morseFluency: { rung: 6, characters: {}, bests: { 'copy:letters': 95, 'copy:common': 91 } },
      }),
    )
    expect(keepGoing()!.textContent).toContain('Next: everyday words')
  })

  it('stays absent for a topic that is not the course, even once completed', () => {
    const parsed = parseLibrary(seedLibrary())
    if (!parsed.ok) throw new Error(parsed.error)
    const nato = parsed.library.topics.find((topic) => topic.id === 'nato-phonetic')
    if (!nato) throw new Error('Missing NATO topic.')
    const completed: Topic = {
      ...nato,
      status: 'completed',
      learningAt: '2026-01-01T00:00:00.000Z',
      drilledAt: '2026-01-10T00:00:00.000Z',
      completedAt: '2026-02-01T00:00:00.000Z',
      acquisitionReadyAt: '2026-02-01T00:00:00.000Z',
    }
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ version: 5, topics: [completed], catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS] }),
    )
    render(
      <LibraryProvider>
        <NatoHarness />
      </LibraryProvider>,
    )
    // The page rendered — this is a real assertion about an ordinary topic,
    // not a vacuously empty tree.
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(fluency()).toBeNull()
  })
})
