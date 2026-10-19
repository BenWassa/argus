// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { ModeTray, type ModeTile } from './ModeTray'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function tiles(onSelect = vi.fn()): ModeTile[] {
  return [
    { id: 'key', label: 'Key', stimulus: <span>A</span>, colour: 'var(--mode-key)', ink: 'var(--mode-key-ink)', onSelect: () => onSelect('key') },
    { id: 'free', label: 'Free play', stimulus: <span>HI</span>, colour: 'var(--mode-free)', ink: 'var(--mode-free-ink)', disabled: true, onSelect: () => onSelect('free') },
  ]
}

describe('ModeTray', () => {
  it('names a landmark of solid tiles by their words alone, each in its own colour pair', () => {
    render(<ModeTray tiles={tiles()} label="Play" className="extra" />)
    const nav = screen.getByRole('navigation', { name: 'Play' })
    expect(nav.parentElement!.className).toBe('mode-tray-dock extra')
    const buttons = within(nav).getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual(['AKey', 'HIFree play'])
    const key = screen.getByRole('button', { name: 'Key' })
    expect(key.style.getPropertyValue('--tile-fill')).toBe('var(--mode-key)')
    expect(key.style.getPropertyValue('--tile-ink')).toBe('var(--mode-key-ink)')
    expect(key.querySelector('.mode-tray-stimulus')!.getAttribute('aria-hidden')).toBe('true')
    expect(key.querySelector('.mode-tray-lock')).toBeNull()
  })

  it('forwards an enabled tap and keeps a locked tile inert behind a lock', () => {
    const onSelect = vi.fn()
    render(<ModeTray tiles={tiles(onSelect)} label="Play" />)
    fireEvent.click(screen.getByRole('button', { name: 'Key' }))
    const free = screen.getByRole('button', { name: 'Free play' })
    expect(free.getAttribute('aria-disabled')).toBe('true')
    expect(free.querySelector('.mode-tray-lock')).not.toBeNull()
    fireEvent.click(free)
    expect(onSelect.mock.calls).toEqual([['key']])
  })

  it('reserves its own height on its parent while fixed, and clears it on unmount', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ position: 'fixed' } as CSSStyleDeclaration)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ height: 104 } as DOMRect)
    const { container, unmount } = render(<ModeTray tiles={tiles()} label="Play" />)
    expect(container.style.getPropertyValue('--mode-tray-height')).toBe('104px')
    unmount()
    expect(container.style.getPropertyValue('--mode-tray-height')).toBe('')
    vi.restoreAllMocks()
  })

  it('reserves nothing when in flow on desktop', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ position: 'static' } as CSSStyleDeclaration)
    const { container } = render(<ModeTray tiles={tiles()} label="Play" />)
    expect(container.style.getPropertyValue('--mode-tray-height')).toBe('0px')
    vi.restoreAllMocks()
  })

  it('stacks under a sticky header before it when sticky itself, so the header stays in view (#263)', () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) =>
      ({ position: (element as HTMLElement).dataset.sticky || (element as HTMLElement).classList.contains('mode-tray-dock') ? 'sticky' : 'static' }) as CSSStyleDeclaration)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return { height: this.dataset.sticky ? 72 : this.tagName === 'P' ? 500 : 105 } as DOMRect
    })
    const { container } = render(<><header data-sticky="yes">Title</header><p>Not sticky</p><ModeTray tiles={tiles()} label="Play" /></>)
    const dock = container.querySelector<HTMLElement>('.mode-tray-dock')!
    expect(dock.style.getPropertyValue('--mode-tray-top')).toBe('72px')
    expect(container.style.getPropertyValue('--mode-tray-height')).toBe('0px')
    vi.restoreAllMocks()
  })

  it('docks above phone navigation, pads its host, shortens on small phones and sticks on desktop', () => {
    const css = readFileSync('src/shared/ui/ModeTray.css', 'utf8')
    expect(css).toMatch(/\.mode-tray-dock \{[^}]*position: fixed;[^}]*bottom: var\(--nav-clearance/)
    expect(css).toMatch(/:has\(> \.mode-tray-dock\) \{\s*padding-bottom: calc\(var\(--mode-tray-height/)
    expect(css).toMatch(/@media \(min-width: 980px\) \{[^}]*\.mode-tray-dock \{ position: sticky; top: var\(--mode-tray-top, 0px\);/)
    expect(css).toMatch(/min-height: 88px/)
    // A third of a 568px phone went to the tray and the nav (#259).
    expect(css).toMatch(/@media \(max-height: 700px\), \(max-width: 360px\) \{[\s\S]*?min-height: 64px/)
    expect(css).not.toMatch(/rgba?\(|gradient|oklch\(/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
  })
})
