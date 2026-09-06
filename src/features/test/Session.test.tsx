// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { LibraryProvider } from '../../lib/store'
import { seedLibrary } from '../../lib/seed'
import type { Topic } from '../../lib/types'
import { Session } from './Session'

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
      <Session topicIds={topicIds} onExit={() => undefined} />
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

/**
 * Every deck answer currently reachable anywhere in the document, including
 * attributes. This is the confidentiality probe: an unrevealed card's answer
 * must not be here in any form, visible, transformed away, or in a label.
 */
function answersInDocument(answers: string[] = ALL_ANSWERS): string[] {
  const markup = document.body.innerHTML
  return answers.filter((answer) => markup.includes(answer))
}

function press(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })
}

/** Wait for the outgoing card to finish and the next prompt to take over. */
async function settled(previousPrompt: string) {
  await waitFor(() => expect(document.querySelector('.flip-card')).not.toBeNull())
  await waitFor(() => expect(promptNow()).not.toBe(previousPrompt), { timeout: 8000 })
}

function storedTopic(id: string): Topic {
  const raw = localStorage.getItem(STORE_KEY)
  if (!raw) throw new Error('nothing stored')
  const found = (JSON.parse(raw).topics as Topic[]).find((topic) => topic.id === id)
  if (!found) throw new Error(`no stored topic ${id}`)
  return found
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('answer confidentiality', () => {
  it('mounts no answer at all before the card is revealed', () => {
    open(['nato-phonetic'])
    expect(answersInDocument()).toEqual([])
    expect(cardNow().getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('.flip-value-answer')?.textContent).toBe('')
  })

  it('exposes exactly one answer, and only after its own reveal', () => {
    open(['nato-phonetic'])
    const answer = ANSWER_FOR.get(promptNow())
    press(' ')
    expect(answersInDocument()).toEqual([answer])
    expect(cardNow().getAttribute('aria-expanded')).toBe('true')
  })

  it('keeps the outgoing card its own content for the whole exit', async () => {
    open(['nato-phonetic'])
    const outgoing = promptNow()
    const outgoingAnswer = ANSWER_FOR.get(outgoing)!
    press(' ')
    press('ArrowRight')

    // The grade is taken, the exit is running, and the card on screen is still
    // the card that was graded. Nothing of the next card exists yet.
    expect(answersInDocument()).toEqual([outgoingAnswer])
    expect(promptNow()).toBe(outgoing)
    expect(cardNow().getAttribute('aria-expanded')).toBe('true')

    await settled(outgoing)
    expect(answersInDocument()).toEqual([])
  })

  it('never lets a future answer reach the document, across the whole 26-card deck', async () => {
    open(['nato-phonetic'])

    for (let card = 0; card < NATO.items.length; card += 1) {
      const prompt = promptNow()
      const answer = ANSWER_FOR.get(prompt)!

      // Unrevealed: nothing.
      expect(answersInDocument()).toEqual([])

      press(' ')
      // Revealed: this answer and no other.
      expect(answersInDocument()).toEqual([answer])

      press(card % 2 === 0 ? 'ArrowRight' : 'ArrowLeft')
      // Exiting: still this answer and no other, so the next one cannot flash.
      expect(answersInDocument()).toEqual([answer])
      expect(promptNow()).toBe(prompt)

      if (card < NATO.items.length - 1) {
        await settled(prompt)
        // The next card entered unrevealed, so its answer is not in the
        // document at the moment it became the current card either.
        expect(answersInDocument()).toEqual([])
        expect(cardNow().getAttribute('aria-expanded')).toBe('false')
      }
    }

    await waitFor(() => expect(document.querySelector('.session-done')).not.toBeNull(), {
      timeout: 8000,
    })
    expect(answersInDocument()).toEqual([])
  }, 120000)

  it('does not reveal the next card by reaching the end of the flip-back transition', async () => {
    open(['nato-phonetic'])
    const first = promptNow()
    press(' ')
    press('ArrowRight')
    await settled(first)

    // The incoming card is a fresh element rather than the outgoing one played
    // backwards, so there is no un-flip during which a back face is on screen.
    expect(cardNow().className).not.toContain('is-revealed')
    expect(document.querySelector('.flip-value-answer')?.textContent).toBe('')
  })
})

describe('one gesture, one grade', () => {
  it('ignores repeated grading while the graded card is still leaving', async () => {
    open(['nato-phonetic'])
    const first = promptNow()
    press(' ')

    act(() => {
      for (const key of ['ArrowRight', 'ArrowRight', 'ArrowLeft', '1', '2', 'ArrowRight']) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
      }
    })

    expect(promptNow()).toBe(first)
    expect(screen.getByText(/Test ·/).textContent).toContain('1 of 26')
    await settled(first)
    expect(screen.getByText(/Test ·/).textContent).toContain('2 of 26')
  })

  it('cannot be double-scored through the accessible grade actions', async () => {
    open(['primary-survey'])
    const first = promptNow()
    press(' ')
    const correct = screen.getByRole('button', { name: 'Mark correct' })

    act(() => {
      correct.click()
      correct.click()
      correct.click()
    })

    expect(promptNow()).toBe(first)
    await settled(first)
    expect(screen.getByText(/Test ·/).textContent).toContain('2 of 5')
  })

  it('records one answer per card and banks the attempt it actually ran', async () => {
    open(['primary-survey'])
    const before = storedTopic('primary-survey').history.length

    // Three correct, two incorrect, in that order.
    for (let card = 0; card < 5; card += 1) {
      const prompt = promptNow()
      press(' ')
      press(card < 3 ? 'ArrowRight' : 'ArrowLeft')
      if (card < 4) await settled(prompt)
    }

    await waitFor(() => expect(document.querySelector('.session-done')).not.toBeNull(), {
      timeout: 8000,
    })
    const history = storedTopic('primary-survey').history
    expect(history).toHaveLength(before + 1)
    expect(history[history.length - 1]).toMatchObject({ correct: 3, total: 5 })
  }, 60000)
})

