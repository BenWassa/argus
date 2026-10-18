// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { morseTopic } from '../../../domain/morse/__fixtures__/modeTopics'
import { MORSE_MODES, modeEntry } from '../../../domain/morse/modes'
import { MorseModeTray } from './MorseModeTray'

afterEach(() => cleanup())

describe('Morse mode tray', () => {
  it('names the four tiles with only their visible words and keeps locked tiles inert', () => {
    const onStart = vi.fn()
    render(<MorseModeTray topic={morseTopic()} onStart={onStart} />)
    const tiles = within(screen.getByRole('navigation', { name: 'Play' })).getAllByRole('button')
    expect(tiles).toHaveLength(4)
    for (const { label } of MORSE_MODES) {
      const tile = screen.getByRole('button', { name: label })
      expect(tile.getAttribute('aria-disabled')).toBe('true')
      expect(tile.querySelector('.morse-mode-lock')).not.toBeNull()
      fireEvent.click(tile)
    }
    expect(onStart).not.toHaveBeenCalled()
  })

  it.each(MORSE_MODES)('forwards one $label tap with the domain entry', ({ id, label }) => {
    const topic = morseTopic(5)
    const onStart = vi.fn()
    render(<MorseModeTray topic={topic} onStart={onStart} />)
    const tile = screen.getByRole('button', { name: label })
    expect(tile.hasAttribute('aria-disabled')).toBe(false)
    fireEvent.click(tile)
    expect(onStart).toHaveBeenCalledExactlyOnceWith(id, modeEntry(topic, id))
  })
})
