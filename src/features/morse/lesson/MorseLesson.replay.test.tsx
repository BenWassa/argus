// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MORSE_LETTERS } from '../../../domain/morse/code'
import { lessonPackets } from '../../../domain/morse/curriculum/lesson'
import { startReplayLesson } from '../../../domain/morse/curriculum/lessonPath'
import {
  MORSE_FEEDBACK_CORRECT_MS,
  MORSE_TRANSITION_MS,
  morseElementDurationMs,
} from '../../../domain/morse/response'
import { LibraryProvider } from '../../../services/library/LibraryProvider'
import { parseLibrary } from '../../../infrastructure/persistence/libraryParser'
import {
  loadLibrary,
  saveLibrary,
} from '../../../infrastructure/persistence/localLibraryRepository'
import { seedLibrary } from '../../../domain/library/catalogSeed'
import { TopicPage } from '../../library/TopicPage'
import type { Topic } from '../../../domain/library/topic'
import type { ItemLessonStore } from '../../../domain/morse/progress'
import { LessonRun } from './LessonRun'

/**
 * #117 — replay reruns the acquisition course; it does not substitute a
 * simplified review for it, and it does not touch a single earned fact.
 *
 * Replay used to be its own component: every mapping uncued and pre-introduced,
 * capped at ten retrievals, no mnemonic, no canonical pattern, no audio, no
 * word checkpoint. A learner who had finished the course and asked to go back
 * over Lesson 1 was handed a bare glyph and a key. These tests pin the two
 * halves of the fix — the same screens, and none of the consequences.
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

/**
 * A learner who has finished: every letter settled in Learn, the A–Z claim
 * proved in Test, retention earned and completion recorded. This is the record
 * a replay must hand back untouched.
 */
function finishedLearner(): Topic {
  const base = seededTopic()
  const progress: ItemLessonStore = {}
  for (const packet of lessonPackets()) {
    for (const glyph of packet.characters) progress[itemIdForGlyph(base, glyph)] = 'settled'
  }
  return {
    ...base,
    status: 'completed',
    learningAt: '2026-07-01T09:00:00.000Z',
    drilledAt: '2026-07-20T09:00:00.000Z',
    completedAt: '2026-08-24T09:00:00.000Z',
    lastTestedAt: '2026-08-24T09:00:00.000Z',
    acquisitionReadyAt: '2026-07-18T09:00:00.000Z',
    lessonProgress: progress,
    lessonSitting: { retrievals: 6, correct: 5, revisitItemIds: [itemIdForGlyph(base, 'Q')] },
    morseReview: { sittings: 14, items: {} },
    history: [
      { at: '2026-07-20T09:00:00.000Z', correct: 26, total: 26, resolvedTo: 'drilled' },
      { at: '2026-08-24T09:00:00.000Z', correct: 26, total: 26, resolvedTo: 'completed' },
    ],
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

function storedTopic(): Topic {
  const topic = loadLibrary().topics.find((candidate) => candidate.id === MORSE_ID)
  if (!topic) throw new Error('The Morse topic left the store.')
  return topic
}

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')
}

function renderReplay(index = 0) {
  return render(
    <LibraryProvider>
      <LessonRun
        topicId={MORSE_ID}
        target={{ kind: 'replay', index }}
        onExit={vi.fn()}
        onCheck={vi.fn()}
        onReference={vi.fn()}
      />
    </LibraryProvider>,
  )
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: fakeStorage(), configurable: true })
})

describe('#117 replay reruns the canonical acquisition course', () => {
  afterEach(cleanup)

  it('opens the real lesson, mnemonic and all, rather than a bare glyph and a key', () => {
    seedStore(finishedLearner())
    renderReplay(0)

    // The first-exposure introduction, exactly as acquisition presents it.
    expect(screen.getByText('New letter')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Got it' })).toBeTruthy()
    // The rhythmic mnemonic, the canonical notation and the sound are all back.
    expect(document.querySelector('.morse-phrase')).toBeTruthy()
    expect(document.querySelector('.morse-notation')).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Play / })).toBeTruthy()
    // The mark grammar is not repeated to someone who has met all 26 letters.
    // It is a first-meeting explanation, and it stays reachable on the topic
    // page under `How this course works`.
    expect(document.querySelector('.lesson-grammar')).toBeNull()
  })

  it('starts at canonical lesson 1 and names itself a replay', () => {
    seedStore(finishedLearner())
    renderReplay(0)

    expect(screen.getByText(`Lesson 1 of ${lessonPackets().length}`)).toBeTruthy()
    expect(screen.getByText('Replay')).toBeTruthy()
  })

  it('shows the packet the printed curriculum shows, at any position', () => {
    seedStore(finishedLearner())
    renderReplay(4)

    expect(screen.getByText(`Lesson 5 of ${lessonPackets().length}`)).toBeTruthy()
    const run = startReplayLesson(finishedLearner(), 4)
    expect(run!.entries.filter((entry) => entry.novel).map((entry) => entry.glyph)).toEqual([
      ...lessonPackets()[4].novel,
    ])
  })

  it('reports a clean sitting rather than reading out the learner’s real one', () => {
    seedStore(finishedLearner())
    renderReplay(0)

    // The stored learner is six retrievals into a sitting a replay cannot move.
    expect(screen.getByText('0 retrievals')).toBeTruthy()
    expect(screen.queryByText('6 retrievals')).toBeNull()
  })
})

