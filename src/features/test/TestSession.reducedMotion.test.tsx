// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { LibraryProvider } from '../../services/library/LibraryProvider'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../domain/library/topic'
import { TestSession } from './TestSession'

/**
 * Reduced motion is answered once per module by the animation library, so this
 * whole file is the reduced-motion device. The claim under test is that taking
 * the motion away changes what moves and nothing about what anything means.
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

const STORE_KEY = 'argus.library.v5'

function seededTopic(id: string): Topic {
  const found = seedLibrary().topics.find((topic) => topic.id === id)
  if (!found) throw new Error(`no seeded topic ${id}`)
  return found as Topic
}

const NATO = seededTopic('nato-phonetic')
const ANSWER_FOR = new Map(NATO.items.map((item) => [item.prompt, item.answer]))
const ALL_ANSWERS = NATO.items.map((item) => item.answer)

function open(topicIds: string[]) {
  return render(
    <LibraryProvider>
      <TestSession topicIds={topicIds} onExit={() => undefined} />
    </LibraryProvider>,
  )
}

function promptNow(): string {
  return screen.getByRole('heading', { level: 1 }).textContent ?? ''
}

function cardNow(): HTMLElement {
  const card = document.querySelector('.flip-card')
  if (!card) throw new Error('no flip card on screen')
  return card as HTMLElement
}

function answersInDocument(): string[] {
  const markup = document.body.innerHTML
  return ALL_ANSWERS.filter((answer) => markup.includes(answer))
}

function press(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })
}

async function settled(previousPrompt: string) {
  await waitFor(() => expect(promptNow()).not.toBe(previousPrompt), { timeout: 8000 })
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('reduced motion', () => {
  it('never puts the card on a decorative rotation', async () => {
    open(['nato-phonetic'])
    press(' ')
    expect(cardNow().style.transform ?? '').not.toMatch(/rotate\(\s*-?[1-9]/)
    press('ArrowRight')
    expect(cardNow().style.transform ?? '').not.toMatch(/rotate\(\s*-?[1-9]/)
  })

  it('keeps grading fully operable, by key and by accessible action', async () => {
    open(['primary-survey'])
    const first = promptNow()
    press(' ')
    press('ArrowLeft')
    await settled(first)

    const second = promptNow()
    press(' ')
    act(() => {
      screen.getByRole('button', { name: 'Got it' }).click()
    })
    await settled(second)
    expect(screen.getByLabelText('2 of 5')).toBeTruthy()
  })

  it('keeps the answer-confidentiality invariant across the whole deck', async () => {
    open(['nato-phonetic'])

    for (let card = 0; card < NATO.items.length; card += 1) {
      const prompt = promptNow()
      const answer = ANSWER_FOR.get(prompt)!
      expect(answersInDocument()).toEqual([])
      press(' ')
      expect(answersInDocument()).toEqual([answer])
      press(card % 3 === 0 ? 'ArrowLeft' : 'ArrowRight')
      expect(answersInDocument()).toEqual([answer])
      expect(promptNow()).toBe(prompt)
      if (card < NATO.items.length - 1) {
        await settled(prompt)
        expect(answersInDocument()).toEqual([])
        expect(cardNow().getAttribute('aria-expanded')).toBe('false')
      }
    }

    await waitFor(() => expect(document.querySelector('.test-done')).not.toBeNull(), {
      timeout: 8000,
    })
    // The result names what was missed, answers included; nothing else carries one.
    document.querySelector('.test-missed')?.remove()
    expect(answersInDocument()).toEqual([])
  }, 60000)

  it('still refuses a second grade on a card that is already leaving', async () => {
    open(['nato-phonetic'])
    const first = promptNow()
    press(' ')
    act(() => {
      for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowRight']) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
      }
    })
    expect(promptNow()).toBe(first)
    await settled(first)
    expect(screen.getByLabelText('1 of 26')).toBeTruthy()
  })

  it('banks the same attempt it would have banked with motion on', async () => {
    open(['primary-survey'])
    for (let card = 0; card < 5; card += 1) {
      const prompt = promptNow()
      press(' ')
      press(card === 0 ? 'ArrowLeft' : 'ArrowRight')
      if (card < 4) await settled(prompt)
    }
    await waitFor(() => expect(document.querySelector('.test-done')).not.toBeNull(), {
      timeout: 8000,
    })
    const stored = JSON.parse(localStorage.getItem(STORE_KEY)!).topics as Topic[]
    const history = stored.find((topic) => topic.id === 'primary-survey')!.history
    expect(history[history.length - 1]).toMatchObject({ correct: 4, total: 5 })
  }, 30000)

  it('keeps the grade pair, with its arrow hints, on screen', () => {
    open(['nato-phonetic'])
    press(' ')
    expect(document.querySelector('.grade-pair')?.textContent).toContain('Missed')
    expect(screen.getByRole('button', { name: 'Missed' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Got it' })).toBeTruthy()
  })
})
