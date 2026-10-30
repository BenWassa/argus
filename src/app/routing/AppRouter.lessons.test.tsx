// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { seedLibrary } from '../../domain/library/catalogSeed'
import { lessonForItem } from '../../domain/learning/generatedCurriculum'
import { AppRouter } from './AppRouter'
import type { Mode } from '../../domain/study/mode'
import type { RunTarget } from './routes'

const { library } = vi.hoisted(() => ({ library: { topics: [] as ReturnType<typeof seedLibrary>['topics'], updateTopic: vi.fn() } }))
vi.mock('../../services/library/LibraryProvider', () => ({ useLibrary: () => library }))
vi.mock('../../features/library/LibraryPage', () => ({ LibraryPage: ({ openTopicOnMount, onStart, onReference }: {
  openTopicOnMount: string | null; onStart: (mode: Mode, ids: string[], target?: RunTarget) => void; onReference: (id: string) => void
}) => <div><p>{openTopicOnMount ? 'Topic page' : 'Library'}</p>
  <button onClick={() => onStart('learn', [library.topics[0].id], { kind: 'stage', stageId: 'lesson-2' })}>Open lesson</button>
  <button onClick={() => onStart('test', [library.topics[0].id])}>Final Test</button>
  <button onClick={() => onReference(library.topics[0].id)}>Reference</button></div> }))
vi.mock('../../features/today/Today', () => ({ Today: ({ onContinue }: { onContinue: (action: 'learn', id: string) => void }) =>
  <button onClick={() => onContinue('learn', library.topics[0].id)}>Continue</button> }))
vi.mock('../../features/test/TestSession', () => ({ TestSession: ({ onPractice }: { onPractice: (id: string, ids: string[]) => void }) =>
  <button onClick={() => onPractice(library.topics[0].id, [library.topics[0].items[9].id!])}>Review lesson</button> }))

const topic = seedLibrary().topics.find(topic => topic.id === 'nato-phonetic')!
const topicRoute = { kind: 'topic', topicId: topic.id } as const
beforeEach(() => {
  library.topics = [{ ...topic, status: 'learning', completedAt: null, drilledAt: null, stageProgress: { 'lesson-1': '2026-10-29T00:00:00Z' } }]
  library.updateTopic.mockClear()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
  window.history.replaceState({ argusNavigation: 1, index: 0, route: topicRoute }, '')
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('ordinary lesson routing', () => {
  it('normalizes old Practice in place on reload, preserving the index and writing no learner data', () => {
    window.history.replaceState({ argusNavigation: 1, index: 4, route: { kind: 'run', mode: 'learn', topicIds: [topic.id],
      origin: { kind: 'section', view: 'today' }, target: { kind: 'practice', itemIds: [topic.items[0].id!] } } }, '')
    const push = vi.spyOn(window.history, 'pushState')
    render(<AppRouter />)
    expect(window.history.state).toEqual({ argusNavigation: 1, index: 4, route: topicRoute })
    expect(screen.getByText('Topic page')).toBeTruthy()
    expect(push).not.toHaveBeenCalled()
    expect(library.updateTopic).not.toHaveBeenCalled()
  })

  it('normalizes Forward before rejecting live runs, and skips an adjacent duplicate topic on Back', () => {
    window.history.replaceState({ argusNavigation: 1, index: 1, route: { kind: 'section', view: 'today' } }, '')
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)
    const push = vi.spyOn(window.history, 'pushState')
    render(<AppRouter />)
    act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: { argusNavigation: 1, index: 3,
      route: { kind: 'run', mode: 'learn', topicIds: [topic.id], origin: { kind: 'section', view: 'library' }, target: { kind: 'practice' } } } })))
    expect(window.history.state).toMatchObject({ index: 3, route: topicRoute })
    expect(back).not.toHaveBeenCalled()
    act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: { argusNavigation: 1, index: 2, route: topicRoute } })))
    expect(back).toHaveBeenCalledOnce()
    expect(push).not.toHaveBeenCalled()
    expect(library.updateTopic).not.toHaveBeenCalled()
  })

  it('renders StageRunner full-screen, and Home Continue opens the next unfinished lesson', () => {
    window.history.replaceState({ argusNavigation: 1, index: 0, route: { kind: 'section', view: 'today' } }, '')
    const { container } = render(<AppRouter />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(window.history.state.route.target).toEqual({ kind: 'stage', stageId: 'lesson-2' })
    expect(container.querySelector('.app-shell.session-shell .stage-runner')).toBeTruthy()
    expect(container.querySelector('.nav-btn')).toBeNull()
  })

  it('replaces the finished Test with the lesson containing the first miss', () => {
    render(<AppRouter />)
    fireEvent.click(screen.getByRole('button', { name: 'Final Test' }))
    const index = window.history.state.index
    fireEvent.click(screen.getByRole('button', { name: 'Review lesson' }))
    expect(window.history.state).toMatchObject({ index, route: { kind: 'run', mode: 'learn',
      target: { kind: 'stage', stageId: lessonForItem(library.topics[0], topic.items[9].id!)!.id } } })
    expect(screen.getByRole('heading', { name: 'Lesson 3' })).toBeTruthy()
    expect(library.updateTopic).not.toHaveBeenCalled()
  })

  it('renders the full Reference and its existing Back without bottom navigation', () => {
    const { container } = render(<AppRouter />)
    fireEvent.click(screen.getByRole('button', { name: 'Reference' }))
    expect(container.querySelector('.app-shell.session-shell .topic-reading')).toBeTruthy()
    expect(container.querySelector('.nav-btn')).toBeNull()
    expect(container.querySelectorAll('.topic-item')).toHaveLength(topic.items.length)
    expect(screen.getByRole('button', { name: 'Back to topic' })).toBeTruthy()
    expect(library.updateTopic).not.toHaveBeenCalled()
  })
})
