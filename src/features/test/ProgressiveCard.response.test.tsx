// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { CUE_RUNGS, FREE_PRODUCTION_RUNG, FREE_RECEPTION_RUNG } from '../../domain/study/cueLadder'
import { MORSE_LETTERS, type MorseLetter } from '../../domain/morse/code'
import { patternReading } from '../../domain/morse/testing/acquisitionProfile'
import { ProgressiveCard, type ProgressiveAnswer } from './ProgressiveCard'

/**
 * What the Morse check does between one answer and the next.
 *
 * Every answer used to be given the same 800ms and then taken away, which is
 * an age to sit through when you were right and nowhere near long enough to
 * read what you got wrong. A hit is now acknowledged and moves on by itself; a
 * correction stands until the learner says they have read it; and the key is
 * shut for the whole of both, including across the swap into the next letter.
 */

function character(letter: MorseLetter) {
  return {
    itemId: `i-${letter}`,
    glyph: letter,
    pattern: MORSE_LETTERS[letter],
    reading: patternReading(MORSE_LETTERS[letter]),
    mnemonicId: `argus-morse-rhythm-v1-${letter}`,
    textLabel: `${letter}`,
  }
}

const answers: ProgressiveAnswer[] = []

/** One card, and a session that moves to the next letter when it is answered. */
function Harness({ letters, rungIndex }: { letters: MorseLetter[]; rungIndex: number }) {
  const [at, setAt] = useState(0)
  const letter = letters[Math.min(at, letters.length - 1)]
  return (
    <ProgressiveCard
      character={character(letter)}
      rung={CUE_RUNGS[rungIndex]}
      cardKey={`${letter}-${at}`}
      onAnswer={(answer) => {
        answers.push(answer)
        setAt((previous) => previous + 1)
      }}
    />
  )
}

function key(element: '.' | '-') {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: element }))
  })
}

function morseKey(): HTMLButtonElement | null {
  return document.querySelector('.morse-key')
}

afterEach(() => {
  cleanup()
  answers.length = 0
})

describe('a hit', () => {
  it('is acknowledged in one word and hands itself over', async () => {
    // E is one dit, so a single keyed element completes the answer.
    render(<Harness letters={['E', 'T']} rungIndex={FREE_PRODUCTION_RUNG} />)
    key('.')

    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Correct'))
    // Nothing to press and nothing to read: a run of correct answers is not
    // gated behind a tap between each one.
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull()

    await waitFor(() => expect(answers).toHaveLength(1), { timeout: 3000 })
    expect(answers[0]).toMatchObject({ correct: true, response: '.' })
    await waitFor(() => expect(screen.getByRole('heading').textContent).toBe('T'))
  })
})

describe('a miss', () => {
  it('holds until the learner says they have read it', async () => {
    render(<Harness letters={['E', 'T']} rungIndex={FREE_PRODUCTION_RUNG} />)
    key('-')

    const correction = await screen.findByRole('status')
    expect(correction.textContent).toContain('Not that one')
    // What was keyed, on its own row against what it should have been.
    expect(correction.textContent).toContain('You keyed')
    expect(correction.textContent).toContain('Answer')
    expect(correction.querySelectorAll('.test-correction-row')).toHaveLength(2)
    expect(correction.querySelector('.test-correction-row')?.textContent).toContain('—')

    const next = (await screen.findByRole('button', { name: 'Continue' })) as HTMLButtonElement
    await waitFor(() => expect(next.disabled).toBe(false))
    // Still standing well past any dwell a hit would have had.
    await new Promise((resolve) => setTimeout(resolve, 900))
    expect(screen.getByRole('status').textContent).toContain('Not that one')
    expect(answers).toHaveLength(0)

    act(() => next.click())
    expect(answers).toHaveLength(1)
    expect(answers[0]).toMatchObject({ correct: false, response: '-' })
  })

  it('shuts the key for the whole correction and the swap out of it', async () => {
    render(<Harness letters={['E', 'T']} rungIndex={FREE_PRODUCTION_RUNG} />)
    expect(morseKey()?.disabled).toBe(false)

    key('-')
    // While a correction stands there is no key on the surface to press.
    await screen.findByRole('button', { name: 'Continue' })
    expect(morseKey()).toBeNull()

    act(() => screen.getByRole('button', { name: 'Continue' }).click())
    // The next letter is up, and its key is still shut: a finger travelling
    // through the end of one answer cannot spend it on the next question.
    expect(screen.getByRole('heading').textContent).toBe('T')
    expect(morseKey()?.disabled).toBe(true)
    key('.')
    expect(answers).toHaveLength(1)

    await waitFor(() => expect(morseKey()?.disabled).toBe(false), { timeout: 2000 })
  })
})

describe('typed reception', () => {
  it('grades on the character, with no submit to find', async () => {
    render(<Harness letters={['Q', 'R']} rungIndex={FREE_RECEPTION_RUNG} />)
    expect(screen.queryByRole('button', { name: 'Submit' })).toBeNull()

    const field = screen.getByLabelText('Which character is this?') as HTMLInputElement
    act(() => {
      field.focus()
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, 'q')
      field.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Correct'))
    await waitFor(() => expect(answers).toHaveLength(1), { timeout: 3000 })
    expect(answers[0]).toMatchObject({ correct: true, response: 'q' })
  })
})
