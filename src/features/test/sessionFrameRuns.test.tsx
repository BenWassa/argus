// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { LibraryProvider } from '../../services/library/LibraryProvider'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../domain/library/topic'
import type { Resolution } from '../../domain/study/scheduling'
import { StageRunner } from '../learn/stage/StageRunner'
import { generatedCurriculum } from '../../domain/learning/generatedCurriculum'
import type { BankedAttempt } from './bankedAttempt'
import { TestDone } from './TestDone'
import { TestSession } from './TestSession'

/** Test and lessons wear the shared session frame (#245). */

afterEach(cleanup)

const NATO = seedLibrary().topics.find((topic) => topic.id === 'nato-phonetic') as Topic

function attempt(over: Partial<Resolution> = {}): BankedAttempt {
  return {
    resolution: { topic: NATO, from: 'drilled', to: 'drilled', completed: false, ...over },
    withheldByAcquisition: false,
    nonQualifying: false,
  }
}

describe('Test in the session frame', () => {
  it('carries its progress and close in the frame, with no header of its own', () => {
    const { container } = render(
      <LibraryProvider>
        <TestSession topicIds={['nato-phonetic']} onExit={() => undefined} />
      </LibraryProvider>,
    )
    const frame = container.querySelector('.session-frame')!
    expect(frame.getAttribute('data-session-kind')).toBe('test')
    expect(screen.getAllByRole('heading', { level: 1 })).toEqual([frame.querySelector('.session-frame-title')])
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(NATO.title)
    const prompt = screen.getByRole('heading', { level: 2 })
    expect(prompt.id).toBe('prompt-heading')
    expect(prompt.tabIndex).toBe(-1)
    expect(document.activeElement).toBe(prompt)
    expect(screen.getByRole('progressbar', { name: `0 of ${NATO.items.length}` })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy()
    expect(container.querySelector('.session-bar, .session-count')).toBeNull()
    expect(container.querySelector('.recall-shortcuts')).toBeNull()
  })
})

describe('Lessons in the session frame', () => {
  it('counts steps and docks its response, with Close in the shared header', () => {
    const onExit = vi.fn()
    const stage = generatedCurriculum(NATO).stages[0]
    const { container } = render(<StageRunner stage={stage} itemFace={() => ({ front: 'A', back: 'Alfa' })} onExit={onExit} onFinish={vi.fn()} />)
    expect(container.querySelector('.session-frame')?.getAttribute('data-session-kind')).toBe('lesson')
    expect(screen.getByRole('progressbar', { name: `1 of ${stage.steps.length}` })).toBeTruthy()
    expect(container.querySelector('.session-frame-response')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onExit).toHaveBeenCalledOnce()
  })
})

describe('the Test result is a round result', () => {
  const run = { banked: [attempt()], missed: {} as Record<string, string[]>, onExit: vi.fn() }

  it('reads correct over total, with the ladder outcome as one short line', () => {
    render(<TestDone {...run} score={{ correct: 24, total: 26 }} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toEqual([document.querySelector('.session-frame-title')])
    expect(screen.getByRole('heading', { level: 2, name: '24 of 26 correct' })).toBe(document.activeElement)
    expect(document.querySelectorAll('.test-outcome')).toHaveLength(1)
    expect(document.querySelector('.test-outcome')?.textContent).toMatch(/Learned/)
    expect(screen.queryByRole('button', { name: 'Again' })).toBeNull()
  })

  it('says what did not bank, and how many are left to practise, never "ready to test"', () => {
    const [first, second] = NATO.items
    render(<TestDone {...run} banked={[attempt({ topic: { ...NATO, status: 'learning', drilledAt: null, completedAt: null }, from: 'learning', to: 'learning' })]} missed={{ [NATO.id]: [first.id!, second.id!] }}
      onPractice={vi.fn()} score={{ correct: 24, total: 26 }} />)
    expect([...document.querySelectorAll('.test-outcome')].map((line) => line.textContent)).toEqual(['Still learning · 2 missed'])
    expect(document.body.textContent).not.toMatch(/ready to test/i)
    expect(screen.getAllByRole('listitem').filter((chip) => chip.className === 'test-missed-chip')).toHaveLength(2)
  })

  it('names the topic on each line only when several topics ran together', () => {
    const other: Topic = { ...NATO, id: 'other', title: 'Other', status: 'learning', drilledAt: null, completedAt: null }
    render(<TestDone {...run} banked={[attempt({ topic: { ...NATO, status: 'learning', drilledAt: null, completedAt: null }, from: 'learning', to: 'learning' }), attempt({ topic: other, from: 'learning', to: 'learning' })]}
      missed={{ [NATO.id]: [NATO.items[0].id!] }} score={{ correct: 25, total: 26 }} />)
    expect([...document.querySelectorAll('.test-outcome')].map((line) => line.textContent)).toEqual([`${NATO.title}: Still learning · 1 missed`])
  })

  it('puts repairing the misses in the primary slot, and Done beside it', () => {
    const onPractice = vi.fn()
    const first = NATO.items[0].id!
    render(<TestDone {...run} banked={[attempt({ topic: { ...NATO, status: 'learning', drilledAt: null, completedAt: null }, from: 'learning', to: 'learning' })]} missed={{ [NATO.id]: [first] }} onPractice={onPractice} score={{ correct: 25, total: 26 }} />)
    const practise = screen.getByRole('button', { name: 'Review lesson' })
    expect(practise.className).not.toContain('ghost')
    expect(screen.getByRole('button', { name: 'Done' }).className).toContain('ghost')
    fireEvent.click(practise)
    expect(onPractice).toHaveBeenCalledWith(NATO.id, [first])
  })
})

describe('Test and lessons styles stay solid', () => {
  it.each(['src/features/test/TestSession.css', 'src/features/test/TestDone.css', 'src/features/learn/stage/StageRunner.css'])(
    '%s has no gradient, translucent fill, blur or glow',
    (path) => {
      const css = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(css).not.toMatch(/gradient|rgba?\(|color-mix|backdrop-filter|filter:|hsla\(/)
    },
  )
})
