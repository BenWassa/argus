// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MORSE_LETTERS, type MorseLetter } from '../../domain/morse/code'
import { morseWordCheckpoints } from '../../domain/morse/curriculum/checkpoints'
import {
  advanceLesson, answerLesson, currentStep, introduceLesson, startLesson, type LessonRun,
} from '../../domain/morse/curriculum/lesson'
import { catalogDefinition, freshCatalogTopic } from '../../domain/library/catalog'
import { newFluencyProgress } from '../../domain/morse/fluency/progress'
import { MORSE_FEEDBACK_CORRECT_MS, MORSE_TRANSITION_MS } from '../../domain/morse/response'
import { HAPTIC_PATTERNS, setHapticsEnabled } from '../../shared/haptics'
import { LibraryProvider } from '../../services/library/LibraryProvider'
import { MorseLesson } from './lesson/MorseLesson'
import { MorseCheckpoint } from './lesson/MorseCheckpoint'
import { MorsePlacementDialog } from './MorsePlacementDialog'
import { SendRun } from './fluency/SendRun'

// The mounted key has its own pointer/keyboard tests. Here a keyed completion
// is injected directly, so tests observe *only* semantic verdict vibrations.
// The mock never emits the key's independent onset ('element').
vi.mock('./input/MorseKeyInput', () => ({
  MorseKeyInput: ({ locked, onSubmit }: { locked?: boolean; onSubmit: (pattern: string) => void }) => (
    <>
      <button type="button" disabled={locked} onClick={() => onSubmit(expectedPattern())}>Correct key</button>
      <button type="button" disabled={locked} onClick={() => {
        const expected = expectedPattern()
        onSubmit(expected === '.' ? '-' : '.')
      }}>Wrong key</button>
    </>
  ),
}))
vi.mock('./input/MorseWordKeyInput', () => ({
  MorseWordKeyInput: ({ locked, word, onSubmit }: {
    locked?: boolean; word: string; onSubmit: (patterns: string[]) => void
  }) => (
    <>
      <button type="button" disabled={locked}
        onClick={() => onSubmit([...word].map((letter) => MORSE_LETTERS[letter as MorseLetter]))}>Correct word</button>
      <button type="button" disabled={locked} onClick={() => onSubmit(['.'])}>Wrong word</button>
    </>
  ),
}))

function expectedPattern(): string {
  const letter = document.querySelector('.morse-checkpoint-target .is-current')?.textContent
    ?? document.querySelector('.morse-checkpoint-letter')?.textContent
    ?? document.querySelector('.morse-placement-letter')?.textContent
    ?? document.querySelector('.lesson-check .lesson-glyph')?.textContent
    ?? document.querySelector('.send-target .is-current')?.textContent
    ?? 'E'
  return MORSE_LETTERS[letter as MorseLetter] ?? '.'
}

const effect = (name: keyof typeof HAPTIC_PATTERNS) => HAPTIC_PATTERNS[name]

function vibrateSpy() {
  const vibrate = vi.fn((_pattern: number | number[]) => true)
  Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
  return vibrate
}
function next() {
  act(() => vi.advanceTimersByTime(MORSE_FEEDBACK_CORRECT_MS + MORSE_TRANSITION_MS + 1))
}
function correct() {
  fireEvent.click(screen.getByRole('button', { name: 'Correct key' }))
}
function wrong() {
  fireEvent.click(screen.getByRole('button', { name: 'Wrong key' }))
}
function freshMorse() {
  const definition = catalogDefinition('international-morse-letters-printed')
  if (!definition) throw new Error('Missing shipped Morse topic.')
  return freshCatalogTopic(definition, new Date('2026-09-17T22:00:00.000Z'))
}
function firstCheck(): LessonRun {
  const topic = freshMorse()
  let run = startLesson(topic) as LessonRun
  for (let i = 0; i < 40; i += 1) {
    const step = currentStep(run)
    if (!step) break
    if (step.kind === 'introduce') {
      run = introduceLesson(run, step.entry.itemId)
    } else if (step.kind === 'check') {
      return run
    } else {
      break
    }
  }
  throw new Error('Could not reach lesson check.')
}

const originalVibrate = Object.getOwnPropertyDescriptor(navigator, 'vibrate')
beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  setHapticsEnabled(true)
  if (originalVibrate) Object.defineProperty(navigator, 'vibrate', originalVibrate)
  else delete (navigator as { vibrate?: unknown }).vibrate
})

