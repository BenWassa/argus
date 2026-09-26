// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LibraryProvider } from '../../services/library/LibraryProvider'
import { SHIPPED_CATALOG_TOPIC_IDS } from '../../domain/library/catalog'
import { seedLibrary } from '../../domain/library/catalogSeed'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { REVIEW_LENGTH } from '../../domain/study/review'
import type { Topic } from '../../domain/library/topic'
import { TestSession } from './TestSession'

const STORE_KEY = 'argus.library.v5'
const MORSE_ID = 'international-morse-letters-printed'

/** The alphabet acquired a moment ago: no scheduled check is due yet. */
function acquiredMorse(): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const seeded = parsed.library.topics.find((topic) => topic.id === MORSE_ID)
  if (!seeded) throw new Error('Missing Morse topic.')
  const now = new Date().toISOString()
  return {
    ...seeded,
    status: 'completed',
    completedAt: now,
    learningAt: now,
    acquisitionReadyAt: now,
    history: [],
    itemEvidence: {},
  }
}

function storedMorse(): Topic {
  const raw = localStorage.getItem(STORE_KEY)
  if (!raw) throw new Error('nothing stored')
  const found = (JSON.parse(raw).topics as Topic[]).find((topic) => topic.id === MORSE_ID)
  if (!found) throw new Error('no stored Morse topic')
  return found
}

function position(): string {
  return document.querySelector('.session-count')?.textContent ?? ''
}

/** Answer whatever card is up, rightly or wrongly, and move past its feedback. */
async function answerCard() {
  const before = position()
  // The card holds its control shut briefly on arrival, so each retry does
  // whatever the card is ready for next rather than firing everything at once.
  await waitFor(
    () => {
      const next = screen.queryByRole('button', { name: 'Continue' })
      const field = document.querySelector<HTMLInputElement>('.progressive-card input:not([disabled])')
      if (next && !(next as HTMLButtonElement).disabled) fireEvent.click(next)
      else if (field && !field.value) fireEvent.change(field, { target: { value: 'E' } })
      else if (document.querySelector('.morse-key:enabled')) {
        act(() => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: '.' }))
        })
      }
      expect(position() !== before || screen.queryByRole('heading', { name: 'Review done' })).toBeTruthy()
    },
    { timeout: 8000, interval: 60 },
  )
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(
    STORE_KEY,
    JSON.stringify({ version: 5, topics: [acquiredMorse()], catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS] }),
  )
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('a Test between scheduled checks', () => {
  it(`asks ${REVIEW_LENGTH} letters with no hints, and says it is a review`, () => {
    render(
      <LibraryProvider>
        <TestSession topicIds={[MORSE_ID]} onExit={() => undefined} />
      </LibraryProvider>,
    )
    expect(position()).toBe(`1/${REVIEW_LENGTH}`)
    expect(screen.getByRole('button', { name: 'End review' })).toBeTruthy()
    // Uncued: no rhythm phrase, no element count.
    expect(document.querySelector('.morse-phrase')).toBeNull()
    expect(document.body.textContent).not.toMatch(/\d+ signals?/)
  })

  it('keeps every answer and moves nothing on the schedule', async () => {
    const before = storedMorse()
    render(
      <LibraryProvider>
        <TestSession topicIds={[MORSE_ID]} onExit={() => undefined} />
      </LibraryProvider>,
    )

    for (let card = 0; card < REVIEW_LENGTH; card += 1) await answerCard()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Review done' })).toBeTruthy())

    const after = storedMorse()
    expect(after.status).toBe(before.status)
    expect(after.learningAt).toBe(before.learningAt)
    expect(after.lastTestedAt ?? null).toBe(before.lastTestedAt ?? null)
    expect(after.history).toEqual([])

    const answered = Object.values(after.itemEvidence ?? {}).filter((evidence) =>
      Object.values(evidence.directions).some((direction) => (direction?.attempts ?? 0) > 0),
    )
    expect(answered).toHaveLength(REVIEW_LENGTH)
    // And nothing was put back on a cue after a miss.
    for (const evidence of Object.values(after.itemEvidence ?? {})) expect(evidence.cue).toBe('free')

    expect(document.body.textContent).toContain('keeps your schedule exactly where it is')
  }, 60000)
})
