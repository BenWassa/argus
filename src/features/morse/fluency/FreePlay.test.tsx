// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FREE_LETTER_PAUSE_MS } from '../../../domain/morse/fluency/freePlay'
import { FreePlay } from './FreePlay'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function key(element: '.' | '-' | ' ') {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: element }))
  })
}

function spelled(): string {
  return document.querySelector('.free-play-output')?.getAttribute('aria-label') ?? ''
}

async function letter(...elements: ('.' | '-')[]) {
  for (const element of elements) {
    key(element)
    expect(document.querySelector('.morse-key:enabled')).toBeTruthy()
  }
  // Wall-clock stalls between elements must not accidentally finish a letter
  // in the test. Exercise the real pause boundary with a controlled clock.
  await act(async () => { await vi.advanceTimersByTimeAsync(FREE_LETTER_PAUSE_MS - 1) })
  expect(document.querySelector('.free-play-cursor')).not.toBeNull()
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  expect(document.querySelector('.free-play-cursor')).toBeNull()
}

describe('free play', () => {
  it('turns keyed letters and gaps into words', async () => {
    render(<FreePlay rung={6} onExit={() => undefined} />)
    await letter('.', '.', '.', '.')
    await letter('.', '.')
    key(' ')
    await letter('-')
    expect(spelled()).toBe('Spelled: HI T')
  })

  it('deletes the last thing keyed', async () => {
    render(<FreePlay rung={6} onExit={() => undefined} />)
    await letter('.')
    await letter('-')
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(spelled()).toBe('Spelled: E')
  })

  it('plays typed text and names what it cannot play', () => {
    render(<FreePlay rung={6} onExit={() => undefined} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Hear it' }))
    fireEvent.change(screen.getByLabelText('Text to hear'), { target: { value: 'hi & bye' } })
    expect(screen.getByText(/No Morse here for &/)).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Play' }) as HTMLButtonElement).disabled).toBe(false)
  })
})
