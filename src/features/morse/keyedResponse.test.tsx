// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MORSE_LETTERS } from '../../lib/morse'
import {
  MORSE_FEEDBACK_CORRECT_MS,
  MORSE_FEEDBACK_WRONG_MS,
  MORSE_TRANSITION_MS,
  morseElementDurationMs,
} from '../../lib/morseResponse'
import { morseWordCheckpoints } from '../../lib/morseWordCheckpoints'
import { MorseCheckpoint } from '../learn/MorseCheckpoint'
import { MorseKeyInput } from './MorseKeyInput'

/**
 * Browser-lifecycle contract for the keyed Morse response (#87).
 *
 * The defects this suite exists to prevent are all boundary defects rather
 * than grading defects: a tone cut off at finger-contact duration, an answer
 * committed before its own sound finished, a hit whose feedback never survived
 * a frame, and a second tap landing on a target the learner had not yet seen.
 * Nothing here asserts anything about evidence, because #87 changes none.
 */

class FakeParam {
  value = 0
  readonly events: Array<{ kind: string; value: number; at: number }> = []
  setValueAtTime(value: number, at: number) {
    this.events.push({ kind: 'set', value, at })
    this.value = value
    return this
  }
  linearRampToValueAtTime(value: number, at: number) {
    this.events.push({ kind: 'ramp', value, at })
    this.value = value
    return this
  }
  cancelScheduledValues(at: number) {
    this.events.push({ kind: 'cancel', value: 0, at })
    return this
  }
}

class FakeOscillator {
  type = 'sine'
  readonly frequency = new FakeParam()
  startedAt: number | null = null
  stoppedAt: number | null = null
  connect() {}
  disconnect() {}
  start(at = 0) {
    this.startedAt = at
  }
  stop(at = 0) {
    this.stoppedAt = at
  }
}

class FakeGain {
  readonly gain = new FakeParam()
  connect() {}
  disconnect() {}
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = []
  currentTime = 0
  state: AudioContextState = 'running'
  destination = {} as AudioDestinationNode
  readonly oscillators: FakeOscillator[] = []
  resumeCalls = 0
  /** Set before construction to model a context that has not been unlocked. */
  static initialState: AudioContextState = 'running'

  constructor() {
    this.state = FakeAudioContext.initialState
    FakeAudioContext.instances.push(this)
  }
  createOscillator() {
    const oscillator = new FakeOscillator()
    this.oscillators.push(oscillator)
    return oscillator
  }
  createGain() {
    return new FakeGain()
  }
  async resume() {
    this.resumeCalls += 1
    this.state = 'running'
  }
  async close() {
    this.state = 'closed'
  }
}

function context(): FakeAudioContext {
  const found = FakeAudioContext.instances.at(-1)
  if (!found) throw new Error('No AudioContext was created.')
  return found
}

/** One element's audible span, in seconds, from the scheduled oscillator. */
function soundedSeconds(oscillator: FakeOscillator): number {
  if (oscillator.startedAt === null || oscillator.stoppedAt === null) {
    throw new Error('Oscillator was never scheduled.')
  }
  return Number((oscillator.stoppedAt - oscillator.startedAt).toFixed(6))
}

/** Lets the awaited `resume()` inside the key's audio path settle. */
async function settle() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function keyElement(element: '.' | '-', options: { repeat?: boolean } = {}) {
  fireEvent.keyDown(window, { key: element, repeat: options.repeat ?? false })
  await settle()
}

function key(): HTMLButtonElement {
  return screen.getByRole('button', { name: /Morse key/ }) as HTMLButtonElement
}

function answerRegion(): Element | null {
  return document.querySelector('.morse-checkpoint-answer')
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  FakeAudioContext.instances = []
  FakeAudioContext.initialState = 'running'
  ;(window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  delete (window as unknown as { AudioContext?: unknown }).AudioContext
})

