// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../domain/library/topic'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { TopicReading } from '../learn/TopicReading'
import { PracticeRun } from '../practice/PracticeRun'
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
  const view = render(<TopicPage topic={topic} onStart={onStart} onBack={vi.fn()} onReference={onReference} onEdit={vi.fn()} onDelete={vi.fn()} />)
  return { ...view, onStart, onReference }
}

const tile = (id: string) => document.querySelector<HTMLButtonElement>(`.topic-tray [data-tile-id="${id}"]`)!

describe('topic reference page', () => {
  it('sets every rule on the spine in Test order under square group plates, and browsing is inert', () => {
    const topic = firearm()
    const { container, onStart } = open(topic)
    const groups = [...container.querySelectorAll('.topic-item-group')]
    expect(groups.map(row => row.querySelector('.spine-label')?.textContent)).toEqual(['ACTS', 'PROVE'])
    expect(groups.every(row => row.classList.contains('is-plate') && row.querySelector('.spine-node-square'))).toBe(true)
    expect([...container.querySelectorAll('.topic-item .spine-node')].map(node => node.textContent).join('')).toBe('ACTSPROVE')
    expect(container.querySelectorAll('.topic-item')).toHaveLength(9)
    // Prompt and answer together, as reading rows rather than controls.
    for (const item of topic.items) expect(container.textContent).toContain(item.answer)
    expect(container.querySelector('.topic-items button')).toBeNull()
    expect(container.querySelector('[aria-current="step"]')).toBeNull()
    expect(container.querySelector('details, summary')).toBeNull()
    expect(updateTopic).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /^Test$/ }))
    expect(onStart).toHaveBeenCalledWith('test', [topic.id])
    expect(updateTopic).not.toHaveBeenCalled()
  })

  it('reads its settled bar and status in the header, with no hero, scope or old chrome', () => {
    const { container } = open(firearm())
    // Untested: no value, so no bar rather than a false 0 / 9.
    expect(container.querySelector('.screen-header-track')).toBeNull()
    expect(container.querySelector('.screen-header-readout')).toBeNull()
    expect(container.querySelector('.topic-state-label')?.textContent).toBe('Not tested yet')
    expect(container.querySelector('.topic-state-mark')).toBeNull()
    expect(container.querySelector('.topic-hero, .topic-hero-fallback, .topic-scope, .topic-action-bar, .topic-options, .topic-primary')).toBeNull()
    expect(container.textContent).not.toContain('What to remember')
  })

  it('marks repair in copper behind its diamond and routes the action tile to Repair', () => {
    const topic: Topic = { ...firearm(), status: 'decayed', completedAt: '2026-01-02T00:00:00Z',
      history: [{ at: '2026-01-02T00:00:00Z', correct: 9, total: 9, resolvedTo: 'completed' }, { at: '2026-02-02T00:00:00Z', correct: 4, total: 9, resolvedTo: 'decayed' }] }
    const { container } = open(topic)
    const state = container.querySelector('.topic-state')!
    expect(state.classList.contains('is-repair')).toBe(true)
    expect(state.textContent).toBe('◆Needs repair')
    expect(tile('test').textContent).toContain('Repair')
    // Without per-item evidence no row is copper; the header says it once.
    expect(container.querySelectorAll('.topic-item.is-repair')).toHaveLength(0)
    expect(container.querySelectorAll('.topic-item.is-seen')).toHaveLength(9)
  })

  it('reads a banked topic as settled throughout, offering Test again', () => {
    const topic: Topic = { ...firearm(), status: 'completed', completedAt: '2026-01-02T00:00:00Z',
      history: [{ at: '2026-01-02T00:00:00Z', correct: 9, total: 9, resolvedTo: 'completed' }] }
    const { container } = open(topic)
    expect(screen.getByRole('img', { name: '9 of 9 items settled' })).toBeTruthy()
    expect(container.querySelector('.topic-state')?.textContent).toBe('✓Banked')
    expect(container.querySelectorAll('.topic-item.is-done')).toHaveLength(9)
    expect(tile('test').querySelector('.mode-tray-label')?.textContent).toBe('Test again')
  })

  it('shows history as one pip per attempt, named by date, score and outcome', () => {
    const topic: Topic = { ...firearm(), status: 'completed', completedAt: '2026-01-02T12:00:00Z',
      history: [
        { at: '2026-01-01T12:00:00Z', correct: 3, total: 9, resolvedTo: 'learning' },
        { at: '2026-01-02T12:00:00Z', correct: 9, total: 9, resolvedTo: 'completed' },
      ] }
    const { container } = open(topic)
    const pips = [...container.querySelectorAll<HTMLElement>('.topic-pip')]
    expect(pips).toHaveLength(2)
    expect(pips[0].getAttribute('aria-label')).toMatch(/: 3 of 9, Learning$/)
    expect(pips[1].getAttribute('aria-label')).toMatch(/: 9 of 9, Completed$/)
    expect((pips[0].firstElementChild as HTMLElement).style.height).toBe(`${3 / 9 * 100}%`)
    expect(container.querySelector('.topic-history-head')?.textContent).toBe('2 attempts')
    expect(container.querySelector('.topic-earned')?.textContent).toMatch(/^First completed · /)
  })
})

