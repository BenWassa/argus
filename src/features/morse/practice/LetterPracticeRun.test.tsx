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
  it('gives Key entry focus to its single session heading', () => {
    renderRun()
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Key' }))
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it.each(['read', 'listen'] as const)('focuses the %s entry when it becomes ready on direct launch', direction => {
    render(<LetterPracticeRun direction={direction} eligible={['E']} onProgress={vi.fn()} onExit={vi.fn()} onAnother={vi.fn()} />)
    if (direction === 'listen') {
      fireEvent.click(screen.getByRole('button', { name: 'Play Morse sound' }))
      act(() => vi.advanceTimersByTime(100))
    }
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Letter' }))
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('keeps Read and ready Listen focus on their entry field', () => {
    renderRun()
    fireEvent.click(screen.getByRole('button', { name: 'Read' }))
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Letter' }))
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play Morse sound' }))
    act(() => vi.advanceTimersByTime(100))
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Letter' }))
  })

  it('does not count a helped answer as an independent outcome', () => {
    const { onProgress } = renderRun()
    fireEvent.click(screen.getByRole('button', { name: 'Help' }))
    expect(document.querySelector('.morse-character-support')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Key correct' }))
    expect(screen.getByText('Correct')).toBeTruthy()
    expect(onProgress).toHaveBeenCalled()
    expect(onProgress.mock.lastCall?.[0].characters.key.E?.outcomes).toEqual([])
  })

  it('keeps a wrong answer visible until Continue is chosen', () => {
    const { onProgress } = renderRun()
    fireEvent.click(screen.getByRole('button', { name: 'Key wrong' }))
    // The shared miss (#263): the verdict, what was keyed, the answer, and the stimulus still above it.
    const miss = screen.getByRole('status')
    expect(miss.className).toContain('session-miss')
    expect(miss.textContent).toContain('Not that one')
    expect(miss.textContent).toContain('You keyed')
    expect(miss.querySelector('.session-miss-said-value .morse-mark.is-dah')).toBeTruthy()
    expect(document.querySelector('.letter-practice-stimulus .lesson-glyph')?.textContent).toBe('E')
    expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false)
    act(() => vi.advanceTimersByTime(5_000))
    expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.getByRole('progressbar', { name: '1 of 10' })).toBeTruthy()
    expect(onProgress.mock.lastCall?.[0].characters.key.E?.outcomes).toEqual([false])
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('progressbar', { name: '2 of 10' })).toBeTruthy()
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

  it('draws Read with the shared marks and keeps them above a miss that says what was given', () => {
    renderRun()
    fireEvent.click(screen.getByRole('button', { name: 'Read' }))
    const marks = screen.getByRole('img', { name: 'dit' })
    expect(marks.className).toContain('morse-marks is-stimulus')
    fireEvent.change(screen.getByRole('textbox', { name: 'Letter' }), { target: { value: 'q' } })
    const miss = screen.getByRole('status')
    expect(miss.textContent).toContain('Not that one')
    expect(miss.querySelector('.session-miss-said-label')?.textContent).toBe('You said')
    expect(miss.querySelector('.session-miss-said-value')?.textContent).toBe('Q')
    expect(screen.getByRole('img', { name: 'dit' })).toBe(marks)
    expect(miss.compareDocumentPosition(marks) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
  })

  it('advances after a correct answer and keeps each direction in its own store', () => {
    const { onProgress } = renderRun()
    fireEvent.click(screen.getByRole('button', { name: 'Read' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Letter' }), { target: { value: 'E' } })
    expect(onProgress.mock.lastCall?.[0].characters.read.E?.outcomes).toEqual([true])
    expect(onProgress.mock.lastCall?.[0].characters.key.E).toBeUndefined()
    finishCorrectDwell()
    expect(screen.getByRole('progressbar', { name: '2 of 10' })).toBeTruthy()

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
