// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { seedLibrary } from '../../lib/seed'
import { parseLibrary } from '../../lib/storage'
import type { Topic } from '../../lib/types'
import { TopicForm } from './TopicForm'

/**
 * Editing a topic is a content change. Every durable learner-progress field must
 * come through it untouched, and the ones keyed by item id must lose exactly the
 * entries whose items were genuinely deleted — no more.
 *
 * `TopicForm` builds its saved topic field by field rather than spreading the
 * original, which is deliberate (an edit must not silently carry unknown state)
 * and is also exactly why a new durable field can be dropped here without any
 * type error to catch it.
 */

const MORSE_ID = 'international-morse-letters-printed'

function seeded(id: string): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((candidate) => candidate.id === id)
  if (!topic) throw new Error(`Missing seeded topic ${id}`)
  return topic
}

function edit(topic: Topic, changes: { title?: string; items?: string } = {}): Topic {
  let saved: Topic | null = null
  render(
    <TopicForm topic={topic} draft={null} onClose={() => undefined} onSave={(next) => { saved = next }} />,
  )

  if (changes.title !== undefined) {
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: changes.title } })
  }
  if (changes.items !== undefined) {
    fireEvent.change(screen.getByLabelText('Items'), { target: { value: changes.items } })
  }
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

  if (!saved) throw new Error('The form did not save.')
  return saved
}

afterEach(cleanup)

describe('editing a topic preserves durable learner progress', () => {
  const worked = (): Topic => ({
    ...seeded(MORSE_ID),
    status: 'learning',
    learningAt: '2026-08-01T00:00:00.000Z',
    lastTestedAt: '2026-08-02T00:00:00.000Z',
    history: [{ at: '2026-08-02T00:00:00.000Z', correct: 20, total: 26, resolvedTo: 'learning' }],
    lessonProgress: {
      [`${MORSE_ID}-item-01`]: 'settled',
      [`${MORSE_ID}-item-02`]: 'cued',
    },
    lessonSitting: {
      retrievals: 6,
      correct: 4,
      revisitItemIds: [`${MORSE_ID}-item-02`],
      listeningSuppressed: true,
    },
    acquisitionReadyAt: '2026-08-03T00:00:00.000Z',
  })

  it('carries the active sitting and the readiness anchor through a title edit', () => {
    const saved = edit(worked(), { title: 'Morse — printed letters' })

    expect(saved.title).toBe('Morse — printed letters')
    expect(saved.lessonSitting).toEqual({
      retrievals: 6,
      correct: 4,
      revisitItemIds: [`${MORSE_ID}-item-02`],
      listeningSuppressed: true,
    })
    expect(saved.acquisitionReadyAt).toBe('2026-08-03T00:00:00.000Z')
    // ...alongside everything an edit already preserved.
    expect(saved.status).toBe('learning')
    expect(saved.history).toHaveLength(1)
    expect(saved.lessonProgress?.[`${MORSE_ID}-item-01`]).toBe('settled')
  })

  it('prunes only revisit ids whose items were actually deleted', () => {
    const topic = worked()
    // Keep every row but the second, which is the one the sitting wants revisited.
    const remaining = topic.items
      .filter((item) => item.id !== `${MORSE_ID}-item-02`)
      .map((item) => `${item.prompt} | ${item.answer}`)
      .join('\n')

    const saved = edit(topic, { items: remaining })

    expect(saved.items.some((item) => item.prompt === 'B')).toBe(false)
    // The dead id is gone — the storage boundary rejects a sitting that names an
    // item its topic does not have, so leaving it would make the library
    // unloadable on the next start rather than merely look untidy.
    expect(saved.lessonSitting?.revisitItemIds).toEqual([])
    // The counters stand: those retrievals happened.
    expect(saved.lessonSitting?.retrievals).toBe(6)
    expect(saved.lessonSitting?.correct).toBe(4)
    expect(saved.lessonSitting?.listeningSuppressed).toBe(true)
    // Per-item lesson support for the deleted row goes with it; the rest stays.
    expect(saved.lessonProgress).toEqual({ [`${MORSE_ID}-item-01`]: 'settled' })
  })

  it('leaves a topic that has no sitting without one', () => {
    const saved = edit({ ...seeded(MORSE_ID) }, { title: 'Renamed' })
    expect(saved).not.toHaveProperty('lessonSitting')
    expect(saved).not.toHaveProperty('acquisitionReadyAt')
  })

  it('produces a topic the storage boundary still accepts after an item deletion', () => {
    const topic = worked()
    const remaining = topic.items
      .filter((item) => item.id !== `${MORSE_ID}-item-02`)
      .map((item) => `${item.prompt} | ${item.answer}`)
      .join('\n')

    const saved = edit(topic, { items: remaining })
    const reparsed = parseLibrary(JSON.parse(JSON.stringify({ version: 5, topics: [saved] })))

    expect(reparsed.ok).toBe(true)
  })
})