describe('keyboard and screen-reader grading', () => {
  it('keeps both key bindings for both grades', async () => {
    for (const [keys, expected] of [
      [['ArrowLeft', '1', 'ArrowLeft', '1', 'ArrowLeft'], 0],
      [['ArrowRight', '2', 'ArrowRight', '2', 'ArrowRight'], 5],
    ] as const) {
      localStorage.clear()
      open(['primary-survey'])
      for (let card = 0; card < 5; card += 1) {
        const prompt = promptNow()
        press(' ')
        press(keys[card])
        if (card < 4) await settled(prompt)
      }
      await waitFor(() => expect(document.querySelector('.session-done')).not.toBeNull(), {
        timeout: 8000,
      })
      const history = storedTopic('primary-survey').history
      expect(history[history.length - 1]).toMatchObject({ correct: expected, total: 5 })
      cleanup()
    }
  }, 60000)

  it('offers named grade actions to assistive technology once, and only once, revealed', () => {
    open(['nato-phonetic'])
    const miss = screen.getByText('Mark incorrect')
    const hit = screen.getByText('Mark correct')

    expect(miss.getAttribute('aria-hidden')).toBe('true')
    expect(miss.tabIndex).toBe(-1)
    expect(hit.tabIndex).toBe(-1)

    press(' ')
    expect(miss.getAttribute('aria-hidden')).toBe('false')
    expect(miss.tabIndex).toBe(0)
    expect(hit.tabIndex).toBe(0)
  })

  it('announces the revealed answer and then the grade it took', async () => {
    open(['nato-phonetic'])
    const live = document.querySelector('[aria-live="polite"]') as HTMLElement
    const prompt = promptNow()

    expect(live.textContent).toBe(`Prompt: ${prompt}.`)
    press(' ')
    expect(live.textContent).toBe(`Answer: ${ANSWER_FOR.get(prompt)}.`)
    press('ArrowLeft')
    expect(live.textContent).toBe('Marked incorrect.')
    await settled(prompt)
    expect(live.textContent).toBe(`Prompt: ${promptNow()}.`)
  })

  it('gives the card an accessible name that matches what is on it', () => {
    open(['nato-phonetic'])
    const prompt = promptNow()
    expect(cardNow().getAttribute('aria-label')).toBe(`Prompt: ${prompt}. Reveal answer.`)
    press(' ')
    expect(cardNow().getAttribute('aria-label')).toBe(`Answer: ${ANSWER_FOR.get(prompt)}`)
  })
})

