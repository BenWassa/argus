// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { Topic } from '../../domain/library/topic'
import { seedLibrary } from '../../domain/library/catalogSeed'
import { readFileSync } from 'node:fs'
import { Today } from './Today'

const state = vi.hoisted(() => ({ topics: [] as Topic[], ready: false, addRequest: vi.fn() }))
vi.mock('../../services/library/LibraryProvider', () => ({ useLibrary: () => ({ topics: state.topics }) }))
vi.mock('../../services/inbox/useInbox', () => ({ useInbox: () => ({ status: state.ready ? 'ready' : 'unconfigured', addRequest: state.addRequest }) }))

beforeEach(() => { state.topics = []; state.ready = false; state.addRequest.mockReset() })
afterEach(cleanup)

function open() {
  const actions = { onOpenTopic: vi.fn(), onGoToLibrary: vi.fn(), onAuthorTopic: vi.fn(), onOpenProfile: vi.fn() }
  const view = render(<Today {...actions} />)
  return { ...actions, ...view }
}

function building(id: string): Topic {
  return { ...seedLibrary().topics[0], id, title: id, status: 'learning', completedAt: null, history: [] }
}

describe('Home', () => {
  it('bounds active topics to three, opens a topic and leaves stored evidence unchanged', () => {
    state.topics = ['one', 'two', 'three', 'four'].map(building)
    const before = structuredClone(state.topics)
    const view = open()
    const plates = view.container.querySelectorAll('.today-plate')
    expect(plates).toHaveLength(3)
    expect(view.container.querySelector('.gauge-track')).toBeNull()
    expect(view.container.querySelector('.home-dial-arc')).toBeNull()
    fireEvent.click(plates[0])
    expect(view.onOpenTopic).toHaveBeenCalledWith('one')
    fireEvent.click(screen.getByRole('button', { name: 'See all' }))
    expect(view.onGoToLibrary).toHaveBeenCalledOnce()
    expect(state.topics).toEqual(before)
  })

  it('draws every plate solid on the kit, with copper and a diamond only for repair', () => {
    state.topics = [{ ...building('one'), status: 'decayed', completedAt: '2026-09-01T12:00:00Z' }, building('two')]
    const view = open()
    const plates = [...view.container.querySelectorAll<HTMLElement>('.today-plate')]
    expect(plates).toHaveLength(2)
    for (const plate of plates) expect(plate.className).toContain('plate plate-raised')
    expect(view.container.querySelectorAll('.plate-repair')).toHaveLength(1)
    expect(view.container.querySelector('.plate-repair .home-topic-reading.is-repair')?.textContent).toBe('Needs repair')
    expect(view.container.querySelector('.home-panel.plate')).toBeTruthy()
    expect(view.container.querySelector('h1.today-brand')?.textContent).toBe('ARGUS')
    expect(view.container.querySelector('details')).toBeNull()
  })

  it('keeps Home and Library styles free of alpha fills, gradients and texture', () => {
    for (const file of ['src/features/today/Today.css', 'src/features/library/LibraryPage.css']) {
      const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(css, file).not.toMatch(/rgba?\(|hsla?\(|gradient|backdrop-filter|--grain|--machining|--convex|--sheen|--engrave/)
    }
  })

  it('keeps the readout and a library path in an empty state, with deterministic authoring fallback', () => {
    const view = open()
    expect(screen.getByText('Completed')).toBeTruthy()
    expect(screen.getByText('In progress')).toBeTruthy()
    expect(screen.getByText('Last active')).toBeTruthy()
    expect(screen.getByText('—')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '+ Add something to learn' }))
    expect(view.onAuthorTopic).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('names missing items instead of claiming unfinished blank topics are banked', () => {
    state.topics = [{ ...building('draft'), items: [] }]
    const view = open()
    expect(screen.getByText('Add prompts and answers to your topics in the Library before testing.')).toBeTruthy()
    expect(view.container.querySelector('.today-plate')).toBeNull()
  })

  it('opens the existing Want-to-learn capture directly when available', async () => {
    state.ready = true
    state.addRequest.mockResolvedValue(undefined)
    const view = open()
    fireEvent.click(screen.getByRole('button', { name: '+ Add something to learn' }))
    expect(screen.getByRole('dialog', { name: 'Want to learn' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('What do you want to learn?'), { target: { value: 'Map contours' } })
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }))
    await screen.findByText('Added to Want to learn.')
    expect(state.addRequest).toHaveBeenCalledOnce()
    expect(view.onAuthorTopic).not.toHaveBeenCalled()
    expect(state.topics).toEqual([])
  })
})
