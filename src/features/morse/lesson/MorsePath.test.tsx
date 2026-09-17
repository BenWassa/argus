// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { morseLessonPath } from '../../../domain/morse/curriculum/lessonPath'
import { morseWordCheckpointPath } from '../../../domain/morse/curriculum/checkpoints'
import { seedLibrary } from '../../../domain/library/catalogSeed'
import { parseLibrary } from '../../../lib/storage'
import type { Topic } from '../../../domain/library/topic'
import { MorsePath } from './MorsePath'

/**
 * The curriculum path, moved out of the Learn run and onto the topic page.
 *
 * These are the invariants the old `MorseProgramme` suite protected, re-asserted
 * against the surface that replaced it, and mostly promoted from source-text
 * matching to rendered behaviour. The one boundary still worth checking in the
 * source is purity: the path must remain incapable of writing learner state, and
 * that is a property of the file rather than of any one render.
 */

const MORSE_ID = 'international-morse-letters-printed'

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')
}

function morseTopic(): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((candidate) => candidate.id === MORSE_ID)
  if (!topic) throw new Error('Missing seeded Morse topic')
  return { ...topic, status: 'unstarted', lessonProgress: {}, history: [], itemEvidence: {} }
}

function renderPath(overrides: Partial<Parameters<typeof MorsePath>[0]> = {}) {
  const topic = morseTopic()
  const path = morseLessonPath(topic)
  const checkpoints = morseWordCheckpointPath(topic)
  if (!path || !checkpoints) throw new Error('Expected a derived Morse path')

  const props = {
    path,
    checkpoints,
    ready: false,
    onLesson: vi.fn(),
    onCheckpoint: vi.fn(),
    onCheck: vi.fn(),
    ...overrides,
  }
  render(<MorsePath {...props} />)
  return props
}

afterEach(cleanup)

describe('the path projects the curriculum and owns none of it', () => {
  it('renders thirteen lessons, four checkpoints and the Test that closes them', () => {
    renderPath()
    expect(document.querySelectorAll('.morse-path-lesson')).toHaveLength(13)
    expect(document.querySelectorAll('.morse-path-checkpoint')).toHaveLength(4)
    expect(document.querySelectorAll('.morse-path-check')).toHaveLength(1)
  })

  it('numbers canonical lessons independently of the interstitial checkpoints', () => {
    renderPath()
    const numbers = [...document.querySelectorAll('.morse-path-lesson .morse-path-number')].map(
      (node) => node.textContent,
    )
    expect(numbers).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13'])
  })

  it('writes no learner state and holds no second unlock database', () => {
    const code = source('./MorsePath.tsx')
    expect(code).not.toContain('updateTopic')
    expect(code).not.toContain('useLibrary')
    expect(code).not.toContain('useState')
    expect(code).not.toContain('lessonProgress')
    // No history microstate either: choosing a task is a route, so Android Back
    // leaves the task rather than unwinding an invisible selection.
    expect(code).not.toContain('pushState')
    expect(code).not.toContain('history.')
  })
})

describe('states are distinguishable and reachable', () => {
  it('marks the current lesson as the current step and offers to continue it', () => {
    renderPath()
    const current = document.querySelector('[aria-current="step"]')
    expect(current?.classList.contains('is-current')).toBe(true)
    expect(current?.querySelector('.morse-path-action')?.textContent).toBe('Continue')
    // Named for screen readers, because fifteen controls all reading `Continue`
    // or `Start` are distinguishable by position and by nothing else.
    expect(current?.querySelector('.morse-path-action')?.getAttribute('aria-label')).toBe(
      'Continue lesson 1',
    )
  })

  it('states a locked entry rather than offering a control that does nothing', () => {
    renderPath()
    // A disabled button still invites a press. A word does not.
    expect([...document.querySelectorAll('button')].some((button) => button.disabled)).toBe(false)
    expect(document.querySelectorAll('.morse-path-action.is-locked').length).toBeGreaterThan(0)
  })

  it('hands the lesson index and whether it is a replay back to the caller', () => {
    const props = renderPath()
    fireEvent.click(screen.getByRole('button', { name: 'Continue lesson 1' }))
    expect(props.onLesson).toHaveBeenCalledWith(0, false)
  })

  it('keeps the Test reachable before readiness, and names the consequence there', () => {
    const props = renderPath({ ready: false })
    const check = document.querySelector('.morse-path-check') as HTMLElement
    expect(check.textContent).toContain('without moving the ladder')
    fireEvent.click(check.querySelector('.morse-path-action') as HTMLElement)
    expect(props.onCheck).toHaveBeenCalled()
  })

  it('leads with the Test once acquisition is ready', () => {
    renderPath({ ready: true })
    const check = document.querySelector('.morse-path-check') as HTMLElement
    expect(check.classList.contains('is-ready')).toBe(true)
    expect(check.querySelector('.morse-path-action')?.textContent).toBe('Start')
  })
})

describe('the path stays legible on a phone', () => {
  it('keeps a small-screen fallback and scales type with the token scale', () => {
    const css = source('./MorsePath.css')
    expect(css).toContain('@media (max-width: 380px)')
    expect(css).not.toMatch(/font-size:\s*\d+px/)
  })

  it('carries no per-row card surface, so thirteen rows read as one sequence', () => {
    const css = source('./MorsePath.css')
    // `DESIGN.md` names a wall of identical rounded tiles as an anti-reference,
    // and at thirteen repeats a border stops separating anything.
    expect(css).not.toMatch(/\.morse-path-item\s*\{[^}]*border-radius/)
    expect(css).not.toMatch(/\.morse-path-item\s*\{[^}]*box-shadow/)
  })
})