describe('which decks get the swipe-first treatment', () => {
  it('replaces the grading buttons with a compact hint on a token deck', () => {
    open(['nato-phonetic'])
    press(' ')
    expect(screen.queryByText('Got it')).toBeNull()
    expect(screen.queryByText('Didn’t get it')).toBeNull()
    const rail = document.querySelector('.grade-hint-rail') as HTMLElement
    expect(rail.textContent).toContain('← Incorrect')
    expect(rail.textContent).toContain('Correct →')
    expect(rail.getAttribute('aria-hidden')).toBe('true')
    expect(document.querySelector('.grade-hint')?.className).toContain('is-visible')
    expect(screen.getByText(/Swipe the card/)).toBeTruthy()
  })

  it('leaves a long-answer procedural deck its visible buttons', () => {
    open(['ooda-loop'])
    press(' ')
    expect(screen.getByText('Got it')).toBeTruthy()
    expect(screen.getByText('Didn’t get it')).toBeTruthy()
    expect(document.querySelector('.grade-hint')).toBeNull()
    expect(document.querySelector('.session')?.className).not.toContain('is-swipe-graded')
  })

  it('still grades a long-answer deck from its buttons, through the same exit', async () => {
    open(['ooda-loop'])
    const first = promptNow()
    press(' ')
    act(() => {
      screen.getByText('Got it').click()
    })
    expect(promptNow()).toBe(first)
    await settled(first)
    expect(screen.getByText(/Test ·/).textContent).toContain('2 of 4')
  })
})

describe('topic boundaries', () => {
  it('banks each topic as its own complete attempt, in deck order', async () => {
    open(['primary-survey', 'cardinal-bearings'])
    const surveyBefore = storedTopic('primary-survey').history.length
    const bearingsBefore = storedTopic('cardinal-bearings').history.length

    for (let card = 0; card < 13; card += 1) {
      const prompt = promptNow()
      press(' ')
      press('ArrowRight')
      if (card < 12) await settled(prompt)
    }

    await waitFor(() => expect(document.querySelector('.session-done')).not.toBeNull(), {
      timeout: 8000,
    })

    const survey = storedTopic('primary-survey').history
    const bearings = storedTopic('cardinal-bearings').history
    expect(survey).toHaveLength(surveyBefore + 1)
    expect(bearings).toHaveLength(bearingsBefore + 1)
    expect(survey[survey.length - 1]).toMatchObject({ correct: 5, total: 5 })
    expect(bearings[bearings.length - 1]).toMatchObject({ correct: 8, total: 8 })
  }, 120000)

  it('does not leak an answer across the topic boundary', async () => {
    const survey = seededTopic('primary-survey').items.map((item) => item.answer)
    // 0 degrees is a substring of other bearings, so it is left out of the probe
    // rather than making every match ambiguous.
    const bearings = ['45\u00b0', '90\u00b0', '135\u00b0', '180\u00b0', '225\u00b0', '270\u00b0', '315\u00b0']
    open(['primary-survey', 'cardinal-bearings'])

    for (let card = 0; card < survey.length; card += 1) {
      const prompt = promptNow()
      expect(answersInDocument(bearings)).toEqual([])
      press(' ')
      expect(answersInDocument(bearings)).toEqual([])
      press('ArrowRight')
      // Including the last card of the topic, whose exit is also the moment the
      // attempt banks and the next topic's first card is chosen.
      expect(answersInDocument(bearings)).toEqual([])
      await settled(prompt)
    }

    expect(answersInDocument(survey)).toEqual([])
    expect(answersInDocument(bearings)).toEqual([])
    expect(cardNow().getAttribute('aria-expanded')).toBe('false')
  }, 60000)
})

describe('the Morse acquisition ladder is untouched', () => {
  it('keeps the progressive surface, with no flip card and no swipe hint', () => {
    open(['international-morse-letters-printed'])
    expect(document.querySelector('.progressive-card')).not.toBeNull()
    expect(document.querySelector('.flip-card')).toBeNull()
    expect(document.querySelector('.grade-hint')).toBeNull()
    expect(document.querySelector('.session')?.className).toContain('is-progressive')
  })
})