describe('#280: Morse verdict haptics are emitted by the grading surface', () => {
  it('emits one Learn visual verdict at answer time, not on mount or repeated clicks', () => {
    const vibrate = vibrateSpy()
    const topic = freshMorse()
    render(<LibraryProvider><MorseLesson topic={topic} initialRun={firstCheck()}
      onExit={vi.fn()} onTest={vi.fn()} onReference={vi.fn()} /></LibraryProvider>)
    expect(vibrate).not.toHaveBeenCalled()
    correct()
    expect(vibrate.mock.calls.map(([value]) => value)).toEqual([effect('settle')])
    // The answer gate becomes inert while its feedback remains.
    correct()
    expect(vibrate).toHaveBeenCalledTimes(1)
    next()
    expect(vibrate).toHaveBeenCalledTimes(1)
  })

  it('grades each checkpoint warmup, then one complete word without doubling its final character', () => {
    const vibrate = vibrateSpy()
    render(<MorseCheckpoint checkpoint={morseWordCheckpoints()[0]} onExit={vi.fn()} />)
    for (let i = 0; i < 4; i += 1) { correct(); next() }
    expect(vibrate.mock.calls.map(([value]) => value)).toEqual(Array(4).fill(effect('settle')))
    for (let i = 0; i < 4; i += 1) { correct(); next() }
    expect(vibrate.mock.calls.map(([value]) => value)).toEqual([
      ...Array(7).fill(effect('settle')), effect('word'),
    ])
    expect(screen.getByText('Checkpoint done')).toBeTruthy()
  })

  it('does not award a word verdict after an earlier mistake in that word', () => {
    const vibrate = vibrateSpy()
    render(<MorseCheckpoint checkpoint={morseWordCheckpoints()[0]} onExit={vi.fn()} />)
    for (let i = 0; i < 4; i += 1) { correct(); next() }
    wrong()
    expect(vibrate.mock.lastCall?.[0]).toEqual(effect('miss'))
    // A miss waits for explicit Continue; timer activity cannot regrade it.
    act(() => vi.advanceTimersByTime(10_000))
    expect(vibrate).toHaveBeenCalledTimes(5)
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    act(() => vi.advanceTimersByTime(MORSE_TRANSITION_MS + 1))
    for (let i = 0; i < 3; i += 1) { correct(); next() }
    expect(vibrate.mock.lastCall?.[0]).toEqual(effect('settle'))
    expect(vibrate.mock.calls.some(([value]) => value === effect('word'))).toBe(false)
  })

  it('grades placement once per letter and respects the vibration preference without affecting input', () => {
    const vibrate = vibrateSpy()
    render(<MorsePlacementDialog topic={freshMorse()} onClose={vi.fn()} onNew={vi.fn()}
      onCommit={vi.fn()} onContinue={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Know some Morse/ }))
    correct()
    expect(vibrate.mock.calls.map(([value]) => value)).toEqual([effect('settle')])
    next()
    setHapticsEnabled(false)
    wrong()
    expect(vibrate).toHaveBeenCalledTimes(1)
    expect(document.querySelector('.morse-placement-feedback')).toBeTruthy()
  })

  it('sends a Spotlight word with only one final word verdict and no review duplicate', () => {
    const vibrate = vibrateSpy()
    render(<SendRun stage="words" progress={newFluencyProgress()} onProgress={vi.fn()}
      onStage={vi.fn()} onExit={vi.fn()} seed={0} />)
    const target = document.querySelector('.send-target')?.getAttribute('aria-label')?.replace(/^Send /, '')
    if (!target) throw new Error('No Spotlight target.')
    for (let i = 0; i < target.length; i += 1) { correct(); next() }
    expect(vibrate.mock.calls.map(([value]) => value)).toEqual([
      ...Array(target.length - 1).fill(effect('settle')), effect('word'),
    ])
    expect(screen.getByText('Received as sent')).toBeTruthy()
    expect(vibrate).toHaveBeenCalledTimes(target.length)
  })

  it('does not equate a word gap with a success verdict in flow sending', () => {
    const vibrate = vibrateSpy()
    render(<SendRun stage="phrases" progress={newFluencyProgress()} onProgress={vi.fn()}
      onStage={vi.fn()} onExit={vi.fn()} seed={0} />)
    correct()
    fireEvent.click(screen.getByRole('button', { name: 'Space' }))
    expect(vibrate).not.toHaveBeenCalled()
  })
})
