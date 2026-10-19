// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { modeTopicFixtures, morseTopic } from '../../../domain/morse/__fixtures__/modeTopics'
import { morseProgressPath } from '../../../domain/morse/curriculum/progressPath'
import { MorseProgressPath } from './MorseProgressPath'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Morse progress path', () => {
  it.each(['fresh', 'mid', 'banked', 'repair'])('renders every %s node in order with one current action', (state) => {
    const topic = modeTopicFixtures()[state]
    const path = morseProgressPath(topic)!
    const onAction = vi.fn()
    const { container } = render(<MorseProgressPath topic={topic} onAction={onAction} />)
    const rows = within(screen.getByRole('list', { name: 'Course path' })).getAllByRole('listitem')
    expect(rows.map((row) => row.dataset.nodeId)).toEqual(path.nodes.map((node) => node.id))
    for (const node of path.nodes) {
      expect(screen.getByRole(node.kind === 'tier' ? 'group' : 'button', { name: node.accessibleLabel })).toBeTruthy()
    }
    const current = container.querySelectorAll('[aria-current="step"]')
    expect(current).toHaveLength(1)
    expect(current[0].getAttribute('aria-label')).toBe(path.nodes.find((node) => node.id === path.currentNodeId)!.accessibleLabel)
    fireEvent.click(current[0])
    expect(onAction).toHaveBeenCalledExactlyOnceWith(path.nodes.find((node) => node.id === path.currentNodeId)!.action)
  })

  it.each(['fresh', 'mid', 'banked'])('marks the %s position without a Start chip (#242)', (state) => {
    const { container } = render(<MorseProgressPath topic={modeTopicFixtures()[state]} onAction={vi.fn()} />)
    const current = container.querySelector('[aria-current="step"]')!
    expect(current.classList.contains('is-position')).toBe(true)
    expect(container.querySelector('.morse-progress-go')).toBeNull()
    expect(current.textContent).not.toMatch(/\bStart\b/)
  })

  it('gives milestones square nodes, uppercase names, distinct marks and a named repair state', () => {
    render(<MorseProgressPath topic={modeTopicFixtures().repair} onAction={vi.fn()} />)
    for (const label of screen.getAllByText('WORD CHECK')) {
      expect(label.closest('button')!.querySelector('.spine-node-square svg')).not.toBeNull()
    }
    // The A–Z Test is told apart from a word check by its own mark, not by colour.
    const test = screen.getByText('A–Z TEST').closest('button')!.querySelector('.spine-node-square')!
    expect(test.textContent).toBe('A–Z')
    expect(test.querySelector('svg')).toBeNull()
    expect(screen.getByText('◆ Needs repair')).toBeTruthy()
  })

  it('keeps locked rows and pips from starting anything, and says why in one line (#257)', () => {
    const onAction = vi.fn()
    const topic = morseTopic()
    const { container } = render(<MorseProgressPath topic={topic} onAction={onAction} />)
    const locked = [...container.querySelectorAll<HTMLElement>('button[aria-disabled="true"]')]
    expect(locked.length).toBeGreaterThan(0)
    const path = morseProgressPath(topic)!
    for (const control of locked) {
      fireEvent.click(control)
      const row = control.closest<HTMLElement>('[data-node-id]')!
      const node = path.nodes.find((candidate) => candidate.id === row.dataset.nodeId)!
      const notices = screen.getAllByRole('status')
      expect(notices).toHaveLength(1)
      expect(row.contains(notices[0])).toBe(true)
      expect(notices[0].textContent).toBe(node.kind === 'tier'
        ? node.pips.find((pip) => control.classList.contains(`morse-progress-pip-${pip.mode}`))!.reason
        : node.lockedReason)
    }
    expect(onAction).not.toHaveBeenCalled()
  })

  it('folds early Test into the A–Z plate without unlocking the milestone', () => {
    const onAction = vi.fn()
    const { container } = render(<MorseProgressPath topic={morseTopic()} onAction={onAction} />)
    expect(screen.getByRole('button', { name: 'A–Z Test, locked, locked' }).getAttribute('aria-disabled')).toBe('true')
    const early = screen.getByRole('button', { name: 'Test early' })
    expect(early.closest('.spine-row-wrap')?.querySelector('.morse-progress-test')).not.toBeNull()
    expect(early.closest('.spine-row')).toBeNull()
    fireEvent.click(early)
    expect(onAction).toHaveBeenCalledExactlyOnceWith({ kind: 'test', early: true })
    expect(container.querySelector('.morse-progress-path > li > button.quiet')).toBeNull()
  })

  it('folds Skip ahead into the Begin plate only when placement is offered', () => {
    const onPlacement = vi.fn()
    const { rerender } = render(<MorseProgressPath topic={morseTopic()} onAction={vi.fn()} onPlacement={onPlacement} />)
    const skip = screen.getByRole('button', { name: 'Skip ahead' })
    expect(skip.closest('[data-node-id]')?.getAttribute('data-node-id')).toBe('start')
    fireEvent.click(skip)
    expect(onPlacement).toHaveBeenCalledOnce()
    rerender(<MorseProgressPath topic={morseTopic(5)} onAction={vi.fn()} onPlacement={onPlacement} />)
    expect(screen.queryByRole('button', { name: 'Skip ahead' })).toBeNull()
  })

  it('draws each tier pip as its mode glyph on a 44px target, named for its level and mode', () => {
    const { container } = render(<MorseProgressPath topic={modeTopicFixtures().mid} onAction={vi.fn()} />)
    const pips = [...container.querySelectorAll<HTMLElement>('.morse-progress-pip')]
    expect(pips.length).toBeGreaterThan(0)
    for (const pip of pips) {
      expect(pip.getAttribute('aria-label')).toMatch(/^[A-Z][a-z]+, (Key|Listen|Read), (available|cleared|locked)$/)
      expect(pip.querySelector('.morse-progress-pip-chip .morse-mode-letter, .morse-progress-pip-chip svg, .morse-progress-pip-chip .morse-marks')).not.toBeNull()
    }
    // Levels are plain rows with round nodes; plates stay for tests (#263).
    for (const tier of container.querySelectorAll('.morse-progress-tier')) {
      expect(tier.classList.contains('is-plate')).toBe(false)
      expect(tier.querySelector('.spine-node-square')).toBeNull()
    }
    expect(container.querySelector('.morse-progress-test')?.classList.contains('is-plate')).toBe(true)
    expect(screen.getByRole('button', { name: 'Words, Key, available' }).querySelector('.morse-mode-letter')?.textContent).toBe('A')
    expect(screen.getByRole('button', { name: 'Numbers, Listen, locked' }).getAttribute('aria-disabled')).toBe('true')
  })

  it('forwards reached lesson and checkpoint actions and each available or cleared tier pip', () => {
    const topic = modeTopicFixtures().advanced
    const path = morseProgressPath(topic)!
    const onAction = vi.fn()
    render(<MorseProgressPath topic={topic} onAction={onAction} />)
    for (const node of path.nodes) {
      if (node.kind === 'tier') {
        const row = screen.getByRole('group', { name: node.accessibleLabel })
        for (const [index, pip] of node.pips.entries()) {
          if (!pip.action) continue
          onAction.mockClear()
          fireEvent.click(within(row).getAllByRole('button')[index])
          expect(onAction).toHaveBeenCalledExactlyOnceWith(pip.action)
        }
      } else if (node.state !== 'locked' && node.action) {
        onAction.mockClear()
        fireEvent.click(screen.getByRole('button', { name: node.accessibleLabel }))
        expect(onAction).toHaveBeenCalledExactlyOnceWith(node.action)
      }
    }
  })

  it('jumps instantly on mount and offers a single return pill outside the viewport', () => {
    let report: IntersectionObserverCallback = () => {}
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { report = callback }
      observe = observe
      disconnect = disconnect
    })
    const scrollIntoView = vi.fn()
    vi.stubGlobal('HTMLElement', HTMLElement)
    const original = HTMLElement.prototype.scrollIntoView
    HTMLElement.prototype.scrollIntoView = scrollIntoView
    const { unmount } = render(<MorseProgressPath topic={morseTopic(5)} onAction={vi.fn()} />)
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'center', behavior: 'instant' })
    expect(observe).toHaveBeenCalledWith(screen.getByRole('button', { name: /Lesson 6.*current/ }))
    const visibility = (isIntersecting: boolean, top: number) => act(() => report([
      { isIntersecting, boundingClientRect: { top }, rootBounds: { top: 0 } } as IntersectionObserverEntry,
    ], {} as IntersectionObserver))
    visibility(false, 1000)
    fireEvent.click(screen.getByRole('button', { name: 'Lesson 6 ↓' }))
    expect(scrollIntoView).toHaveBeenCalledTimes(2)
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'center', behavior: 'instant' })
    visibility(false, -100)
    expect(screen.getByRole('button', { name: 'Lesson 6 ↑' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Lesson 6 ↓' })).toBeNull()
    visibility(true, 100)
    expect(screen.queryByRole('button', { name: 'Lesson 6 ↑' })).toBeNull()
    unmount()
    expect(disconnect).toHaveBeenCalledOnce()
    HTMLElement.prototype.scrollIntoView = original
  })

  it('can leave navigation to the topic without adding a floating control', () => {
    const observer = vi.fn()
    vi.stubGlobal('IntersectionObserver', observer)
    render(<MorseProgressPath topic={morseTopic(5)} onAction={vi.fn()} showJump={false} />)
    expect(observer).not.toHaveBeenCalled()
    expect(document.querySelector('.spine-jump')).toBeNull()
    expect(document.querySelector('[aria-current="step"]')).toBeTruthy()
  })

  it('renders unsupported topics as nothing without observer APIs', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    vi.stubGlobal('ResizeObserver', undefined)
    const { container, rerender } = render(<MorseProgressPath topic={morseTopic()} onAction={vi.fn()} />)
    expect(screen.getByRole('list', { name: 'Course path' })).toBeTruthy()
    rerender(<MorseProgressPath topic={{ ...morseTopic(), items: [] }} onAction={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })
})
