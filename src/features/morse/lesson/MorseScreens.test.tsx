// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lessonPackets, startLesson, type LessonRun } from '../../../domain/morse/curriculum/lesson'
import { morseLessonPath } from '../../../domain/morse/curriculum/lessonPath'
import { morseWordCheckpointPath } from '../../../domain/morse/curriculum/checkpoints'
import { LibraryProvider } from '../../../services/library/LibraryProvider'
import { parseLibrary } from '../../../infrastructure/persistence/libraryParser'
import { saveLibrary } from '../../../infrastructure/persistence/localLibraryRepository'
import { seedLibrary } from '../../../domain/library/catalogSeed'
import { TopicPage } from '../../library/TopicPage'
import type { Topic } from '../../../domain/library/topic'
import type { ItemLessonStore } from '../../../domain/morse/progress'
import { MorseLesson } from './MorseLesson'
import { MorsePath } from './MorsePath'

/**
 * The Morse screens review: four findings from driving the real app at phone
 * width across a fresh, a mid-course and a finished learner.
 *
 * Each of these was a screen doing something other than what the learner came
 * for — content that rendered nowhere, an explanation repeated twenty-six
 * times, a third of the display left empty under the control being pressed,
 * and a curriculum that opened several rows above the one it should have.
 */

const MORSE_ID = 'international-morse-letters-printed'

function fakeStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => void values.delete(key),
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

function seededTopic(): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((candidate) => candidate.id === MORSE_ID)
  if (!topic) throw new Error(`Missing seeded topic ${MORSE_ID}`)
  return topic
}

function itemIdForGlyph(value: Topic, glyph: string): string {
  const item = value.items.find((candidate) => candidate.prompt === glyph)
  if (!item?.id) throw new Error(`Missing item for ${glyph}.`)
  return item.id
}

function settledThrough(value: Topic, lessons: number): Topic {
  const progress: ItemLessonStore = {}
  for (const packet of lessonPackets().slice(0, lessons)) {
    for (const glyph of packet.characters) progress[itemIdForGlyph(value, glyph)] = 'settled'
  }
  return {
    ...value,
    status: lessons === 0 ? 'unstarted' : 'learning',
    learningAt: lessons === 0 ? null : '2026-09-01T09:00:00.000Z',
    lessonProgress: progress,
  }
}

function seedStore(value: Topic): void {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  saveLibrary({
    ...parsed.library,
    topics: parsed.library.topics.map((candidate) => (candidate.id === value.id ? value : candidate)),
  })
}

function renderLesson(topic: Topic, onPlay?: () => void) {
  seedStore(topic)
  return render(
    <LibraryProvider>
      <MorseLesson
        topic={topic}
        initialRun={startLesson(topic) as LessonRun}
        onExit={vi.fn()}
        onTest={vi.fn()}
        onReference={vi.fn()}
        onPlay={onPlay}
      />
    </LibraryProvider>,
  )
}

function renderTopic(topic: Topic) {
  seedStore(topic)
  return render(
    <LibraryProvider>
      <TopicPage
        topic={topic}
        onBack={vi.fn()}
        onStart={vi.fn()}
        onReference={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    </LibraryProvider>,
  )
}

function renderPath(topic: Topic) {
  return render(
    <MorsePath
      path={morseLessonPath(topic)!}
      checkpoints={morseWordCheckpointPath(topic)!}
      ready={false}
      onLesson={vi.fn()}
      onCheckpoint={vi.fn()}
      onCheck={vi.fn()}
    />,
  )
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: fakeStorage(), configurable: true })
})

afterEach(cleanup)

describe('the course keeps rationale on its reference page', () => {
  it('shows lessons without course notes on the topic page', () => {
    renderTopic(settledThrough(seededTopic(), 4))
    expect(screen.getByRole('button', { name: 'A–Z reference' })).toBeTruthy()
    expect(document.querySelector('.morse-path')).toBeTruthy()
    expect(document.querySelector('.learn-support')).toBeNull()
    expect(document.querySelector('details, summary')).toBeNull()
    expect(screen.queryByText('How this course works')).toBeNull()
    expect(screen.queryByText('How the lesson works')).toBeNull()
  })
})