describe('#117 replay leaves every earned fact exactly as it found it', () => {
  async function settle() {
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
  }

  async function keyPattern(pattern: string) {
    for (const element of pattern) {
      fireEvent.keyDown(window, { key: element, repeat: false })
      await settle()
      act(() => {
        vi.advanceTimersByTime(morseElementDurationMs(element as '.' | '-') + 10)
      })
    }
  }

  /** Answer everything on screen correctly until the lesson settles. */
  async function driveLesson(maxSteps = 60) {
    for (let step = 0; step < maxSteps; step += 1) {
      if (screen.queryByText(/^Lesson \d+ replayed$/)) return
      if (screen.queryByRole('button', { name: 'Start checkpoint' })) return
      const gotIt = screen.queryByRole('button', { name: 'Got it' })
      if (gotIt) {
        fireEvent.click(gotIt)
        continue
      }
      const glyph = document.querySelector('.lesson-glyph')?.textContent as
        | keyof typeof MORSE_LETTERS
        | undefined
      if (!glyph) throw new Error('Expected an introduction or a keyed check on screen.')
      await keyPattern(MORSE_LETTERS[glyph])
      act(() => {
        vi.advanceTimersByTime(MORSE_FEEDBACK_CORRECT_MS + MORSE_TRANSITION_MS)
      })
    }
    throw new Error(`The replay did not settle within ${maxSteps} steps.`)
  }

  beforeEach(() => {
    vi.useFakeTimers()
    // Listening questions own their own DOM branch; suppressing them keeps this
    // test driving the one keyed shape it knows how to answer.
    seedStore({
      ...finishedLearner(),
      lessonSitting: { retrievals: 6, correct: 5, revisitItemIds: [], listeningSuppressed: true },
    })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('writes nothing at all through a complete replayed lesson', async () => {
    const before = JSON.stringify(storedTopic())
    renderReplay(0)
    await driveLesson()

    expect(screen.getByText('Lesson 1 replayed')).toBeTruthy()
    // Support levels, the sitting, review history, the readiness anchor,
    // completion, evidence and attempt history — all of it, byte for byte.
    expect(JSON.stringify(storedTopic())).toBe(before)
  })

  it('keeps completion, the first-completion stamp and the attempt history intact', async () => {
    renderReplay(0)
    await driveLesson()

    const after = storedTopic()
    expect(after.status).toBe('completed')
    expect(after.completedAt).toBe('2026-08-24T09:00:00.000Z')
    expect(after.acquisitionReadyAt).toBe('2026-07-18T09:00:00.000Z')
    expect(after.history).toHaveLength(2)
  })

  it('offers the next lesson in printed order instead of the learner’s durable position', async () => {
    renderReplay(0)
    await driveLesson()

    fireEvent.click(screen.getByRole('button', { name: 'Next lesson' }))
    expect(screen.getByText(`Lesson 2 of ${lessonPackets().length}`)).toBeTruthy()
    expect(screen.getByText('Replay')).toBeTruthy()
  })

  it('says what a replay did and did not do, without first-time language', async () => {
    renderReplay(0)
    await driveLesson()

    expect(
      screen.getByText(/A replay teaches; it records nothing\./),
    ).toBeTruthy()
    expect(screen.queryByText(/Test is still the only place the A–Z claim is proved\./)).toBeNull()
  })
})

describe('#117 a finished learner has somewhere to replay from', () => {
  afterEach(cleanup)

  it('offers a replay on the topic page instead of a lesson that cannot open', () => {
    const finished = finishedLearner()
    seedStore(finished)
    const onStart = vi.fn()

    render(
      <LibraryProvider>
        <TopicPage
          topic={finished}
          onBack={vi.fn()}
          onStart={onStart}
          onReference={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </LibraryProvider>,
    )

    const replay = screen.getByRole('button', { name: 'Replay the course from lesson 1' })
    fireEvent.click(replay)
    expect(onStart).toHaveBeenCalledWith('learn', [MORSE_ID], { kind: 'replay', index: 0 })
  })
})

describe('#117 the replay boundary is structural, not remembered', () => {
  it('routes replay through the lesson itself, with no second surface to drift', () => {
    const code = source('./LessonRun.tsx')
    expect(code).toContain('replay={target.kind === \'replay\'}')
    expect(code).not.toContain('MorseReplay')
  })

  it('suppresses every durable write at the record boundary rather than per call site', () => {
    const record = source('./useLessonRecord.ts')
    expect(record).toContain('const updateTopic: typeof write = replay ? () => {} : write')
    // Every write in the lesson still goes through the record, so the single
    // suppression above is genuinely the whole of it.
    const lesson = source('./MorseLesson.tsx')
    expect(lesson).not.toContain('updateTopic(')
  })
})
