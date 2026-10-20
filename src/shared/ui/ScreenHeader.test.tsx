// @vitest-environment jsdom
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ScreenHeader } from './ScreenHeader'

afterEach(cleanup)

describe('ScreenHeader', () => {
  it('goes back through a quiet, named control and forwards the focusable title', () => {
    const onBack = vi.fn()
    const ref = createRef<HTMLHeadingElement>()
    render(<ScreenHeader ref={ref} title="Morse" titleClassName="topic-title" onBack={onBack} />)
    const back = screen.getByRole('button', { name: 'Back to previous screen' })
    expect(back.className).toContain('quiet')
    expect(back.textContent).toBe('← Back')
    fireEvent.click(back)
    expect(onBack).toHaveBeenCalledOnce()
    const title = screen.getByRole('heading', { level: 1, name: 'Morse' })
    expect(ref.current).toBe(title)
    expect(title.getAttribute('tabindex')).toBe('-1')
    expect(title.className).toBe('screen-header-title topic-title')
    ref.current!.focus()
    expect(document.activeElement).toBe(title)
  })

  it('names the settled bar, clamps its fill and sets the readout beside it', () => {
    const { rerender } = render(<ScreenHeader title="Morse" progress={{ value: 13, max: 26, label: '13 of 26 letters' }} readout="13 / 26" />)
    const bar = screen.getByRole('img', { name: '13 of 26 letters' })
    expect(bar.querySelector('span')!.style.width).toBe('50%')
    expect(bar.parentElement!.querySelector('.screen-header-readout')!.textContent).toBe('13 / 26')
    rerender(<ScreenHeader title="Morse" progress={{ value: 40, max: 26, label: 'all' }} />)
    expect(screen.getByRole('img', { name: 'all' }).querySelector('span')!.style.width).toBe('100%')
    rerender(<ScreenHeader title="Morse" progress={{ value: 3, max: 0, label: 'none' }} />)
    expect(screen.getByRole('img', { name: 'none' }).querySelector('span')!.style.width).toBe('0%')
    expect(document.querySelector('.screen-header-readout')).toBeNull()
  })

  it('renders only what it is given: glyph, trailing actions, readout and extra content', () => {
    const { container, rerender } = render(<ScreenHeader title="Plain" />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(container.querySelector('.screen-header-bar, .screen-header-progress, .screen-header-glyph')).toBeNull()
    const onReference = vi.fn()
    rerender(<ScreenHeader title="Plain" glyph={<svg data-testid="glyph" />} readout="Banked"
      actions={<button className="quiet" type="button" onClick={onReference}>A–Z</button>}>
      <button className="quiet" type="button">Skip ahead</button>
    </ScreenHeader>)
    expect(container.querySelector('.screen-header-glyph')!.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByTestId('glyph')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Back/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'A–Z' }))
    expect(onReference).toHaveBeenCalledOnce()
    expect(screen.getByText('Banked').className).toContain('screen-header-readout')
    // Order of the task: controls, title, reading, then anything extra.
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['A–Z', 'Skip ahead'])
  })
})