describe('the mark grammar is explained at first meeting, not every time', () => {
  it('keeps the notation lecture off the session', () => {
    renderLesson(settledThrough(seededTopic(), 0))
    expect(document.querySelector('.lesson-grammar')).toBeNull()
    expect(document.body.textContent).not.toContain('ZOOM ZOOM ZIP ZIP')
  })

  it('is gone by the time the learner has met a lesson’s worth of letters', () => {
    renderLesson(settledThrough(seededTopic(), 2))
    // Still an introduction — the mnemonic, the glyph and the sound are all
    // here. Only the notation lecture has stopped.
    expect(screen.getByText('New letter')).toBeTruthy()
    expect(document.querySelector('.morse-phrase')).toBeTruthy()
    expect(document.querySelector('.lesson-grammar')).toBeNull()
  })
})

describe('a retrieval screen uses the screen it is given', () => {
  it('marks the step so the task can be centred in the height it is given', () => {
    renderLesson(settledThrough(seededTopic(), 0))
    const section = document.querySelector('.morse-lesson')!
    expect(section.getAttribute('data-step')).toBe('introduce')
  })

  it('leaves the terminal screens packed at the top, where they belong', () => {
    // Every letter settled: the lesson is finished, not asking for anything.
    renderLesson(settledThrough(seededTopic(), lessonPackets().length))
    const section = document.querySelector('.morse-lesson')!
    expect(section.hasAttribute('data-step')).toBe(false)
    expect(screen.getByText('Every letter covered')).toBeTruthy()
  })
})

describe('the final Learn screen hands off to play (#201)', () => {
  it('offers sending beside Test, without claiming the alphabet is proved', () => {
    const onPlay = vi.fn()
    renderLesson(settledThrough(seededTopic(), lessonPackets().length), onPlay)
    expect(screen.getByRole('button', { name: 'Test me' })).toBeTruthy()
    expect(screen.getByText('Every letter covered')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Send five words' }))
    expect(onPlay).toHaveBeenCalledTimes(1)
  })

  it('stays absent when no play route is supplied', () => {
    renderLesson(settledThrough(seededTopic(), lessonPackets().length))
    expect(screen.queryByRole('button', { name: 'Send five words' })).toBeNull()
  })
})

describe('the curriculum opens on where the learner actually is', () => {
  it('keeps the finished run visible above the current lesson', () => {
    renderPath(settledThrough(seededTopic(), 5))
    expect(document.querySelector('details, summary')).toBeNull()
    expect(document.querySelectorAll('.morse-path-lesson')).toHaveLength(lessonPackets().length)
    expect(screen.getByRole('button', { name: 'Replay lesson 1' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Continue lesson 6' })).toBeTruthy()
  })

  it('keeps every finished lesson replayable, and its checkpoint with it', () => {
    renderPath(settledThrough(seededTopic(), 9))

    expect(screen.getByRole('button', { name: /^Replay lesson 1$/ })).toBeTruthy()
    // Finished checkpoints remain available alongside their lessons.
    expect(
      screen.getByRole('button', { name: 'Start word checkpoint after lesson 4' }),
    ).toBeTruthy()
  })

  it('shows the entire path before and after course acquisition', () => {
    renderPath(settledThrough(seededTopic(), 5))
    expect(document.querySelectorAll('.morse-path-item.is-locked').length).toBeGreaterThan(0)
    cleanup()
    renderPath(settledThrough(seededTopic(), lessonPackets().length))
    expect(document.querySelector('details, summary')).toBeNull()
    expect(document.querySelectorAll('.morse-path-lesson')).toHaveLength(lessonPackets().length)
    expect(document.querySelector('.morse-path-check button')).toBeTruthy()
  })

  it('states the checkpoint’s nature once rather than on all four rows', () => {
    renderPath(settledThrough(seededTopic(), lessonPackets().length))
    expect(screen.getAllByText('Checkpoint')).toHaveLength(4)
    expect(screen.getAllByText('Real words, letters you know')).toHaveLength(1)
  })
})
