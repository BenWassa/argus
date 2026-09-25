// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FREE_LETTER_PAUSE_MS } from '../../../domain/morse/fluency/freePlay'
import { FreePlay } from './FreePlay'

afterEach(cleanup)

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
    // One element at a time: the key takes the next once the last has landed.
    await waitFor(() => expect(document.querySelector('.morse-key:enabled')).toBeTruthy())
  }
  await waitFor(() => expect(document.querySelector('.free-play-cursor')).toBeNull(), {
    timeout: FREE_LETTER_PAUSE_MS * 3,
  })
}

describe('free play', () => {
  it('turns keyed letters and gaps into words', async () => {
    render(<FreePlay rung={6} onExit={() => undefined} />)
    await letter('.', '.', '.', '.')
    await letter('.', '.')
    key(' ')
    await letter('-')
    expect(spelled()).toBe('Spelled: HI T')
  }, 15000)

  it('deletes the last thing keyed', async () => {
    render(<FreePlay rung={6} onExit={() => undefined} />)
    await letter('.')
    await letter('-')
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(spelled()).toBe('Spelled: E')
  }, 10000)

  it('plays typed text and names what it cannot play', () => {
    render(<FreePlay rung={6} onExit={() => undefined} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Hear it' }))
    fireEvent.change(screen.getByLabelText('Text to hear'), { target: { value: 'hi & bye' } })
    expect(screen.getByText(/No Morse here for &/)).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Play' }) as HTMLButtonElement).disabled).toBe(false)
  })
})