describe('a keyed element is heard completely before it is graded', () => {
  it('lengthens a stabbed dit to the canonical element instead of cutting it at contact duration', async () => {
    const onSubmit = vi.fn()
    render(<MorseKeyInput expectedLength={1} onSubmit={onSubmit} />)

    await keyElement('.')

    const oscillator = context().oscillators.at(-1)!
    expect(soundedSeconds(oscillator)).toBe(morseElementDurationMs('.') / 1000)
    expect(morseElementDurationMs('.')).toBe(100)
  })

  it('gives a dah the full three-unit tone from the same shared timing', async () => {
    render(<MorseKeyInput expectedLength={1} onSubmit={vi.fn()} />)

    await keyElement('-')

    expect(soundedSeconds(context().oscillators.at(-1)!)).toBe(morseElementDurationMs('-') / 1000)
    expect(morseElementDurationMs('-')).toBe(morseElementDurationMs('.') * 3)
  })

  it('does not submit the completed pattern until its final element has finished sounding', async () => {
    const onSubmit = vi.fn()
    render(<MorseKeyInput expectedLength={1} onSubmit={onSubmit} />)

    await keyElement('.')
    expect(onSubmit).not.toHaveBeenCalled()

    advance(morseElementDurationMs('.') - 1)
    expect(onSubmit).not.toHaveBeenCalled()

    advance(10)
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('.')
  })

  it('schedules exactly one oscillator when the context only resumes after the press', async () => {
    FakeAudioContext.initialState = 'suspended'
    const onSubmit = vi.fn()
    render(<MorseKeyInput expectedLength={1} onSubmit={onSubmit} />)

    await keyElement('.')

    expect(context().resumeCalls).toBe(1)
    expect(context().oscillators).toHaveLength(1)
    expect(soundedSeconds(context().oscillators[0])).toBe(morseElementDurationMs('.') / 1000)

    advance(morseElementDurationMs('.') + 10)
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('.')
  })

  it('still submits, without hanging, when the browser provides no Web Audio at all', async () => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext
    const onSubmit = vi.fn()
    render(<MorseKeyInput expectedLength={1} onSubmit={onSubmit} />)

    await keyElement('.')
    // Without audio there is nothing to wait for, but the lifecycle is the
    // same shape so the element still owes its nominal length.
    advance(morseElementDurationMs('.') + 10)

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('.')
  })

  it('lets a multi-element letter be keyed faster than its own sound', async () => {
    const onSubmit = vi.fn()
    render(<MorseKeyInput expectedLength={3} onSubmit={onSubmit} />)

    // S is three dits. Keying them back to back must not drop any: only the
    // completed pattern waits on audio, never the elements in front of it.
    await keyElement('.')
    await keyElement('.')
    await keyElement('.')

    advance(morseElementDurationMs('.') + 10)
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('...')
  })
})

