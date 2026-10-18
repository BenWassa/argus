// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { ProgressSpine, type SpineRow } from './ProgressSpine'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function rows(onSelect = vi.fn(), onPip = vi.fn()): SpineRow[] {
  return [
    { id: 'one', shape: 'round', mark: '✓', state: 'done', label: 'One', accessibleLabel: 'One, done', onSelect: () => onSelect('one') },
    { id: 'two', shape: 'round', mark: 2, state: 'reached', label: 'Two', trailing: 'Step 2', accessibleLabel: 'Two, reached', onSelect: () => onSelect('two') },
    { id: 'check', shape: 'square', mark: 'A–Z', state: 'repair', plate: true, label: 'Check', detail: '◆ Needs repair', accessibleLabel: 'Check, needs repair', onSelect: () => onSelect('check'),
      after: <button className="quiet" type="button">Extra</button> },
    { id: 'three', shape: 'round', mark: 3, state: 'locked', label: 'Three', accessibleLabel: 'Three, locked', onSelect: () => onSelect('three') },
    { id: 'tier', shape: 'round', state: 'reached', plate: true, group: true, label: 'Tier', accessibleLabel: 'Tier, reached',
      trailing: <button type="button" aria-label="Tier pip" onClick={onPip} /> },
  ]
}

describe('ProgressSpine', () => {
  it('renders every row in order as a named control, with shapes, plates and details', () => {
    const { container } = render(<ProgressSpine rows={rows()} label="Course path" positionId="two" />)
    const items = within(screen.getByRole('list', { name: 'Course path' })).getAllByRole('listitem')
    expect(items.map((item) => item.dataset.nodeId)).toEqual(['one', 'two', 'check', 'three', 'tier'])
    for (const name of ['One, done', 'Two, reached', 'Check, needs repair', 'Three, locked']) expect(screen.getByRole('button', { name })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Tier, reached' })).toBeTruthy()
    const check = screen.getByRole('button', { name: 'Check, needs repair' })
    expect(check.className).toBe('spine-row is-repair is-plate')
    expect(check.querySelector('.spine-node-square')!.textContent).toBe('A–Z')
    expect(check.querySelector('.spine-detail')!.textContent).toBe('◆ Needs repair')
    expect(screen.getByRole('button', { name: 'Two, reached' }).querySelector('.spine-trailing')!.textContent).toBe('Step 2')
    expect(container.querySelectorAll('[data-spine-node]')).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Extra' }).closest('li')!.dataset.nodeId).toBe('check')
  })

  it('marks one position without making it the only thing to press', () => {
    const onSelect = vi.fn()
    const { container } = render(<ProgressSpine rows={rows(onSelect)} label="Path" positionId="two" />)
    const current = container.querySelectorAll('[aria-current="step"]')
    expect(current).toHaveLength(1)
    expect(current[0].className).toContain('is-position')
    expect(current[0].textContent).not.toContain('Start')
    for (const name of ['One, done', 'Two, reached', 'Check, needs repair']) fireEvent.click(screen.getByRole('button', { name }))
    expect(onSelect.mock.calls.map(([id]) => id)).toEqual(['one', 'two', 'check'])
  })

  it('takes the position from a row state when no id is given', () => {
    const list = rows().map((row) => row.id === 'one' ? { ...row, state: 'position' as const } : row)
    const { container } = render(<ProgressSpine rows={list} label="Path" />)
    expect(container.querySelector('[aria-current="step"]')!.getAttribute('aria-label')).toBe('One, done')
  })

  it('keeps locked rows aria-disabled and inert, while group controls stay the consumer’s', () => {
    const onSelect = vi.fn()
    const onPip = vi.fn()
    const list = rows(onSelect, onPip)
    list[4] = { ...list[4], state: 'locked' }
    render(<ProgressSpine rows={list} label="Path" />)
    const locked = screen.getByRole('button', { name: 'Three, locked' })
    expect(locked.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(locked)
    expect(onSelect).not.toHaveBeenCalled()
    const group = screen.getByRole('group', { name: 'Tier, reached' })
    expect(group.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(group)
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(within(group).getByRole('button', { name: 'Tier pip' }))
    expect(onPip).toHaveBeenCalledOnce()
  })

  it('measures the spine to the position node, or to the last done row', () => {
    const { container, rerender } = render(<ProgressSpine rows={rows()} label="Path" positionId="check" />)
    const list = container.querySelector<HTMLElement>('.spine')!
    for (const name of ['--spine-top', '--spine-current', '--spine-bottom']) expect(list.style.getPropertyValue(name)).toMatch(/px$/)
    rerender(<ProgressSpine rows={rows()} label="Path" />)
    expect(list.style.getPropertyValue('--spine-current')).toMatch(/px$/)
  })

  it('jumps instantly on arrival only, and offers one return pill while the position is off screen', () => {
    let report: IntersectionObserverCallback = () => {}
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { report = callback }
      observe = observe
      disconnect = disconnect
    })
    const scrollIntoView = vi.fn()
    const original = HTMLElement.prototype.scrollIntoView
    HTMLElement.prototype.scrollIntoView = scrollIntoView
    const { rerender, unmount } = render(<ProgressSpine rows={rows()} label="Path" positionId="two" jump="Two" />)
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'center', behavior: 'instant' })
    expect(observe).toHaveBeenCalledWith(screen.getByRole('button', { name: 'Two, reached' }))
    rerender(<ProgressSpine rows={rows()} label="Path" positionId="two" jump="Two" />)
    expect(scrollIntoView).toHaveBeenCalledOnce()
    const visibility = (isIntersecting: boolean, top: number) => act(() => report([
      { isIntersecting, boundingClientRect: { top }, rootBounds: { top: 0 } } as IntersectionObserverEntry,
    ], {} as IntersectionObserver))
    visibility(false, 1000)
    fireEvent.click(screen.getByRole('button', { name: 'Two ↓' }))
    expect(scrollIntoView).toHaveBeenCalledTimes(2)
    visibility(false, -100)
    expect(screen.getByRole('button', { name: 'Two ↑' })).toBeTruthy()
    visibility(true, 100)
    expect(document.querySelector('.spine-jump')).toBeNull()
    unmount()
    expect(disconnect).toHaveBeenCalled()
    HTMLElement.prototype.scrollIntoView = original
  })

  it('adds no pill or observer without a jump label, and survives missing observer APIs', () => {
    const observer = vi.fn()
    vi.stubGlobal('IntersectionObserver', observer)
    const { unmount } = render(<ProgressSpine rows={rows()} label="Path" positionId="two" />)
    expect(observer).not.toHaveBeenCalled()
    unmount()
    vi.stubGlobal('IntersectionObserver', undefined)
    vi.stubGlobal('ResizeObserver', undefined)
    render(<ProgressSpine rows={rows()} label="Path" positionId="two" jump="Two" />)
    expect(document.querySelector('.spine-jump')).toBeNull()
  })

  it('draws done in the action colour and ahead in --spine-ahead, solid and reduced-motion safe', () => {
    const css = readFileSync('src/shared/ui/ProgressSpine.css', 'utf8')
    expect(css).toMatch(/\.spine::after \{[^}]*background: var\(--action\)/)
    expect(css).toMatch(/\.spine::after \{[^}]*height: calc\(var\(--spine-bottom\) - var\(--spine-top\)\);\s*background: var\(--spine-ahead\)/)
    expect(css).not.toMatch(/rgba?\(|gradient|oklch\(/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
  })
})
