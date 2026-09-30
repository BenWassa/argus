// @vitest-environment jsdom
import { useLayoutEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ChoiceCard } from './ChoiceCard'
import type { Item } from '../../domain/library/topic'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const item: Item = {
  id: 'item-1',
  kind: 'forward',
  prompt: 'Which way is the pointer facing?',
  answer: 'East',
  choice: { options: ['North', 'East', 'South', 'West'] },
  stimulus: {
    source: { kind: 'figure', figure: { kind: 'angle-dial', pointers: [{ bearing: 90 }] } },
    alt: 'A dial with one pointer.',
    caption: 'This caption would give the answer away: East.',
  },
}

function open(onAnswer = vi.fn()) {
  render(<ChoiceCard item={item} cardKey="k1" onAnswer={onAnswer} />)
  return onAnswer
}

describe('ChoiceCard', () => {
  it('shows the stimulus and every option, but not the stimulus caption', () => {
    open()
    expect(screen.getByRole('img', { name: 'A dial with one pointer.' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(item.prompt)
    for (const option of item.choice!.options) expect(screen.getByRole('button', { name: option })).toBeTruthy()
    expect(document.body.textContent).not.toContain('give the answer away')
  })

  it('grades a correct choice objectively and hands it over after the dwell', () => {
    vi.useFakeTimers()
    const onAnswer = open()
    fireEvent.click(screen.getByRole('button', { name: 'East' }))
    expect(screen.getByText('Correct')).toBeTruthy()
    expect(onAnswer).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(onAnswer.mock.calls[0][0]).toMatchObject({ correct: true, response: 'East' })
  })

  it('holds a miss until the learner continues, showing choice and answer', () => {
    vi.useFakeTimers()
    const onAnswer = open()
    fireEvent.click(screen.getByRole('button', { name: 'West' }))
    expect(screen.getByText('Not that one')).toBeTruthy()
    expect(screen.getByText('You chose').parentElement?.textContent).toContain('West')
    expect(screen.getByText('Answer').parentElement?.textContent).toContain('East')
    act(() => { vi.advanceTimersByTime(10_000) })
    expect(onAnswer).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(onAnswer.mock.calls[0][0]).toMatchObject({ correct: false, response: 'West' })
  })

  it('grades one answer only, however many presses follow', () => {
    vi.useFakeTimers()
    const onAnswer = open()
    fireEvent.click(screen.getByRole('button', { name: 'East' }))
    fireEvent.click(screen.getByRole('button', { name: 'West' }))
    fireEvent.click(screen.getByRole('button', { name: 'East' }))
    act(() => { vi.advanceTimersByTime(3000) })
    expect(onAnswer).toHaveBeenCalledTimes(1)
  })

  it('disables the options once one is chosen', () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: 'South' }))
    for (const option of item.choice!.options) {
      expect((screen.getByRole('button', { name: option }) as HTMLButtonElement).disabled).toBe(true)
    }
  })
})

describe('swapping to the next card', () => {
  /**
   * `rerender` flushes passive effects inside `act`, so looking only afterwards
   * cannot see a stale first frame. This probe records the DOM at every commit,
   * before any passive effect has had a chance to reset state.
   */
  function Probe({ card, cardKey, seen }: { card: Item; cardKey: string; seen: boolean[] }) {
    useLayoutEffect(() => {
      seen.push(document.querySelector('.test-feedback') !== null)
    })
    return <ChoiceCard item={card} cardKey={cardKey} onAnswer={() => undefined} />
  }

  it('never shows the previous answer’s feedback under the next question, not even for one frame', () => {
    const other: Item = { ...item, id: 'item-2', prompt: 'And this one?', answer: 'South' }
    const seen: boolean[] = []
    const { rerender } = render(<Probe card={item} cardKey="one" seen={seen} />)
    fireEvent.click(screen.getByRole('button', { name: 'West' }))
    expect(screen.getByText('Not that one')).toBeTruthy()

    seen.length = 0
    rerender(<Probe card={other} cardKey="two" seen={seen} />)
    expect(seen[0]).toBe(false)
    expect(screen.queryByText('Not that one')).toBeNull()
    for (const option of other.choice!.options) {
      expect((screen.getByRole('button', { name: option }) as HTMLButtonElement).className).not.toMatch(/is-(answer|wrong)/)
    }
  })
})
