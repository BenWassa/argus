// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../domain/library/topic'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { TopicReading } from '../learn/TopicReading'
import { curriculumFor } from '../../domain/learning/generatedCurriculum'
import { TopicPage } from './TopicPage'

const updateTopic = vi.fn()
vi.mock('../../services/library/LibraryProvider', () => ({ useLibrary: () => ({ updateTopic }) }))
afterEach(() => { cleanup(); updateTopic.mockClear() })

function seeded(id: string): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  return parsed.library.topics.find(topic => topic.id === id)!
}

const firearm = () => seeded('firearm-safety-acts-prove')

function open(topic: Topic) {
  const onStart = vi.fn()
  const onReference = vi.fn()
  const view = render(<TopicPage topic={topic} onStart={onStart} onBack={vi.fn()} onReference={onReference} onEdit={vi.fn()} />)
  return { ...view, onStart, onReference }
}

const tile = (id: string) => document.querySelector<HTMLButtonElement>(`.topic-tray [data-tile-id="${id}"]`)!

describe('ordinary lesson landing', () => {
  it('shows lessons and a quiet square Final Test, with one Start tile and inert browsing', () => {
    const topic = firearm()
    const { container, onStart } = open(topic)
    const curriculum = curriculumFor(topic)!
    expect(screen.getByRole('list', { name: 'Lessons' }).children).toHaveLength(curriculum.stages.length + 1)
    expect(container.querySelectorAll('.topic-lessons .spine-node-square')).toHaveLength(1)
    expect(container.querySelectorAll('.topic-tray button')).toHaveLength(1)
    expect(tile('lesson').textContent).toContain('Start')
    expect(container.querySelector('.screen-header-readout')?.textContent).toBe(`Lesson 1 of ${curriculum.stages.length}`)
    expect(container.querySelector('.topic-items')).toBeNull()
    expect(updateTopic).not.toHaveBeenCalled()
    fireEvent.click(tile('lesson'))
    expect(onStart).toHaveBeenCalledWith('learn', [topic.id], { kind: 'stage', stageId: 'lesson-1' })
    fireEvent.click(screen.getByRole('button', { name: 'Final Test' }))
    expect(onStart).toHaveBeenCalledWith('test', [topic.id])
    expect(updateTopic).not.toHaveBeenCalled()
  })

  it('continues after Test history even without stage ticks', () => {
    const topic: Topic = { ...firearm(), status: 'learning', completedAt: null,
      history: [{ at: '2026-10-29T00:00:00Z', correct: 0, total: 9, resolvedTo: 'learning' }] }
    open(topic)
    expect(tile('lesson').textContent).toContain('Continue')
  })

  it('shows lesson completion in the header bar and omits the empty state paragraph', () => {
    const topic: Topic = { ...seeded('nato-phonetic'), status: 'learning', completedAt: null,
      stageProgress: { 'lesson-1': '2026-10-29T00:00:00Z' } }
    const { container } = open(topic)
    const bar = screen.getByRole('img', { name: 'Lessons completed' })
    expect(parseFloat((bar.firstElementChild as HTMLElement).style.width)).toBeCloseTo(100 / curriculumFor(topic)!.stages.length)
    expect(container.querySelector('.topic-state')).toBeNull()
  })

  it('makes every row available, including replay and skipping ahead, and continues the first unfinished lesson', () => {
    const topic = { ...seeded('nato-phonetic'), status: 'learning' as const, completedAt: null, stageProgress: { 'lesson-1': '2026-10-29T00:00:00Z' } }
    const { container, onStart } = open(topic)
    expect(container.querySelectorAll('[aria-disabled="true"]')).toHaveLength(0)
    expect(tile('lesson').textContent).toContain('Continue')
    fireEvent.click(tile('lesson'))
    expect(onStart).toHaveBeenLastCalledWith('learn', [topic.id], { kind: 'stage', stageId: 'lesson-2' })
    fireEvent.click(screen.getByRole('button', { name: 'Lesson 1, done' }))
    expect(onStart).toHaveBeenLastCalledWith('learn', [topic.id], { kind: 'stage', stageId: 'lesson-1' })
    fireEvent.click(screen.getByRole('button', { name: 'Lesson 3, upcoming' }))
    expect(onStart).toHaveBeenLastCalledWith('learn', [topic.id], { kind: 'stage', stageId: 'lesson-3' })
    expect(updateTopic).not.toHaveBeenCalled()
  })

  it('preserves completed learners, ticks every lesson, and gives the quiet tray action to Final Test (D2/D5)', () => {
    const topic: Topic = { ...firearm(), status: 'decayed', completedAt: '2026-01-02T00:00:00Z', history: [
      { at: '2026-01-02T00:00:00Z', correct: 9, total: 9, resolvedTo: 'completed' },
      { at: '2026-02-02T00:00:00Z', correct: 4, total: 9, resolvedTo: 'decayed' },
    ] }
    const { container, onStart } = open(topic)
    expect(container.querySelector('.topic-state')?.textContent).toBe('✓Learned')
    expect(container.querySelectorAll('.topic-lessons .is-done')).toHaveLength(curriculumFor(topic)!.stages.length)
    expect(tile('test').style.getPropertyValue('--tile-fill')).toBe('var(--surface-2)')
    expect(tile('test').textContent).toContain('Final Test')
    expect((screen.getByRole('img', { name: 'Lessons completed' }).firstElementChild as HTMLElement).style.width).toBe('100%')
    fireEvent.click(screen.getByRole('button', { name: 'Review' }))
    expect(onStart).toHaveBeenCalledWith('learn', [topic.id], { kind: 'stage', stageId: 'lesson-1' })
    expect(container.querySelectorAll('.topic-pip')).toHaveLength(2)
    expect(container.querySelector('.topic-earned')?.textContent).toMatch(/^First completed · /)
  })

  it('offers Reference even without authored support, with every prompt and answer there', () => {
    const { learn: _learn, hero: _hero, ...topic } = firearm()
    const { onReference, unmount } = open(topic)
    fireEvent.click(screen.getByRole('button', { name: 'Reference' }))
    expect(onReference).toHaveBeenCalledWith(topic.id)
    unmount()
    const { container } = render(<TopicReading topic={topic} onBack={vi.fn()} />)
    expect(container.querySelectorAll('.topic-item')).toHaveLength(topic.items.length)
    for (const item of topic.items) expect(container.textContent).toContain(item.answer)
    expect(updateTopic).not.toHaveBeenCalled()
  })

  it('keeps empty topics on Add items', () => {
    open({ ...firearm(), items: [] })
    expect(screen.getByRole('button', { name: 'Add items' })).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'Lessons' })).toBeNull()
  })
})

