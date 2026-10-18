// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { PaletteSheet } from './PaletteSheet'

afterEach(cleanup)

describe('the development palette sheet', () => {
  it('loads the requested candidate and updates the URL on selection', () => {
    window.history.replaceState(null, '', '/?palette=sheet&candidate=signal')
    const { container } = render(<PaletteSheet />)
    const candidates = screen.getByRole('group', { name: 'Palette candidate' })
    expect(within(candidates).getByRole('button', { name: 'Signal' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(within(candidates).getByRole('button', { name: 'Peacock' }))
    expect(new URLSearchParams(window.location.search).get('candidate')).toBe('peacock')
    expect(new URLSearchParams(window.location.search).get('palette')).toBe('sheet')
    expect(container.querySelector('.palette-sheet')?.getAttribute('data-candidate')).toBe('peacock')
    expect(screen.getAllByRole('table')).toHaveLength(2)
    expect(container.querySelectorAll('.palette-swatch')).toHaveLength(66)
  })

  it('applies a vision filter to the entire sheet and can remove it', () => {
    window.history.replaceState(null, '', '/?palette=sheet&candidate=families')
    const { container } = render(<PaletteSheet />)
    const vision = screen.getByRole('group', { name: 'Colour vision simulation' })
    fireEvent.click(within(vision).getByRole('button', { name: 'Deuteranopia' }))
    expect((container.querySelector('.palette-sheet') as HTMLElement).style.filter).toContain('#palette-deuteranopia')
    fireEvent.click(within(vision).getByRole('button', { name: 'Protanopia' }))
    expect((container.querySelector('.palette-sheet') as HTMLElement).style.filter).toContain('#palette-protanopia')
    fireEvent.click(within(vision).getByRole('button', { name: 'None' }))
    expect((container.querySelector('.palette-sheet') as HTMLElement).style.filter).toBe('')
  })

  it('falls back to the control and keeps missing mode hues explicit', () => {
    window.history.replaceState(null, '', '/?palette=sheet&candidate=unknown')
    const { container } = render(<PaletteSheet />)
    expect(container.querySelector('.palette-sheet')?.getAttribute('data-candidate')).toBe('current')
    expect(screen.getByText('Current control · No mode hues')).toBeTruthy()
    expect(container.querySelectorAll('.palette-swatch')).toHaveLength(42)
    const morse = screen.getByRole('region', { name: 'Morse' })
    expect(within(morse).getByRole('button', { name: 'Key' })).toBeTruthy()
    expect(within(morse).getByText('◆ Needs repair')).toBeTruthy()
  })
})
