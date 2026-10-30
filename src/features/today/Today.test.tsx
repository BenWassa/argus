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
  const actions = { onContinue: vi.fn(), onOpenTopic: vi.fn(), onGoToLibrary: vi.fn(), onAuthorTopic: vi.fn(), onOpenProfile: vi.fn() }
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

  it('keeps solid active plates and excludes learned legacy repair records', () => {
    state.topics = [{ ...building('one'), status: 'decayed', completedAt: '2026-09-01T12:00:00Z' }, building('two')]
    const view = open()
    const plates = [...view.container.querySelectorAll<HTMLElement>('.today-plate')]
    expect(plates).toHaveLength(1)
    for (const plate of plates) expect(plate.className).toContain('plate plate-raised')
    expect(view.container.querySelectorAll('.plate-repair')).toHaveLength(0)
    expect(screen.queryByText('Needs repair')).toBeNull()
    expect(view.container.querySelector('.home-panel.plate')).toBeTruthy()
    expect(view.container.querySelector('h1.today-brand')?.textContent).toBe('ARGUS')
    expect(view.container.querySelector('details')).toBeNull()
  })

  it('continues the top unfinished topic, leaving learned topics out of the queue', () => {
    state.topics = [{ ...building('learned'), status: 'decayed', completedAt: '2026-01-01T00:00:00Z' }, building('next')]
    const view = open()
    fireEvent.click(screen.getByRole('button', { name: 'Continue: next' }))
    expect(view.onContinue).toHaveBeenCalledWith('test', 'next')
    expect(screen.queryByRole('button', { name: /Continue: learned/ })).toBeNull()
    expect(screen.queryByRole('button', { name: '+ Add something to learn' })).toBeNull()
  })

  it('puts Continue before the readout and topic queue so short screens reach it first', () => {
    state.topics = [building('one'), building('two'), building('three')]
    const view = open()
    const action = screen.getByRole('button', { name: 'Continue: one' })
    for (const element of [view.container.querySelector('.home-panel')!, screen.getByRole('heading', { name: 'Active topics' })]) {
      expect(action.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
    expect(view.container.querySelectorAll('.today-plate')).toHaveLength(3)
  })

  it('lets words claim a full row and reserves a separate lane for Library add', () => {
    const header = readFileSync('src/shared/ui/ScreenHeader.css', 'utf8')
    const spine = readFileSync('src/shared/ui/ProgressSpine.css', 'utf8')
    const library = readFileSync('src/features/library/LibraryPage.css', 'utf8')
    for (const css of [header, spine, library]) {
      expect(css).toContain('flex-wrap: wrap;')
      expect(css).toContain('flex: 1 1 min-content;')
    }
    expect(library).toContain('padding-right: calc(56px + max(var(--s-lg), env(safe-area-inset-right)))')
    expect(library).toContain('padding-bottom: calc(56px + 2 * var(--s-lg) + env(safe-area-inset-bottom))')
    const reading = readFileSync('src/features/learn/Reading.css', 'utf8')
    expect(reading).toMatch(/\.learn-table th,[\s\S]*?overflow-wrap: normal;/)
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