describe('topic page provenance', () => {
  it('keeps sources and limitations out of the body, behind one control at the very bottom', () => {
    const { container } = open(firearm())
    expect(container.querySelector('.learn-notes')).toBeNull()
    expect(container.textContent).not.toContain('publications.gc.ca')
    const foot = container.querySelector('article')!.lastElementChild!
    expect(foot.className).toBe('topic-foot')
    expect(foot.firstElementChild?.textContent).toBe('Sources and limitations')
  })

  it('puts the full scope first in the sources sheet', () => {
    const topic = firearm()
    open(topic)
    fireEvent.click(screen.getByRole('button', { name: 'Sources and limitations' }))
    const firstSection = screen.getByRole('dialog').querySelector('section')!
    expect(firstSection.querySelector('h3')?.textContent).toBe('Scope and limits')
    expect(firstSection.textContent).toContain(topic.scope)
  })
})

describe('the Learn screen', () => {
  it('opens on the lede, with the scope in the sources sheet rather than restating it', () => {
    const topic = seeded('beaufort-wind-scale')
    const { container } = render(<TopicReading topic={topic} onBack={vi.fn()} />)
    expect(container.querySelector('.topic-scope')).toBeNull()
    expect(container.querySelector('.learn-overview')?.textContent).toBe(topic.learn!.overview)
    fireEvent.click(screen.getByRole('button', { name: 'Sources and limitations' }))
    expect(screen.getByRole('dialog').querySelector('section')?.textContent).toContain(topic.scope)
  })

  it('reads the boundary and support under a header with Back to the topic', () => {
    const topic = firearm()
    const onBack = vi.fn()
    const { container } = render(<TopicReading topic={topic} onBack={onBack} />)
    expect(screen.getByRole('heading', { level: 1, name: topic.title })).toBeTruthy()
    expect(container.querySelector('.topic-scope')?.textContent).toBe(topic.scope)
    expect(container.querySelector('.learn-support')).toBeTruthy()
    expect(container.querySelector('details, summary')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Back to topic' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('renders authored hero alternatives and credits without changing progress', () => {
    const topic = { ...firearm(), hero: { source: { kind: 'image' as const, src: '/media/topics/firearm/hero.avif', width: 1600, height: 900 }, alt: 'A firearm safety diagram.', credit: 'Owner artwork.' } }
    const { container } = render(<TopicReading topic={topic} onBack={vi.fn()} />)
    expect(screen.getByRole('img', { name: topic.hero.alt })).toBeTruthy()
    expect(container.textContent).toContain('Owner artwork.')
    expect(updateTopic).not.toHaveBeenCalled()
  })
})

describe('Learner topic actions', () => {
  it.each(['firearm-safety', 'international-morse-letters-printed'])('keeps Edit and Sources without a destructive action on %s', (id) => {
    const onEdit = vi.fn()
    const topic = id === 'firearm-safety' ? firearm() : seeded(id)
    const { container } = render(<TopicPage topic={topic} onStart={vi.fn()} onBack={vi.fn()} onReference={vi.fn()} onEdit={onEdit} />)
    const edit = screen.getByRole('button', { name: 'Edit topic' })
    expect(container.querySelector('.screen-header')!.contains(edit)).toBe(true)
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull()
    expect(screen.getByRole('button', { name: /Sources and limitations/ })).toBeTruthy()
    fireEvent.click(edit)
    expect(onEdit).toHaveBeenCalledOnce()
  })
})
