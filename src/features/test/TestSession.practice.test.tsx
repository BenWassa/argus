// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LibraryProvider } from '../../services/library/LibraryProvider'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../lib/types'
import { TestSession } from './TestSession'

/**
 * The check's offer to practise what it just missed (#92 batch 5).
 *
 * Split into its own file the way `TestSession.reducedMotion.test.tsx` is: this is
 * one narrow concern on a large surface, and the assertions read better away
 * from the confidentiality and swipe-grading suites.
 *
 * The point under test is that the offer exists at all for an *ordinary* topic.
 * NATO writes no per-item evidence, so after this component unmounts there is
 * nothing durable that could reconstruct the missed set — the end screen is the
 * only place the offer can be made, and it has to be made from run bookkeeping.
 */

function seededTopic(id: string): Topic {
  const found = seedLibrary().topics.find((topic) => topic.id === id)
  if (!found) throw new Error(`no seeded topic ${id}`)
  return found as Topic
}

const NATO = seededTopic('nato-phonetic')
const ANSWER_FOR = new Map(NATO.items.map((item) => [item.prompt, item.answer]))

/**
 * A four-item topic, for the assertions that only need *a* finished check.
 *
 * Driving twenty-six cards through the reveal/grade/exit cycle is the expensive
 * part of this file, and two of these tests care about what the end screen
 * renders rather than about deck size.
 */
const SMALL = seededTopic('ooda-loop')

function promptNow(): string {
  return screen.getByRole('heading', { level: 1 }).textContent ?? ''
}

function press(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })
}

/**
 * Answer every card in the deck, marking the named prompts wrong.
 *
 * Reveal is space; the grade keys are the same ones the swipe maps to, so this
 * drives the real component rather than a stand-in.
 */
async function runDeck(wrongPrompts: Set<string>, topic: Topic = NATO) {
  for (let i = 0; i < topic.items.length; i += 1) {
    await waitFor(() => expect(document.querySelector('.flip-card')).not.toBeNull())
    const prompt = promptNow()
    press(' ')
    press(wrongPrompts.has(prompt) ? 'ArrowLeft' : 'ArrowRight')
    // Let the exit animation settle into the next card or the end screen.
    await waitFor(() =>
      expect(
        promptNow() !== prompt || document.querySelector('.session-done') !== null,
      ).toBe(true),
    )
  }
  await waitFor(() => expect(document.querySelector('.session-done')).not.toBeNull())
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('offering practice after a check', () => {
  it('offers exactly the items that were missed, and names them', async () => {
    const onPractice = vi.fn()
    render(
      <LibraryProvider>
        <TestSession topicIds={['nato-phonetic']} onExit={() => undefined} onPractice={onPractice} />
      </LibraryProvider>,
    )

    const wrong = new Set([NATO.items[2].prompt, NATO.items[5].prompt])
    await runDeck(wrong)

    const offer = screen.getByRole('button', { name: 'Practise 2 items' })
    fireEvent.click(offer)

    expect(onPractice).toHaveBeenCalledTimes(1)
    const [topicId, itemIds] = onPractice.mock.calls[0]
    expect(topicId).toBe('nato-phonetic')
    expect(new Set(itemIds)).toEqual(new Set([NATO.items[2].id, NATO.items[5].id]))
  }, 30000)

  it('makes no offer when nothing was missed', async () => {
    const onPractice = vi.fn()
    render(
      <LibraryProvider>
        <TestSession topicIds={[SMALL.id]} onExit={() => undefined} onPractice={onPractice} />
      </LibraryProvider>,
    )

    await runDeck(new Set(), SMALL)

    expect(document.querySelector('.practice-offer')).toBeNull()
    expect(onPractice).not.toHaveBeenCalled()
  }, 30000)

  it('counts one missed item as one, and leaks no answer doing it', async () => {
    render(
      <LibraryProvider>
        <TestSession topicIds={['nato-phonetic']} onExit={() => undefined} onPractice={vi.fn()} />
      </LibraryProvider>,
    )

    await runDeck(new Set([NATO.items[1].prompt]))

    expect(screen.getByRole('button', { name: 'Practise 1 item' })).toBeTruthy()
    // The offer names a count, never the answer key it was drawn from.
    const offer = document.querySelector('.practice-offer')?.textContent ?? ''
    expect(offer).not.toContain(ANSWER_FOR.get(NATO.items[1].prompt))
  }, 30000)

  /**
   * A host that passes no handler gets no offer, and `Back to today` stays the
   * plain primary control rather than being quietly demoted to a ghost.
   */
  it('renders no offer when the host provides no practice route', async () => {
    render(
      <LibraryProvider>
        <TestSession topicIds={[SMALL.id]} onExit={() => undefined} />
      </LibraryProvider>,
    )

    await runDeck(new Set([SMALL.items[0].prompt]), SMALL)

    expect(document.querySelector('.practice-offer')).toBeNull()
    const back = screen.getByRole('button', { name: 'Back to today' })
    expect(back.className).not.toContain('ghost')
  }, 30000)
})
