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

  it('gives milestones square nodes, uppercase names, distinct marks and a named repair state', () => {
    render(<MorseProgressPath topic={modeTopicFixtures().repair} onAction={vi.fn()} />)
    for (const label of screen.getAllByText('WORD CHECK')) {
      expect(label.closest('button')!.querySelector('.morse-progress-node-square svg')).not.toBeNull()
    }
    // The A–Z Test is told apart from a word check by its own mark, not by colour.
    const test = screen.getByText('A–Z TEST').closest('button')!.querySelector('.morse-progress-node-square')!
    expect(test.textContent).toBe('A–Z')
    expect(test.querySelector('svg')).toBeNull()
    expect(screen.getByText('◆ Needs repair')).toBeTruthy()
  })

  it('keeps all locked rows and pips inert, including the early Test descriptor', () => {
    const onAction = vi.fn()
    const { container } = render(<MorseProgressPath topic={morseTopic()} onAction={onAction} />)
    const locked = container.querySelectorAll('[aria-disabled="true"]')
    expect(locked.length).toBeGreaterThan(0)
    for (const row of locked) fireEvent.click(row)
    expect(onAction).not.toHaveBeenCalled()
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

  it('renders unsupported topics as nothing without observer APIs', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    vi.stubGlobal('ResizeObserver', undefined)
    const { container, rerender } = render(<MorseProgressPath topic={morseTopic()} onAction={vi.fn()} />)
    expect(screen.getByRole('list', { name: 'Course path' })).toBeTruthy()
    rerender(<MorseProgressPath topic={{ ...morseTopic(), items: [] }} onAction={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })
})