describe('a failed Test is remembered', () => {
  const nato = () => seeded('nato-phonetic')
  const failed = (status: Topic['status'], completedAt: string | null): Topic => {
    const topic = nato()
    const missedItemIds = topic.items.slice(0, 4).map(item => item.id!)
    return { ...topic, status, completedAt, history: [{ at: '2026-01-02T00:00:00Z', correct: topic.items.length - 4, total: topic.items.length, resolvedTo: status, missedItemIds }] }
  }

  it('marks the missed items copper with a diamond even after a failed repair Test sent the topic to learning', () => {
    const { container } = open(failed('learning', '2026-01-01T00:00:00Z'))
    const copper = [...container.querySelectorAll('.topic-items .spine-row.is-repair')]
    expect(copper).toHaveLength(4)
    expect(copper.every(row => row.querySelector('.spine-node')?.textContent === '◆')).toBe(true)
    expect(container.querySelector('.topic-state')?.textContent).toBe(`${nato().items.length - 4} / ${nato().items.length} · 4 to practise`)
    // Not a decay claim: no Needs repair, no copper status line.
    expect(container.querySelector('.topic-state')?.classList.contains('is-repair')).toBe(false)
    expect(container.querySelectorAll('.topic-items .spine-row.is-reached')).toHaveLength(nato().items.length - 4)
  })

  it('keeps Needs repair, and adds what is left to practise, while the topic is still decayed', () => {
    const { container } = open(failed('decayed', '2026-01-01T00:00:00Z'))
    expect(container.querySelector('.topic-state')?.textContent).toBe('◆Needs repair · 4 to practise')
    expect(container.querySelectorAll('.topic-items .spine-row.is-repair')).toHaveLength(4)
  })

  it('draws settled items as slate steps with a tick, and no mark of its own for unseen ones', () => {
    const topic: Topic = { ...nato(), status: 'completed', completedAt: '2026-01-01T00:00:00Z', history: [{ at: '2026-01-01T00:00:00Z', correct: 26, total: 26, resolvedTo: 'completed' }] }
    const { container } = open(topic)
    const nodes = [...container.querySelectorAll('.topic-items .spine-row.is-done .spine-node')]
    expect(nodes).toHaveLength(topic.items.length)
    expect(nodes.every(node => node.textContent === '✓')).toBe(true)
  })
})

