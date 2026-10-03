// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { LearnContent } from '../../domain/learning/content'
import { SourcesAndLimits } from './SourcesAndLimits'

afterEach(cleanup)

const both: LearnContent = {
  kind: 'concise',
  limitations: ['Memory support only.', 'Not a course.'],
  sources: [
    { label: 'Reference', url: 'https://example.com/reference', note: 'Primary text.' },
    { label: 'Unlinked source' },
  ],
}

describe('sources and limitations control', () => {
  it('renders nothing for a topic with neither', () => {
    const { container } = render(<SourcesAndLimits content={{ kind: 'concise' }} />)
    expect(container.innerHTML).toBe('')
  })

  it('names the button for what it holds', () => {
    render(<SourcesAndLimits content={both} />)
    expect(screen.getByRole('button', { name: 'Sources and limitations' })).toBeTruthy()
    cleanup()
    render(<SourcesAndLimits content={{ kind: 'concise', sources: both.sources }} />)
    expect(screen.getByRole('button', { name: 'Sources' })).toBeTruthy()
    cleanup()
    render(<SourcesAndLimits content={{ kind: 'concise', limitations: both.limitations }} />)
    expect(screen.getByRole('button', { name: 'Limitations' })).toBeTruthy()
  })

  it('shows nothing until opened, then limitations as bullets followed by every source', () => {
    render(<SourcesAndLimits content={both} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.textContent).not.toContain('Memory support only.')

    fireEvent.click(screen.getByRole('button', { name: 'Sources and limitations' }))
    const dialog = screen.getByRole('dialog', { name: 'Sources and limitations' })
    expect(dialog.closest('.backdrop')?.classList.contains('is-centred')).toBe(true)
    expect([...dialog.querySelectorAll('ul li')].map((li) => li.textContent)).toEqual(['Memory support only.', 'Not a course.'])
    const link = dialog.querySelector('a')!
    expect(link.getAttribute('href')).toBe('https://example.com/reference')
    expect(link.getAttribute('rel')).toBe('noreferrer')
    expect(dialog.textContent).toContain('Primary text.')
    expect(dialog.textContent).toContain('Unlinked source')
    // Limitations come first, so the caveat is read before the citations.
    expect(dialog.textContent!.indexOf('Memory support only.')).toBeLessThan(dialog.textContent!.indexOf('Reference'))
  })

  it('closes from the close button and returns focus to the control', async () => {
    render(<SourcesAndLimits content={both} />)
    const opener = screen.getByRole('button', { name: 'Sources and limitations' })
    opener.focus()
    fireEvent.click(opener)
    fireEvent.click(screen.getByRole('button', { name: 'Close sources and limitations' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
    expect(document.activeElement).toBe(opener)
  })

  it('closes on Escape', () => {
    render(<SourcesAndLimits content={both} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sources and limitations' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
