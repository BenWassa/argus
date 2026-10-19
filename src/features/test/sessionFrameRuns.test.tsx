// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { LibraryProvider } from '../../services/library/LibraryProvider'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../domain/library/topic'
import type { Resolution } from '../../domain/study/scheduling'
import { PracticeRun } from '../practice/PracticeRun'
import type { BankedAttempt } from './bankedAttempt'
import { TestDone } from './TestDone'
import { TestSession } from './TestSession'

/** Test and Practice wear the shared session frame (#245). */

afterEach(cleanup)

const NATO = seedLibrary().topics.find((topic) => topic.id === 'nato-phonetic') as Topic

function attempt(over: Partial<Resolution> = {}): BankedAttempt {
  return {
    resolution: { topic: NATO, from: 'drilled', to: 'drilled', completed: false, decayed: false, ...over },
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
    expect(screen.getByRole('progressbar', { name: `0 of ${NATO.items.length}` })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy()
    expect(container.querySelector('.session-bar, .session-count')).toBeNull()
    expect(container.querySelector('.recall-shortcuts')).toBeNull()
  })
})

describe('Practice in the session frame', () => {
  it('is a practice frame whose progress counts settled targets', () => {
    const onExit = vi.fn()
    const { container } = render(
      <LibraryProvider>
        <PracticeRun topic={NATO} itemIds={[NATO.items[0].id!, NATO.items[1].id!]} onExit={onExit} onCheck={() => undefined} />
      </LibraryProvider>,
    )
    expect(container.querySelector('.session-frame')?.getAttribute('data-session-kind')).toBe('practice')
    expect(screen.getByRole('progressbar', { name: '0 of 2' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reveal answer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.getByRole('progressbar', { name: '1 of 2' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onExit).toHaveBeenCalledOnce()
  })
})

describe('the Test result is a round result', () => {
  const run = { banked: [attempt()], missed: {} as Record<string, string[]>, onExit: vi.fn() }

  it('reads correct over total, with the ladder outcome as one short line', () => {
    render(<TestDone {...run} score={{ correct: 24, total: 26 }} />)
    expect(screen.getByRole('heading', { name: '24 of 26 correct' })).toBeTruthy()
    expect(document.querySelectorAll('.test-outcome')).toHaveLength(1)
    expect(document.querySelector('.test-outcome')?.textContent).toMatch(/passed, still banked/)
    expect(screen.queryByRole('button', { name: 'Again' })).toBeNull()
  })

  it('puts repairing the misses in the primary slot, and Done beside it', () => {
    const onPractice = vi.fn()
    const first = NATO.items[0].id!
    render(<TestDone {...run} missed={{ [NATO.id]: [first] }} onPractice={onPractice} score={{ correct: 25, total: 26 }} />)
    const practise = screen.getByRole('button', { name: 'Practise 1 item' })
    expect(practise.className).not.toContain('ghost')
    expect(screen.getByRole('button', { name: 'Done' }).className).toContain('ghost')
    fireEvent.click(practise)
    expect(onPractice).toHaveBeenCalledWith(NATO.id, [first])
  })
})

describe('Test and Practice styles stay solid', () => {
  it.each(['src/features/test/TestSession.css', 'src/features/test/TestDone.css', 'src/features/practice/PracticeRun.css'])(
    '%s has no gradient, translucent fill, blur or glow',
    (path) => {
      const css = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(css).not.toMatch(/gradient|rgba?\(|color-mix|backdrop-filter|filter:|hsla\(/)
    },
  )
})
