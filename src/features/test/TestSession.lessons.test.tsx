// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LibraryProvider } from '../../services/library/LibraryProvider'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../domain/library/topic'
import { TestSession } from './TestSession'
import { TopicPage } from '../library/TopicPage'
import { topicBar } from '../library/topicItems'
import { lessonForItem } from '../../domain/learning/generatedCurriculum'

/**
 * The check's offer to practise what it just missed (#92 batch 5).
 *
 * Split into its own file the way `TestSession.reducedMotion.test.tsx` is: this is
 * one narrow concern on a large surface, and the assertions read better away
 * from the confidentiality and swipe-grading suites.
 *
 * The point under test is that the offer exists at all for an *ordinary* topic.
 * NATO writes no per-item evidence, so the Test keeps its missed set on the
 * attempt it banks. The end screen and the topic page read that one record.
 */

/**
 * Nothing here is about motion, and a 26-card deck waits for the real exit
 * animation 26 times (about 11s a test). Reduced motion is answered once per
 * module by the animation library, so this file is the reduced-motion device;
 * the grade, the bank and the offer mean exactly what they mean with motion.
 * The confidentiality-during-transition claim is tested in TestSession.test.tsx
 * with the real animation.
 */
window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: query.includes('prefers-reduced-motion'),
  media: query,
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia

function seededTopic(id: string): Topic {
  const found = seedLibrary().topics.find((topic) => topic.id === id)
  if (!found) throw new Error(`no seeded topic ${id}`)
  return found as Topic
}

const STORE_KEY = 'argus.library.v5'
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
  return screen.getByRole('heading', { level: 2 }).textContent ?? ''
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
        document.querySelector('.test-done') !== null || promptNow() !== prompt,
      ).toBe(true),
    )
  }
  await waitFor(() => expect(document.querySelector('.test-done')).not.toBeNull())
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('reviewing lessons after a Test', () => {
  it('offers exactly the items that were missed, and names them', async () => {
    const onPractice = vi.fn()
    render(
      <LibraryProvider>
        <TestSession topicIds={['nato-phonetic']} onExit={() => undefined} onPractice={onPractice} />
      </LibraryProvider>,
    )

    const wrong = new Set([NATO.items[2].prompt, NATO.items[5].prompt])
    await runDeck(wrong)

    const offer = screen.getByRole('button', { name: 'Review lesson' })
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

    expect(screen.queryByRole('button', { name: /Review lesson/ })).toBeNull()
    expect(onPractice).not.toHaveBeenCalled()
  }, 30000)

  it('counts one missed item as one, and leaks no answer doing it', async () => {
    render(
      <LibraryProvider>
        <TestSession topicIds={['nato-phonetic']} onExit={() => undefined} onPractice={vi.fn()} />
      </LibraryProvider>,
    )

    await runDeck(new Set([NATO.items[1].prompt]))

    expect(screen.getByRole('button', { name: 'Review lesson' })).toBeTruthy()
    // The offer names a count, never the answer key it was drawn from.
    const offer = screen.getByRole('button', { name: 'Review lesson' }).textContent ?? ''
    expect(offer).not.toContain(ANSWER_FOR.get(NATO.items[1].prompt))
  }, 30000)

  /**
   * A host that passes no handler gets no offer, and `Done` stays the
   * plain primary control rather than being quietly demoted to a ghost.
   */
  it('renders no offer when the host provides no practice route', async () => {
    render(
      <LibraryProvider>
        <TestSession topicIds={[SMALL.id]} onExit={() => undefined} />
      </LibraryProvider>,
    )

    await runDeck(new Set([SMALL.items[0].prompt]), SMALL)

    expect(screen.queryByRole('button', { name: /Review lesson/ })).toBeNull()
    const back = screen.getByRole('button', { name: 'Done' })
    expect(back.className).not.toContain('ghost')
  }, 30000)

  it('keeps durable misses and sends the topic primary action to the next lesson', async () => {
    render(<LibraryProvider><TestSession topicIds={['nato-phonetic']} onExit={vi.fn()} onPractice={vi.fn()} /></LibraryProvider>)
    await runDeck(new Set([NATO.items[0].prompt, NATO.items[3].prompt, NATO.items[7].prompt, NATO.items[9].prompt]))
    expect(screen.getByRole('button', { name: 'Review lesson' })).toBeTruthy()
    expect(document.body.textContent).toContain('4 missed')
    cleanup()
    const stored = (JSON.parse(localStorage.getItem(STORE_KEY)!).topics as Topic[]).find(topic => topic.id === NATO.id)!
    expect(stored.history.at(-1)?.missedItemIds).toHaveLength(4)
    expect(topicBar(stored)).toMatchObject({ value: NATO.items.length - 4, max: NATO.items.length })
    expect(lessonForItem(stored, NATO.items[7].id!)?.id).toBe('lesson-2')
    const onStart = vi.fn()
    const { container } = render(<LibraryProvider><TopicPage topic={stored} onBack={vi.fn()} onStart={onStart} onReference={vi.fn()} onEdit={vi.fn()} /></LibraryProvider>)
    expect(container.querySelectorAll('.topic-tray button')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(onStart).toHaveBeenCalledWith('learn', [NATO.id], { kind: 'stage', stageId: 'lesson-1' })
    expect(JSON.parse(localStorage.getItem(STORE_KEY)!).topics.find((topic: Topic) => topic.id === NATO.id).history).toEqual(stored.history)
  }, 60000)

  it('lists the missed items on the result, capped, with plain outcome words', async () => {
    render(
      <LibraryProvider>
        <TestSession topicIds={['nato-phonetic']} onExit={() => undefined} onPractice={vi.fn()} />
      </LibraryProvider>,
    )
    await runDeck(new Set(NATO.items.slice(0, 10).map((item) => item.prompt)))
    const chips = [...document.querySelectorAll('.test-missed-chip')].map((chip) => chip.textContent)
    expect(chips).toHaveLength(8)
    const wrong = new Set(NATO.items.slice(0, 10).map((item) => `${item.prompt}${item.answer}`))
    for (const chip of chips) expect(wrong.has(chip ?? '')).toBe(true)
    expect(document.querySelector('.test-missed-more')?.textContent).toBe('+2 more')
    expect(document.body.textContent).not.toMatch(/to learning|Back to today/)
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy()
  }, 60000)
})
