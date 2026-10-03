// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { seedLibrary } from '../../domain/library/catalogSeed'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { TopicPage } from './TopicPage'

const updateTopic = vi.fn()
vi.mock('../../services/library/LibraryProvider', () => ({ useLibrary: () => ({ updateTopic }) }))
afterEach(() => { cleanup(); updateTopic.mockClear() })

function firearm() {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  return parsed.library.topics.find(topic => topic.id === 'firearm-safety-acts-prove')!
}

describe('topic reference page', () => {
  it('groups every visible rule in Test order, keeps support folded and browsing inert', () => {
    const topic = firearm()
    const onStart = vi.fn()
    const { container } = render(<TopicPage topic={topic} onStart={onStart} onBack={vi.fn()} onReference={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect([...container.querySelectorAll('.topic-recall-marker')].map(node => node.textContent).join('')).toBe('ACTSPROVE')
    expect(container.querySelectorAll('.topic-recall-cards > li')).toHaveLength(9)
    expect(container.querySelector('details[open]')).toBeNull()
    expect(container.querySelector('.topic-scope')?.textContent).toBe(topic.scope)
    expect(container.textContent).toContain(topic.scope)
    expect(container.querySelector('.topic-hero-fallback')).toBeTruthy()
    expect(updateTopic).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /^Test$/ }))
    expect(onStart).toHaveBeenCalledWith('test', [topic.id])
    expect(updateTopic).not.toHaveBeenCalled()
  })

  it('renders authored hero alternatives and credits without changing progress', () => {
    const topic = { ...firearm(), hero: { source: { kind: 'image' as const, src: '/media/topics/firearm/hero.avif', width: 1600, height: 900 }, alt: 'A firearm safety diagram.', credit: 'Owner artwork.' } }
    const { container } = render(<TopicPage topic={topic} onStart={vi.fn()} onBack={vi.fn()} onReference={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByRole('img', { name: topic.hero.alt })).toBeTruthy()
    expect(container.querySelector('.topic-hero-fallback')).toBeNull()
    expect(container.textContent).toContain('Owner artwork.')
    expect(updateTopic).not.toHaveBeenCalled()
  })
})

describe('topic page provenance', () => {
  it('keeps sources and limitations out of the body, behind one control at the very bottom', () => {
    const { container } = render(<TopicPage topic={firearm()} onStart={vi.fn()} onBack={vi.fn()} onReference={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(container.querySelector('.learn-notes')).toBeNull()
    expect(container.textContent).not.toContain('publications.gc.ca')
    const article = container.querySelector('article')!
    expect(article.lastElementChild?.textContent).toBe('Sources and limitations')
  })
})
