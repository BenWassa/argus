// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { newFluencyProgress } from '../../../domain/morse/fluency/progress'
import { fluencyRunLength } from '../../../domain/morse/fluency/session'
import { MORSE_FEEDBACK_CORRECT_MS, MORSE_TRANSITION_MS } from '../../../domain/morse/response'
import { FluencyRun } from './FluencyRun'

vi.mock('../input/MorseWordKeyInput', () => ({
  MorseWordKeyInput: ({ onSubmit, locked }: { onSubmit: (patterns: string[]) => void; locked: boolean }) => <>
    <button disabled={locked} onClick={() => onSubmit(['.'])}>Correct pattern</button>
    <button disabled={locked} onClick={() => onSubmit(['-'])}>Wrong pattern</button>
  </>,
}))

afterEach(() => { cleanup(); vi.useRealTimers() })

describe('Fluency round boundary', () => {
  it('holds the final correction before the result and starts Again with a fresh local round', () => {
    vi.useFakeTimers()
    const onProgress = vi.fn(), onExit = vi.fn()
    render(<FluencyRun mode="sprint" rung={6} progress={newFluencyProgress()} only={['E']} onProgress={onProgress} onExit={onExit} />)
    const length = fluencyRunLength('sprint')
    for (let at = 0; at < length - 1; at++) {
      fireEvent.click(screen.getByRole('button', { name: 'Correct pattern' }))
      act(() => vi.advanceTimersByTime(MORSE_FEEDBACK_CORRECT_MS + MORSE_TRANSITION_MS))
    }
    fireEvent.click(screen.getByRole('button', { name: 'Wrong pattern' }))
    act(() => vi.advanceTimersByTime(10_000))
    expect(document.querySelector('.morse-character-support')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Again' })).toBeNull()
    expect(onProgress).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    act(() => vi.advanceTimersByTime(MORSE_TRANSITION_MS))
    expect(screen.getByRole('heading', { name: `${length - 1} of ${length} correct` })).toBeTruthy()
    expect(onProgress).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Again' }))
    act(() => vi.advanceTimersByTime(MORSE_TRANSITION_MS))
    expect(screen.getByRole('progressbar', { name: `1 of ${length}` })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Correct pattern' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Again' })).toBeNull()
    expect(onExit).not.toHaveBeenCalled()
  })
})
