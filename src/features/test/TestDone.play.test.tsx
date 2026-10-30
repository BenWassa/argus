// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../domain/library/topic'
import type { Resolution } from '../../domain/study/scheduling'
import type { BankedAttempt } from './bankedAttempt'
import { TestDone } from './TestDone'

/**
 * The Test end screen is where an alphabet learner meets Play (#201). It leads
 * with guided sending only for a Test that actually banked the Morse course,
 * keeps it at text weight for any other real Morse result, and never offers it
 * where the run was withheld or the topic is not Morse.
 */

function seeded(id: string): Topic {
  const found = seedLibrary().topics.find((topic) => topic.id === id)
  if (!found) throw new Error(`no seeded topic ${id}`)
  return found as Topic
}

const MORSE = seeded('international-morse-letters-printed')
const NATO: Topic = { ...seeded('nato-phonetic'), status: 'learning', drilledAt: null, completedAt: null }

function attempt(topic: Topic, over: Partial<Resolution> = {}, extra: Partial<BankedAttempt> = {}): BankedAttempt {
  return {
    resolution: { topic, from: 'drilled', to: 'completed', completed: true, ...over },
    withheldByAcquisition: false,
    nonQualifying: false,
    ...extra,
  }
}

function renderDone(banked: BankedAttempt[], onPlayMorse = vi.fn(), missed: Record<string, string[]> = {}) {
  render(
    <TestDone
      banked={banked}
      missed={missed}
      onExit={vi.fn()}
      onPlayMorse={onPlayMorse}
      score={{ correct: 3, total: 4 }}
    />,
  )
  return onPlayMorse
}

afterEach(cleanup)

describe('the Test end screen hands Morse learners to play', () => {
  it('leads with sending five words after a banked Morse course', () => {
    const onPlay = renderDone([attempt(MORSE)])
    const send = screen.getByRole('button', { name: 'Send five words' })
    expect(send.className).not.toContain('ghost')
    expect(screen.getByRole('button', { name: 'Done' }).className).toContain('ghost')
    expect(screen.getByRole('heading', { name: '3 of 4 correct' })).toBeTruthy()
    fireEvent.click(send)
    expect(onPlay).toHaveBeenCalledWith(MORSE.id)
  })

  it('keeps play at text weight for a Morse run that did not bank', () => {
    renderDone([attempt(MORSE, { completed: false, to: 'drilled' })])
    expect(screen.queryByRole('button', { name: 'Send five words' })).toBeNull()
    const play = screen.getByRole('button', { name: 'Play with words' })
    expect(play.className).toContain('ghost')
  })

  it('keeps optional play discoverable after a later Test, without a new completion celebration', () => {
    renderDone([attempt(MORSE, { completed: false, from: 'completed', to: 'decayed' })])
    expect(screen.getByRole('button', { name: 'Play with words' }).className).toContain('ghost')
    expect(screen.queryByText(/Next: send your first words/)).toBeNull()
  })

  it('offers nothing when the run was withheld because the lesson is unfinished', () => {
    renderDone([attempt(MORSE, { completed: false }, { withheldByAcquisition: true })])
    expect(screen.queryByRole('button', { name: /Send five words|Play with words/ })).toBeNull()
  })

  it('does not treat a clean but non-qualifying run as a completion', () => {
    renderDone([attempt(MORSE, { completed: false }, { nonQualifying: true })])
    expect(screen.queryByRole('button', { name: 'Send five words' })).toBeNull()
  })

  it('offers nothing for a topic that is not the Morse course', () => {
    renderDone([attempt(NATO)])
    expect(screen.queryByRole('button', { name: /Send five words|Play with words/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Done' }).className).not.toContain('ghost')
  })
})

describe('the Test end screen counts in one unit', () => {
  it('keeps Morse sprint offers and reviews ordinary lessons', () => {
    const morseMissed = MORSE.items.slice(0, 2).map((item) => item.id!)
    const { unmount } = render(<TestDone banked={[attempt(MORSE)]} missed={{ [MORSE.id]: morseMissed }} onExit={vi.fn()} onPractice={vi.fn()} score={{ correct: 24, total: 26 }} />)
    expect(screen.getByRole('button', { name: 'Practise 2 letters' })).toBeTruthy()
    unmount()
    render(<TestDone banked={[attempt(NATO)]} missed={{ [NATO.id]: [NATO.items[0].id!] }} onExit={vi.fn()} onPractice={vi.fn()} score={{ correct: 25, total: 26 }} />)
    expect(screen.getByRole('button', { name: 'Review lesson' })).toBeTruthy()
    expect(document.querySelector('.test-missed-chip')?.textContent).toContain(NATO.items[0].prompt)
  })
})