describe('the topic tray', () => {
  it('opens Learn on its own screen, and locks Practice when nothing was missed', () => {
    const topic = firearm()
    const { onReference, onStart } = open(topic)
    expect(screen.getByRole('navigation', { name: 'Study' })).toBeTruthy()
    expect(tile('learn').getAttribute('aria-disabled')).toBeNull()
    fireEvent.click(tile('learn'))
    expect(onReference).toHaveBeenCalledWith(topic.id)
    expect(tile('practice').getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(tile('practice'))
    expect(onStart).not.toHaveBeenCalled()
    expect(tile('test').querySelector('.topic-tile-count')?.textContent).toBe('9')
  })

  it('launches exactly the one advertised miss from twelve self-scored items', () => {
    const base = firearm()
    const items = Array.from({ length: 12 }, (_, i) => ({ id: `item-${i}`, kind: 'forward' as const, prompt: `Prompt ${i}`, answer: `Answer ${i}` }))
    const topic: Topic = { ...base, items, status: 'learning', history: [{ at: '2026-01-01T00:00:00Z', correct: 11, total: 12, resolvedTo: 'learning', missedItemIds: ['item-4'] }] }
    const before = JSON.stringify(topic)
    const { onStart, rerender } = open(topic)
    expect(tile('practice').querySelector('.topic-tile-count')?.textContent).toBe('1')
    fireEvent.click(tile('practice'))
    expect(onStart).toHaveBeenCalledWith('learn', [topic.id], { kind: 'practice', itemIds: ['item-4'] })
    const target = onStart.mock.lastCall![2]
    rerender(<PracticeRun topic={topic} itemIds={target.itemIds} onExit={vi.fn()} onCheck={vi.fn()} />)
    expect(screen.getByRole('progressbar', { name: '0 of 1' })).toBeTruthy()
    expect(screen.getByText('Prompt 4')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reveal answer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.getByRole('heading', { name: 'Practice done' })).toBeTruthy()
    expect(JSON.stringify(topic)).toBe(before)
    expect(updateTopic).not.toHaveBeenCalled()
  })

  it('offers Practice with the count of missed items as its stimulus', () => {
    const topic = seeded('whole-circle-bearings')
    const missedItem = topic.items[2]
    const missed: Topic = { ...topic, status: 'learning', history: [{ at: '2026-01-01T00:00:00Z', correct: 11, total: 12, resolvedTo: 'learning' }],
      itemEvidence: { [missedItem.id!]: { cue: 'rich', directions: { 'prompt-to-answer': { attempts: 1, correct: 0, unassistedCorrect: 0, consecutiveCorrect: 0, lastAt: '2026-01-01T00:00:00Z', lastLatencyMs: null } } } } }
    const { onStart, container } = open(missed)
    expect(tile('practice').getAttribute('aria-disabled')).toBeNull()
    expect(tile('practice').querySelector('.topic-tile-count')?.textContent).toBe('1')
    fireEvent.click(tile('practice'))
    expect(onStart).toHaveBeenCalledWith('learn', [topic.id], { kind: 'practice', itemIds: [missedItem.id!] })
    expect(container.querySelectorAll('.topic-item.is-missed')).toHaveLength(1)
    // Items keep their compact stimulus inside the row.
    expect(container.querySelectorAll('.topic-item.has-visual')).toHaveLength(12)
    expect(container.querySelectorAll('.topic-items .topic-item-visual .visual.is-compact')).toHaveLength(12)
  })

  it('locks Learn for a topic with nothing to read beyond its items', () => {
    const { learn: _learn, ...plain } = firearm()
    open({ ...plain, origin: 'user' })
    expect(tile('learn').getAttribute('aria-disabled')).toBe('true')
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

describe('Edit and Delete', () => {
  it('keeps Edit in the header and puts Delete at the foot, beside Sources', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const { container } = render(<TopicPage topic={firearm()} onStart={vi.fn()} onBack={vi.fn()} onReference={vi.fn()} onEdit={onEdit} onDelete={onDelete} />)
    const header = container.querySelector('.screen-header')!
    const edit = screen.getByRole('button', { name: 'Edit topic' })
    const remove = screen.getByRole('button', { name: 'Delete topic' })
    const sources = screen.getByRole('button', { name: /Sources and limitations/ })
    expect(header.contains(edit)).toBe(true)
    expect(header.contains(remove)).toBe(false)
    expect(remove.closest('.topic-foot')).toBe(sources.closest('.topic-foot'))
    expect(edit.textContent).toBe('Edit')
    expect(remove.textContent).toBe('Delete')
    expect(container.querySelector('.topic-admin')).toBeNull()
    fireEvent.click(edit)
    fireEvent.click(remove)
    expect(onEdit).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('does the same on the Morse course, so a pinned header never carries Delete', () => {
    const morse = seeded('international-morse-letters-printed')
    const { container } = render(<TopicPage topic={morse} onStart={vi.fn()} onBack={vi.fn()} onReference={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const header = container.querySelector('.screen-header')!
    expect(header.contains(screen.getByRole('button', { name: 'Edit topic' }))).toBe(true)
    expect(header.contains(screen.getByRole('button', { name: 'Delete topic' }))).toBe(false)
    expect(screen.getByRole('button', { name: 'Delete topic' }).closest('.topic-foot')).toBe(container.querySelector('article')!.lastElementChild)
  })
})
