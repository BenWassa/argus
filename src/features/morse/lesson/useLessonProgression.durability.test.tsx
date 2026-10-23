// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { LibraryProvider } from '../../../services/library/LibraryProvider'
import { freshSeedLibrary } from '../../../infrastructure/persistence/libraryMigrations'
import {
  advanceLesson,
  answerLesson,
  currentStep,
  introduceLesson,
  startLesson,
  type LessonRun,
} from '../../../domain/morse/curriculum/lesson'
import { MORSE_FEEDBACK_CORRECT_MS } from '../../../domain/morse/response'
import type { CurrentLibrary } from '../../../domain/library/library'
import type { Topic } from '../../../domain/library/topic'
import { useLessonProgression } from './useLessonProgression'

/**
 * A lesson's verdict is shown, then it moves on to "Lesson N done". The move is
 * what announces progress, so it must wait for the production provider to have
 * committed the answer, and an answer the device refused must not be lost.
 */
const fixture = vi.hoisted(() => ({
  records: new Map<string, { owner: string; revision: number; library: CurrentLibrary }>(),
  refuse: 0,
  gate: null as Promise<void> | null,
  armed: false,
}))
vi.mock('../../../infrastructure/persistence/indexedLibraryRepository', () => ({
  openIndexedLibraryRepository: async () => ({
    read: async (owner: string) => fixture.records.get(owner) ?? null,
    initialize: async (owner: string, input: { seed: CurrentLibrary }) => {
      if (!fixture.records.has(owner)) fixture.records.set(owner, { owner, revision: 1, library: input.seed })
      return fixture.records.get(owner)!
    },
    update: async (owner: string, change: (library: CurrentLibrary) => CurrentLibrary) => {
      if (fixture.armed) {
        if (fixture.gate) await fixture.gate
        if (fixture.refuse > 0) { fixture.refuse -= 1; throw new Error('Quota exceeded') }
      }
      const before = fixture.records.get(owner)!
      const next = change(before.library)
      if (JSON.stringify(next) === JSON.stringify(before.library)) return before
      const record = { owner, revision: before.revision + 1, library: next }
      fixture.records.set(owner, record)
      return record
    },
    close: () => {},
  }),
}))

vi.setConfig({ testTimeout: 20_000 })

const MORSE_ID = 'international-morse-letters-printed'
const ownerKey = '__argus_unclaimed_local__'

function storedMorse(): Topic {
  return fixture.records.get(ownerKey)!.library.topics.find((topic) => topic.id === MORSE_ID)!
}

/** The first packet, one correct keyed check short of "Lesson 1 done". */
function runOneCheckFromDone(topic: Topic): { run: LessonRun; itemId: string; pattern: string } {
  let run = startLesson(topic) as LessonRun
  for (let guard = 0; guard < 80; guard += 1) {
    const step = currentStep(run)
    if (!step) break
    if (step.kind === 'introduce') { run = introduceLesson(run, step.entry.itemId); continue }
    const answered = answerLesson(run, step.entry.itemId, step.entry.pattern)
    if (advanceLesson(answered).complete) return { run, itemId: step.entry.itemId, pattern: step.entry.pattern }
    run = advanceLesson(answered)
  }
  throw new Error('The packet never reached its final check.')
}

async function flush() {
  await act(async () => { for (let i = 0; i < 6; i += 1) await Promise.resolve() })
}

async function mountedNearEnd() {
  const topic = freshSeedLibrary().topics.find((candidate) => candidate.id === MORSE_ID) as Topic
  const { run, itemId, pattern } = runOneCheckFromDone(topic)
  const hook = renderHook(
    () => useLessonProgression({ topic, initialRun: run, onExit: vi.fn(), onTest: vi.fn(), onReference: vi.fn() }),
    { wrapper: LibraryProvider },
  )
  await waitFor(() => expect(hook.result.current?.run).toBeDefined())
  vi.useFakeTimers()
  fixture.armed = true
  return { hook, itemId, pattern }
}

beforeEach(() => {
  (globalThis as { __argusIndexedProviderTests?: boolean }).__argusIndexedProviderTests = true
  localStorage.clear()
  fixture.refuse = 0
  fixture.gate = null
  fixture.armed = false
  fixture.records = new Map([[ownerKey, { owner: ownerKey, revision: 1, library: freshSeedLibrary() }]])
})
afterEach(() => {
  cleanup()
  vi.useRealTimers();
  (globalThis as { __argusIndexedProviderTests?: boolean }).__argusIndexedProviderTests = false
})

describe('a lesson moves on only after its answer is durable', () => {
  it('holds the verdict while the final answer is saving, then completes the lesson', async () => {
    let release!: () => void
    fixture.gate = new Promise<void>((resolve) => { release = resolve })
    const { hook, itemId, pattern } = await mountedNearEnd()

    act(() => { hook.result.current.answerVisual(itemId, pattern) })
    act(() => { vi.advanceTimersByTime(MORSE_FEEDBACK_CORRECT_MS + 10) })
    await flush()
    expect(hook.result.current.run.complete).toBe(false)
    expect(hook.result.current.run.feedback).toBeTruthy()
    expect(hook.result.current.saveHeld).toBe(false)

    release()
    await flush()
    expect(hook.result.current.run.complete).toBe(true)
    expect(storedMorse().lessonProgress?.[itemId]).toBeTruthy()
  })

  it('keeps the earned answer on screen when the device refuses it, and completes after a retry', async () => {
    fixture.refuse = 3
    const { hook, itemId, pattern } = await mountedNearEnd()
    const before = JSON.stringify(storedMorse().lessonProgress ?? {})

    act(() => { hook.result.current.answerVisual(itemId, pattern) })
    act(() => { vi.advanceTimersByTime(MORSE_FEEDBACK_CORRECT_MS + 10) })
    await flush()

    expect(hook.result.current.saveHeld).toBe(true)
    expect(hook.result.current.run.complete).toBe(false)
    expect(hook.result.current.run.feedback?.correct).toBe(true)
    expect(JSON.stringify(storedMorse().lessonProgress ?? {})).toBe(before)

    await act(async () => { hook.result.current.retrySave(); for (let i = 0; i < 8; i += 1) await Promise.resolve() })
    expect(hook.result.current.saveHeld).toBe(false)
    expect(hook.result.current.run.complete).toBe(true)
    expect(storedMorse().lessonProgress?.[itemId]).toBeTruthy()
  })

  it('does not open the next lesson until the closed sitting is durable, and closes it once', async () => {
    const { hook, itemId, pattern } = await mountedNearEnd()
    act(() => { hook.result.current.answerVisual(itemId, pattern) })
    act(() => { vi.advanceTimersByTime(MORSE_FEEDBACK_CORRECT_MS + 10) })
    await flush()
    expect(hook.result.current.run.complete).toBe(true)

    let release!: () => void
    fixture.gate = new Promise<void>((resolve) => { release = resolve })
    const index = hook.result.current.run.packetIndex
    act(() => { hook.result.current.nextPacket() })
    act(() => { hook.result.current.nextPacket() })
    await flush()
    expect(hook.result.current.run.packetIndex).toBe(index)
    expect(hook.result.current.run.complete).toBe(true)

    release()
    await flush()
    expect(hook.result.current.run.packetIndex).toBe(index + 1)
  })
})
