// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
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

function renderLesson(topic: Topic) {
  seedStore(topic)
  return render(
    <LibraryProvider>
      <MorseLesson
        topic={topic}
        initialRun={startLesson(topic) as LessonRun}
        onExit={vi.fn()}
        onTest={vi.fn()}
        onReference={vi.fn()}
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

describe('the course explains itself somewhere reachable', () => {
  it('renders the authored Morse support on the topic page instead of nowhere at all', () => {
    const topic = settledThrough(seededTopic(), 4)
    expect(topic.learn).toBeTruthy()
    renderTopic(topic)

    // It was written, shipped, and displayed on no surface: `LearnSupport` only
    // ever rendered in the ordinary-topic branch, which a curriculum never takes.
    const fold = screen.getByText('How this course works')
    expect(fold.tagName).toBe('SUMMARY')
    expect(document.querySelector('.learn-support')).toBeTruthy()
    expect(document.body.textContent).toContain('International Morse represents letters as')
    expect(document.body.textContent).toContain('How the lesson works')
  })

  it('keeps the mark grammar permanently available there', () => {
    renderTopic(settledThrough(seededTopic(), 4))
    expect(document.querySelector('.topic-course-grammar')).toBeTruthy()
    expect(document.body.textContent).toContain('ZOOM ZOOM ZIP ZIP')
  })

  it('folds it rather than pushing the curriculum down the page', () => {
    renderTopic(settledThrough(seededTopic(), 4))
    const details = document.querySelector('.topic-course-notes') as HTMLDetailsElement
    expect(details.tagName).toBe('DETAILS')
    expect(details.open).toBe(false)
    // The curriculum still comes first: the path is the reason for the page.
    const path = document.querySelector('.morse-path')!
    expect(path.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('the mark grammar is explained at first meeting, not every time', () => {
  it('appears while the notation is new', () => {
    renderLesson(settledThrough(seededTopic(), 0))
    expect(document.querySelector('.lesson-grammar')).toBeTruthy()
    expect(document.body.textContent).toContain('ZOOM ZOOM ZIP ZIP')
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
    expect(screen.getByText('You have been through every letter')).toBeTruthy()
  })
})

describe('the curriculum opens on where the learner actually is', () => {
  it('folds the finished run above the current lesson', () => {
    renderPath(settledThrough(seededTopic(), 5))

    const fold = document.querySelector('.morse-path-fold') as HTMLDetailsElement
    expect(fold).toBeTruthy()
    expect(fold.open).toBe(false)
    expect(screen.getByText(/Lessons 1–4 done/)).toBeTruthy()

    // The current lesson is now near the top rather than under five Replay rows.
    // Scoped to the outer list: the folded lessons keep their own rows inside it.
    const rows = [
      ...document.querySelectorAll('ol[aria-label="Morse curriculum"] > .morse-path-item'),
    ]
    const currentIndex = rows.findIndex((row) => row.classList.contains('is-current'))
    expect(currentIndex).toBeGreaterThan(-1)
    // Two rows now precede lesson 6: the fold and lesson 5. Unfolded it was
    // six, which put the row at 945px on an 844px phone; it now sits at 771.
    expect(currentIndex).toBe(2)
  })

  it('keeps every folded lesson replayable, and its checkpoint with it', () => {
    renderPath(settledThrough(seededTopic(), 9))

    expect(screen.getByRole('button', { name: /^Replay lesson 1$/ })).toBeTruthy()
    // The lesson-4 checkpoint sits inside the folded run and must travel with
    // it rather than vanishing from the page.
    expect(
      screen.getByRole('button', { name: 'Start word checkpoint after lesson 4' }),
    ).toBeTruthy()
  })

  it('shows everything ahead, and the whole index once the course is finished', () => {
    renderPath(settledThrough(seededTopic(), 5))
    // Seeing the end of a finite curriculum is the premise: nothing ahead folds.
    expect(document.querySelectorAll('.morse-path-item.is-locked').length).toBeGreaterThan(0)

    cleanup()
    renderPath(settledThrough(seededTopic(), lessonPackets().length))
    expect(document.querySelector('.morse-path-fold')).toBeNull()
    expect(document.querySelectorAll('.morse-path-lesson')).toHaveLength(lessonPackets().length)
  })

  it('states the checkpoint’s nature once rather than on all four rows', () => {
    renderPath(settledThrough(seededTopic(), lessonPackets().length))
    expect(screen.getAllByText('Word checkpoint')).toHaveLength(4)
    expect(screen.getAllByText('Real words, letters you already know')).toHaveLength(1)
  })
})
