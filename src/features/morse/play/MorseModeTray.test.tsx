// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { morseTopic } from '../../../domain/morse/__fixtures__/modeTopics'
import { MORSE_MODES, modeEntry } from '../../../domain/morse/modes'
import { MorseModeGlyph, MorseModeTray } from './MorseModeTray'

afterEach(() => cleanup())

describe('Morse mode tray', () => {
  it('names the four tiles with only their visible words and opens all of them for a fresh learner (#257)', () => {
    const topic = morseTopic()
    const onStart = vi.fn()
    render(<MorseModeTray topic={topic} onStart={onStart} />)
    const tiles = within(screen.getByRole('navigation', { name: 'Play' })).getAllByRole('button')
    expect(tiles).toHaveLength(4)
    for (const { id, label } of MORSE_MODES) {
      const tile = screen.getByRole('button', { name: label })
      expect(tile.hasAttribute('aria-disabled')).toBe(false)
      expect(tile.querySelector('.mode-tray-lock')).toBeNull()
      fireEvent.click(tile)
      expect(onStart).toHaveBeenLastCalledWith(id, modeEntry(topic, id))
      expect(onStart.mock.lastCall![1]).not.toBeNull()
    }
  })

  it('heads its section for screen readers without showing a heading', () => {
    render(<MorseModeTray topic={morseTopic()} onStart={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Play' }).className).toBe('sr-only')
  })

  it('draws the same stimulus small for a pip', () => {
    const { container } = render(<>{(['key', 'listen', 'read', 'free'] as const).map((mode) => <MorseModeGlyph key={mode} mode={mode} small />)}</>)
    expect(container.querySelector('.morse-mode-letter.is-small')?.textContent).toBe('A')
    expect(container.querySelectorAll('svg.is-small')).toHaveLength(1)
    // Read is the shared marks component at pip size: A's dit and dah (#263).
    const marks = container.querySelector('.morse-marks.is-pip')!
    expect([...marks.children].map((mark) => mark.className)).toEqual(['morse-mark is-dit', 'morse-mark is-dah'])
    expect(container.querySelector('.morse-mode-text.is-small')).not.toBeNull()
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
