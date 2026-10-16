// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { newMorsePractice, type MorsePractice } from '../../../domain/morse/practice'
import { MORSE_FEEDBACK_CORRECT_MS, MORSE_TRANSITION_MS } from '../../../domain/morse/response'
import { LetterPracticeRun } from './LetterPracticeRun'

vi.mock('../input/MorseKeyInput', () => ({
  MorseKeyInput: ({ onSubmit }: { onSubmit: (pattern: string) => void }) => (
    <div>
      <button onClick={() => onSubmit('.')}>Key correct</button>
      <button onClick={() => onSubmit('-')}>Key wrong</button>
    </div>
  ),
}))

vi.mock('../useMorseAudio', async () => {
  const React = await import('react')
  return {
    useMorseAudio: () => {
      const [sounding, setSounding] = React.useState<{ glyph: string; index: number | null } | null>(null)
      const toggle = (glyph: string) => {
        if (sounding) setSounding(null)
        else {
          setSounding({ glyph, index: null })
          window.setTimeout(() => setSounding(null), 100)
        }
      }
      return { sounding, audioError: null, clearError: vi.fn(), play: vi.fn(), stop: () => setSounding(null), toggle }
    },
  }
})

const empty = newMorsePractice()

beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.useRealTimers() })

function renderRun(initialProgress: MorsePractice = empty) {
  const onProgress = vi.fn()
  const onExit = vi.fn()
  const onAnother = vi.fn()
  render(<LetterPracticeRun eligible={['E']} initialProgress={initialProgress} onProgress={onProgress} onExit={onExit} onAnother={onAnother} />)
  return { onProgress, onExit, onAnother }
}

function finishCorrectDwell() {
  act(() => vi.advanceTimersByTime(MORSE_FEEDBACK_CORRECT_MS + MORSE_TRANSITION_MS))
}

describe('LetterPracticeRun', () => {
  it('does not count a helped answer as an independent outcome', () => {
    const { onProgress } = renderRun()
    fireEvent.click(screen.getByRole('button', { name: 'Help' }))
    expect(document.querySelector('.morse-character-support')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Key correct' }))
    expect(screen.getByRole('status').textContent).toBe('Correct')
    expect(onProgress).toHaveBeenCalled()
    expect(onProgress.mock.lastCall?.[0].characters.key.E?.outcomes).toEqual([])
  })

  it('keeps a wrong answer visible until Continue is chosen', () => {
    const { onProgress } = renderRun()
    fireEvent.click(screen.getByRole('button', { name: 'Key wrong' }))
    expect(screen.getByRole('status').textContent).toBe('Try this letter')
    expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false)
    act(() => vi.advanceTimersByTime(5_000))
    expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.getByText('1 / 10')).toBeTruthy()
    expect(onProgress.mock.lastCall?.[0].characters.key.E?.outcomes).toEqual([false])
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('2 / 10')).toBeTruthy()
  })

  it('requires replay after a page interruption or stopping the listening stimulus', () => {
    const { onProgress } = renderRun()
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play Morse sound' }))
    fireEvent(window, new Event('pagehide'))
    act(() => vi.advanceTimersByTime(100))
    expect((screen.getByRole('textbox', { name: 'Letter' }) as HTMLInputElement).disabled).toBe(true)
    expect(onProgress).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Play Morse sound' }))
    fireEvent.click(screen.getByRole('button', { name: 'Stop Morse sound' }))
    act(() => vi.advanceTimersByTime(100))
    expect((screen.getByRole('textbox', { name: 'Letter' }) as HTMLInputElement).disabled).toBe(true)
    expect(onProgress).not.toHaveBeenCalled()
  })

  it('advances after a correct answer and keeps each direction in its own store', () => {
    const { onProgress } = renderRun()
    fireEvent.click(screen.getByRole('button', { name: 'Read' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Letter' }), { target: { value: 'E' } })
    expect(onProgress.mock.lastCall?.[0].characters.read.E?.outcomes).toEqual([true])
    expect(onProgress.mock.lastCall?.[0].characters.key.E).toBeUndefined()
    finishCorrectDwell()
    expect(screen.getByText('2 / 10')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Listen' }))
    act(() => vi.advanceTimersByTime(MORSE_TRANSITION_MS))
    fireEvent.click(screen.getByRole('button', { name: 'Play Morse sound' }))
    expect((screen.getByRole('textbox', { name: 'Letter' }) as HTMLInputElement).disabled).toBe(true)
    act(() => vi.advanceTimersByTime(100))
    expect((screen.getByRole('textbox', { name: 'Letter' }) as HTMLInputElement).disabled).toBe(false)
    fireEvent.change(screen.getByRole('textbox', { name: 'Letter' }), { target: { value: 'E' } })
    expect(onProgress.mock.lastCall?.[0].characters.listen.E?.outcomes).toEqual([true])
    expect(onProgress.mock.lastCall?.[0].characters.read.E?.outcomes).toEqual([true])
    expect(onProgress.mock.lastCall?.[0].characters.key.E).toBeUndefined()
  })
})