describe('the key refuses input it must not accept', () => {
  it('ignores autorepeat so a held key cannot run out a whole pattern by itself', async () => {
    const onSubmit = vi.fn()
    render(<MorseKeyInput expectedLength={2} onSubmit={onSubmit} />)

    await keyElement('.')
    advance(morseElementDurationMs('.') + 10)
    await keyElement('.', { repeat: true })
    await keyElement('.', { repeat: true })
    advance(1000)

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('accepts nothing at all while the parent holds the gate', async () => {
    const onSubmit = vi.fn()
    render(<MorseKeyInput expectedLength={1} locked onSubmit={onSubmit} />)

    await keyElement('.')
    advance(1000)

    expect(onSubmit).not.toHaveBeenCalled()
    expect(key().disabled).toBe(true)
  })

  it('abandons rather than grades a press interrupted by backgrounding the app', async () => {
    const onSubmit = vi.fn()
    render(<MorseKeyInput expectedLength={1} onSubmit={onSubmit} />)
    const control = key()

    fireEvent.pointerDown(control, { pointerId: 1, button: 0 })
    await settle()

    // No `pointerup` ever arrives; the app just goes away.
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    fireEvent(document, new Event('visibilitychange'))
    advance(2000)

    expect(onSubmit).not.toHaveBeenCalled()
    // The sustaining tone was closed out rather than left humming.
    const sustained = context().oscillators.at(-1)
    if (sustained) expect(sustained.stoppedAt).not.toBeNull()
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  })

  it('does not grade a press that was cancelled or lost its pointer capture', async () => {
    const onSubmit = vi.fn()
    render(<MorseKeyInput expectedLength={1} onSubmit={onSubmit} />)
    const key = screen.getByRole('button', { name: /Morse key/ })

    fireEvent.pointerDown(key, { pointerId: 1, button: 0 })
    await settle()
    fireEvent.pointerCancel(key, { pointerId: 1 })
    advance(1000)

    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('the checkpoint boundary cannot be crossed by a tap still in flight', () => {
  const checkpoint = morseWordCheckpoints()[0]

  async function keyPattern(pattern: string) {
    for (const element of pattern) {
      await keyElement(element as '.' | '-')
      advance(morseElementDurationMs(element as '.' | '-') + 10)
    }
  }

  it('holds a hit on screen for the shared dwell, then transitions before re-arming', async () => {
    render(<MorseCheckpoint checkpoint={checkpoint} onExit={vi.fn()} />)
    expect(screen.getByText('Warm-up 1 of 4')).toBeTruthy()

    const first = checkpoint.warmups[0]
    await keyPattern(MORSE_LETTERS[first])

    // The verdict is perceivable rather than cleared in the tick it was set.
    expect(screen.getByText('Correct')).toBeTruthy()
    advance(MORSE_FEEDBACK_CORRECT_MS - 20)
    expect(screen.getByText('Correct')).toBeTruthy()

    advance(40)
    expect(screen.getByText('Warm-up 2 of 4')).toBeTruthy()
    // The next letter exists but is not yet answerable.
    expect(key().disabled).toBe(true)

    advance(MORSE_TRANSITION_MS)
    expect(key().disabled).toBe(false)
  })

  it('keeps a miss readable for longer than a hit, on the one shared policy', async () => {
    render(<MorseCheckpoint checkpoint={checkpoint} onExit={vi.fn()} />)

    const first = checkpoint.warmups[0]
    const wrong = MORSE_LETTERS[first] === '.' ? '-' : '.'
    await keyPattern(wrong.repeat(MORSE_LETTERS[first].length))

    expect(screen.getByText('Miss')).toBeTruthy()
    advance(MORSE_FEEDBACK_CORRECT_MS + 20)
    expect(screen.getByText('Miss')).toBeTruthy()

    advance(MORSE_FEEDBACK_WRONG_MS - MORSE_FEEDBACK_CORRECT_MS)
    expect(screen.getByText('Warm-up 2 of 4')).toBeTruthy()
    expect(MORSE_FEEDBACK_WRONG_MS).toBeGreaterThan(MORSE_FEEDBACK_CORRECT_MS)
  })

  it('cannot be answered again during feedback or during the transition that follows', async () => {
    render(<MorseCheckpoint checkpoint={checkpoint} onExit={vi.fn()} />)

    const first = checkpoint.warmups[0]
    await keyPattern(MORSE_LETTERS[first])
    expect(screen.getByText('Correct')).toBeTruthy()

    // Rapid tapping while the verdict is still standing.
    for (let press = 0; press < 4; press += 1) {
      await keyElement('.')
      advance(30)
    }
    expect(screen.getByText('Correct')).toBeTruthy()

    // The dwell ends and warm-up 2 appears, but it is mid-transition.
    advance(MORSE_FEEDBACK_CORRECT_MS)
    expect(screen.getByText('Warm-up 2 of 4')).toBeTruthy()

    // Tapping through the transition too.
    for (let press = 0; press < 4; press += 1) {
      await keyElement('.')
      advance(10)
    }

    // Warm-up 2 is reached un-answered: not one of those presses became an
    // answer to a letter the learner had not yet been shown.
    advance(MORSE_TRANSITION_MS)
    expect(screen.getByText('Warm-up 2 of 4')).toBeTruthy()
    expect(screen.queryByText('Correct')).toBeNull()
    expect(screen.queryByText('Miss')).toBeNull()
    expect(key().disabled).toBe(false)
  })

  it('gates the answer region itself, not just the control inside it', async () => {
    render(<MorseCheckpoint checkpoint={checkpoint} onExit={vi.fn()} />)

    const first = checkpoint.warmups[0]
    await keyPattern(MORSE_LETTERS[first])
    advance(MORSE_FEEDBACK_CORRECT_MS + 20)

    // `inert` removes the whole region from hit testing, so a tap cannot fall
    // through the disabled key onto anything sitting behind it.
    expect(answerRegion()?.hasAttribute('inert')).toBe(true)

    advance(MORSE_TRANSITION_MS)
    expect(answerRegion()?.hasAttribute('inert')).toBe(false)
  })
})
