// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { LibraryProvider } from '../../lib/LibraryProvider'
import { seedLibrary } from '../../lib/seed'
import type { Topic } from '../../lib/types'
import { PracticeRun } from './PracticeRun'

const STORE_KEY = 'argus.library.v5'

function seededTopic(id: string): Topic {
  const found = seedLibrary().topics.find((topic) => topic.id === id)
  if (!found) throw new Error(`no seeded topic ${id}`)
  return found as Topic
}

const NATO = seededTopic('nato-phonetic')

function open(topic: Topic, itemIds?: string[]) {
  return render(
    <LibraryProvider>
      <PracticeRun
        topic={topic}
        itemIds={itemIds}
        onExit={() => undefined}
        onCheck={() => undefined}
      />
    </LibraryProvider>,
  )
}

function questionNow(): string {
  return document.querySelector('.practice-question .practice-value')?.textContent ?? ''
}

function reveal() {
  fireEvent.click(screen.getByRole('button', { name: 'Reveal answer' }))
}

function grade(correct: boolean) {
  fireEvent.click(screen.getByRole('button', { name: correct ? 'Got it' : 'Not yet' }))
  const next = screen.queryByRole('button', { name: 'Continue' })
  if (next) fireEvent.click(next)
}

/** Answer the whole run correctly, however long it turns out to be. */
function runToEnd(limit = 40) {
  for (let i = 0; i < limit; i += 1) {
    if (!document.querySelector('.practice-question')) return
    reveal()
    grade(true)
  }
  throw new Error('practice run did not end')
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

/**
 * The evidence boundary, tested the way the codebase tests boundaries it
 * actually cares about: structurally first, behaviourally second.
 *
 * §15.5 decided that repair is formative. That means a practice answer must not
 * reach `itemEvidence`, `lastTestedAt`, `history`, the scheduler or completion.
 * The strongest available proof is that the module cannot reach them — it
 * imports nothing that writes — and the next strongest is that running one end
 * to end leaves storage byte-identical.
 */
describe('practice writes nothing', () => {
  it('imports no store write, scheduler or evidence recorder', () => {
    const source = readFileSync(resolve('src/features/practice/PracticeRun.tsx'), 'utf8')
    const imports = [...source.matchAll(/^import[\s\S]*?from '([^']+)'/gm)].map((m) => m[1])

    // The same guarantee `MorseReplay` gives. If a future edit needs one of
    // these, it is no longer a formative run and this test should be the thing
    // that says so.
    expect(imports).not.toContain('../../lib/LibraryProvider')
    expect(imports).not.toContain('../../lib/scheduling')
    expect(imports).not.toContain('../../lib/cueLadder')
    expect(source).not.toContain('updateTopic')
    expect(source).not.toContain('resolveAttempt')
    expect(source).not.toContain('recordAnswer')
    expect(source).not.toContain('mergeItemEvidence')
  })

  it('leaves stored state untouched by a completed run', () => {
    open(NATO, [NATO.items[0].id!, NATO.items[1].id!])
    const before = localStorage.getItem(STORE_KEY)
    runToEnd()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Practice done')
    expect(localStorage.getItem(STORE_KEY)).toBe(before)
  })

  it('leaves stored state untouched by a run full of misses', () => {
    open(NATO, [NATO.items[0].id!])
    const before = localStorage.getItem(STORE_KEY)
    reveal()
    grade(false)
    reveal()
    grade(false)
    reveal()
    grade(true)
    expect(localStorage.getItem(STORE_KEY)).toBe(before)
  })
})

describe('what it asks', () => {
  it('asks exactly the items it was given', () => {
    const [first, second] = NATO.items
    open(NATO, [first.id!, second.id!])

    const asked = new Set<string>()
    for (let i = 0; i < 6 && document.querySelector('.practice-question'); i += 1) {
      asked.add(questionNow())
      reveal()
      grade(true)
    }

    // NATO items are forward-only, so one target each and no reverse question.
    expect(asked).toEqual(new Set([first.prompt, second.prompt]))
  })

  it('shows the answer only after a deliberate reveal', () => {
    const first = NATO.items[0]
    open(NATO, [first.id!])
    expect(document.body.innerHTML).not.toContain(first.answer)
    reveal()
    expect(document.querySelector('.practice-answer')?.textContent).toContain(first.answer)
  })

  it('brings a missed item back before the run ends', () => {
    const first = NATO.items[0]
    open(NATO, [first.id!])
    reveal()
    fireEvent.click(screen.getByRole('button', { name: 'Not yet' }))
    // Feedback names the answer and promises the return.
    expect(document.querySelector('.practice-feedback')?.textContent).toContain(first.answer)
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(questionNow()).toBe(first.prompt)
  })

  it('does not end while a missed item is still outstanding', () => {
    open(NATO, [NATO.items[0].id!])
    reveal()
    grade(false)
    expect(screen.queryByText('Practice done')).toBeNull()
    reveal()
    grade(true)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Practice done')
  })
})

describe('the end of a run', () => {
  it('hands off to the check rather than claiming anything', () => {
    open(NATO, [NATO.items[0].id!])
    runToEnd()
    expect(screen.getByRole('button', { name: 'Take the check' })).toBeTruthy()
    expect(document.querySelector('.practice-summary')?.textContent).toContain(
      'Nothing was recorded and nothing moved',
    )
  })
})
