// @vitest-environment jsdom
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MORSE_LETTERS, type MorseLetter } from '../../../domain/morse/code'
import { spokenRhythm } from '../../../domain/morse/mnemonics'
import type { MorseRecognition } from '../../../domain/morse/recognition/progress'
import { MORSE_FEEDBACK_CORRECT_MS, MORSE_TRANSITION_MS } from '../../../domain/morse/response'
import { fire } from '../../../shared/haptics'
import { LetterPracticeRun } from './LetterPracticeRun'

vi.mock('../../../shared/haptics', () => ({ fire: vi.fn() }))

vi.mock('../input/MorseKeyInput', () => ({
  MorseKeyInput: ({ onSubmit }: { onSubmit: (pattern: string) => void }) => (
    <div>
      <button onClick={() => onSubmit('.')}>Key correct</button>
      <button onClick={() => onSubmit('-')}>Key wrong</button>
    </div>
  ),
}))

const played = vi.hoisted(() => ({ glyph: '' }))

vi.mock('../useMorseAudio', async () => {
  const React = await import('react')
  return {
    useMorseAudio: () => {
      const [sounding, setSounding] = React.useState<{ glyph: string; index: number | null } | null>(null)
      const toggle = (glyph: string) => {
        if (sounding) setSounding(null)
        else {
          played.glyph = glyph
          setSounding({ glyph, index: null })
          window.setTimeout(() => setSounding(null), 100)
        }
      }
      return { sounding, audioError: null, clearError: vi.fn(), play: vi.fn(), stop: () => setSounding(null), toggle }
    },
  }
})

const FOUR: MorseLetter[] = ['E', 'T', 'I', 'M']
let now = 0

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(fire).mockClear()
  now = 1_000
  vi.spyOn(performance, 'now').mockImplementation(() => now)
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

function renderRun(props: Partial<ComponentProps<typeof LetterPracticeRun>> = {}) {
  const onProgress = vi.fn()
  const onRecognition = vi.fn()
  const onExit = vi.fn()
  const onAnother = vi.fn()
  render(<LetterPracticeRun eligible={FOUR} onProgress={onProgress} onRecognition={onRecognition} onExit={onExit} onAnother={onAnother} {...props} />)
  return { onProgress, onRecognition, onExit, onAnother }
}

function finishCorrectDwell() {
  act(() => vi.advanceTimersByTime(MORSE_FEEDBACK_CORRECT_MS + MORSE_TRANSITION_MS))
}
function tileNames() {
  return within(screen.getByRole('group', { name: 'Choose the letter' })).getAllByRole('button')
    .map(button => button.getAttribute('aria-label')!.replace('Letter ', ''))
}
/** Read shows the pattern, so the target is the one whose rhythm is on screen. */
function readTarget(letters: readonly MorseLetter[] = FOUR): MorseLetter {
  const label = screen.getByRole('img', { name: /^(dit|dah)/ }).getAttribute('aria-label')
  return letters.find(l => spokenRhythm(MORSE_LETTERS[l]) === label)!
}
const tile = (letter: string) => screen.getByRole('button', { name: `Letter ${letter}` }) as HTMLButtonElement
function hear() {
  fireEvent.click(screen.getByRole('button', { name: 'Play Morse sound' }))
  act(() => vi.advanceTimersByTime(100))
}
const lastRecognition = (fn: ReturnType<typeof vi.fn>): MorseRecognition => fn.mock.lastCall?.[0]
const outcomesOf = (state: MorseRecognition, stream: keyof MorseRecognition['streams']) =>
  Object.values(state.streams[stream]!.characters).flatMap(c => c!.outcomes)

describe('LetterPracticeRun four-choice recognition', () => {
  it.each(['read', 'listen'] as const)('shows %s as four distinct taught tiles and never a text field', direction => {
    renderRun({ direction })
    if (direction === 'listen') hear()
    const names = tileNames()
    expect(names).toHaveLength(4)
    expect(new Set(names)).toEqual(new Set(FOUR))
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(document.querySelector('input')).toBeNull()
    expect(document.activeElement?.tagName).not.toBe('INPUT')
  })

  it('carries nothing on a tile that differs with the answer', () => {
    renderRun({ direction: 'read' })
    const buttons = [...screen.getByRole('group', { name: 'Choose the letter' }).querySelectorAll('button')]
    const signature = (button: Element) => [...button.attributes].map(a => a.name === 'aria-label' ? 'aria-label' : `${a.name}=${a.value}`).sort().join('|')
    expect(new Set(buttons.map(signature)).size).toBe(1)
    for (const button of buttons) expect(button.getAttribute('aria-label')).toBe(`Letter ${button.textContent}`)
  })

  it.each(['read', 'listen'] as const)('grades %s on the first tile, locks the rest and writes only recognition', direction => {
    const { onProgress, onRecognition } = renderRun({ direction })
    if (direction === 'listen') hear()
    const target = direction === 'read' ? readTarget() : played.glyph as MorseLetter
    const button = tile(target)
    fireEvent.click(button)
    fireEvent.click(button)
    expect(fire).toHaveBeenCalledExactlyOnceWith('settle')
    expect(onRecognition).toHaveBeenCalledTimes(1)
    const stream = direction === 'read' ? 'read/practice' : 'listen/practice@12'
    expect(lastRecognition(onRecognition).streams[stream]?.characters[target]?.outcomes).toEqual([true])
    expect(onProgress).not.toHaveBeenCalled()
    expect(screen.queryByRole('group', { name: 'Choose the letter' })).toBeNull()
    expect(screen.getByText('Correct')).toBeTruthy()
    finishCorrectDwell()
    expect(fire).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('progressbar', { name: '2 of 10' })).toBeTruthy()
  })

  it.each(['read', 'listen'] as const)('holds a %s miss on one verdict until Continue, with a short tap-through guard', direction => {
    const { onRecognition } = renderRun({ direction })
    if (direction === 'listen') hear()
    const target = direction === 'read' ? readTarget() : played.glyph as MorseLetter
    const wrong = tileNames().find(l => l !== target)!
    fireEvent.click(tile(wrong))
    expect(fire).toHaveBeenCalledExactlyOnceWith('miss')
    const miss = screen.getByRole('status')
    expect(miss.textContent).toContain('Not that one')
    expect(miss.querySelector('.session-miss-said-value')?.textContent).toBe(wrong)
    expect(screen.queryByRole('group', { name: 'Choose the letter' })).toBeNull()
    const stream = direction === 'read' ? 'read/practice' : 'listen/practice@12'
    expect(lastRecognition(onRecognition).streams[stream]?.characters[target]?.outcomes).toEqual([false])
    const next = screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement
    expect(next.disabled).toBe(true)
    fireEvent.click(next)
    expect(screen.getByRole('progressbar', { name: '1 of 10' })).toBeTruthy()
    act(() => vi.advanceTimersByTime(400))
    expect(next.disabled).toBe(false)
    expect(document.activeElement).toBe(next)
    act(() => vi.advanceTimersByTime(30_000))
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy()
    expect(fire).toHaveBeenCalledTimes(1)
    fireEvent.click(next)
    expect(screen.getByRole('progressbar', { name: '2 of 10' })).toBeTruthy()
  })

  it('answers from a physical keyboard by letter, only for a letter on a tile', () => {
    const { onRecognition } = renderRun({ direction: 'read' })
    const target = readTarget()
    fireEvent.keyDown(window, { key: 'z' })
    fireEvent.keyDown(window, { key: target.toLowerCase(), ctrlKey: true })
    expect(onRecognition).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: target.toLowerCase() })
    expect(fire).toHaveBeenCalledExactlyOnceWith('settle')
    expect(onRecognition).toHaveBeenCalledTimes(1)
  })

  it('keeps Listen tiles unavailable until playback has completed and after an interruption', () => {
    const { onRecognition } = renderRun({ direction: 'listen' })
    const first = tileNames()[0]
    expect(tile(first).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Play Morse sound' }))
    expect(tile(first).disabled).toBe(true)
    fireEvent(window, new Event('pagehide'))
    act(() => vi.advanceTimersByTime(100))
    expect(tile(first).disabled).toBe(true)
    fireEvent.click(tile(first))
    expect(onRecognition).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Play Morse sound' }))
    fireEvent.click(screen.getByRole('button', { name: 'Stop Morse sound' }))
    act(() => vi.advanceTimersByTime(100))
    expect(tile(first).disabled).toBe(true)
    hear()
    expect(tile(first).disabled).toBe(false)
  })

  it('does not count a helped answer as an independent verdict', () => {
    const { onRecognition } = renderRun({ direction: 'read' })
    fireEvent.click(screen.getByRole('button', { name: 'Help' }))
    expect(document.querySelector('.morse-character-support')).toBeTruthy()
    fireEvent.click(tile(readTarget()))
    expect(screen.getByText('Correct')).toBeTruthy()
    expect(outcomesOf(lastRecognition(onRecognition), 'read/practice')).toEqual([])
    expect(fire).not.toHaveBeenCalled()
  })

  it('offers fewer honest choices when fewer than four letters are taught, and times nothing', () => {
    const { onRecognition } = renderRun({ direction: 'read', eligible: ['E', 'T'] })
    expect(tileNames().sort()).toEqual(['E', 'T'])
    expect(screen.queryByRole('button', { name: 'Speed' })).toBeNull()
    fireEvent.click(tile(readTarget(['E', 'T'])))
    expect(screen.getByText('Correct')).toBeTruthy()
    expect(outcomesOf(lastRecognition(onRecognition), 'read/practice')).toEqual([])
  })

  it('shows one taught letter as an unscored teaching step', () => {
    const { onRecognition, onProgress, onExit } = renderRun({ direction: 'read', eligible: ['E'] })
    expect(screen.queryByRole('group', { name: 'Choose the letter' })).toBeNull()
    expect(document.querySelector('.morse-character-support')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onExit).toHaveBeenCalledOnce()
    expect(onRecognition).not.toHaveBeenCalled()
    expect(onProgress).not.toHaveBeenCalled()
    expect(fire).not.toHaveBeenCalled()
  })

  it('never introduces a letter that has not been taught', () => {
    const taught: MorseLetter[] = ['E', 'T', 'A', 'N', 'S']
    renderRun({ direction: 'read', eligible: taught })
    for (let n = 0; n < 10; n += 1) {
      expect(tileNames().every(l => taught.includes(l as MorseLetter))).toBe(true)
      fireEvent.click(tile(readTarget(taught)))
      finishCorrectDwell()
    }
    expect(screen.getByRole('heading', { name: '10 of 10 correct' })).toBeTruthy()
  })
})

describe('LetterPracticeRun Speed variant', () => {
  it('is a toggle inside Read and Listen, not a separate mode, and is absent from Key', () => {
    renderRun({ direction: 'key' })
    expect(screen.queryByRole('button', { name: 'Speed' })).toBeNull()
    cleanup()
    renderRun({ direction: 'read' })
    const toggle = screen.getByRole('button', { name: 'Speed' })
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Speed' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('10 letters · no countdown')).toBeTruthy()
  })

  it('times the first valid choice with the monotonic clock and caps a long pause at ten seconds', () => {
    const { onRecognition } = renderRun({ direction: 'read', initialSpeed: true })
    const target = readTarget()
    now += 2_400
    fireEvent.click(tile(target))
    expect(lastRecognition(onRecognition).streams['read/speed']?.characters[target]?.recentCorrectMs).toEqual([2_400])
    expect(lastRecognition(onRecognition).streams['read/practice']).toBeUndefined()
    finishCorrectDwell()
    const second = readTarget()
    now += 300_000
    fireEvent.click(tile(second))
    expect(lastRecognition(onRecognition).streams['read/speed']?.characters[second]?.recentCorrectMs.at(-1)).toBe(10_000)
  })

  it('records no speed sample for a wrong answer, a helped answer or a hidden page', () => {
    const { onRecognition } = renderRun({ direction: 'read', initialSpeed: true })
    const first = readTarget()
    now += 1_000
    fireEvent.click(tile(tileNames().find(l => l !== first)!))
    expect(lastRecognition(onRecognition).streams['read/speed']?.characters[first]?.recentCorrectMs).toEqual([])
    expect(lastRecognition(onRecognition).streams['read/speed']?.characters[first]?.outcomes).toEqual([false])
    act(() => vi.advanceTimersByTime(400))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    act(() => vi.advanceTimersByTime(MORSE_TRANSITION_MS))

    const second = readTarget()
    fireEvent.click(screen.getByRole('button', { name: 'Help' }))
    now += 1_000
    fireEvent.click(tile(second))
    expect(lastRecognition(onRecognition).streams['read/speed']?.characters[second]?.recentCorrectMs ?? []).toEqual([])
    finishCorrectDwell()

    const third = readTarget()
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    fireEvent(document, new Event('visibilitychange'))
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    now += 1_000
    fireEvent.click(tile(third))
    expect(lastRecognition(onRecognition).streams['read/speed']?.characters[third]?.outcomes).toEqual([true])
    expect(lastRecognition(onRecognition).streams['read/speed']?.characters[third]?.recentCorrectMs).toEqual([])
  })

  it('starts Listen timing only after playback ends and drops it on a replay', () => {
    const { onRecognition } = renderRun({ direction: 'listen', initialSpeed: true })
    now += 5_000
    hear()
    now += 1_500
    const target = played.glyph as MorseLetter
    fireEvent.click(tile(target))
    expect(lastRecognition(onRecognition).streams['listen/speed@12']?.characters[target]?.recentCorrectMs).toEqual([1_500])
    finishCorrectDwell()

    hear()
    hear()
    now += 1_500
    const replayed = played.glyph as MorseLetter
    const before = lastRecognition(onRecognition).streams['listen/speed@12']?.characters[replayed]?.recentCorrectMs.length ?? 0
    fireEvent.click(tile(replayed))
    const after = lastRecognition(onRecognition).streams['listen/speed@12']?.characters[replayed]
    expect(after?.outcomes.at(-1)).toBe(true)
    expect(after?.recentCorrectMs.length).toBe(before)
  })

  it('ends after ten letters with accuracy and typical speed, never a rank or a score', () => {
    const { onRecognition, onAnother } = renderRun({ direction: 'read', initialSpeed: true })
    for (let n = 0; n < 10; n += 1) {
      const target = readTarget()
      now += 2_000
      fireEvent.click(tile(target))
      finishCorrectDwell()
    }
    expect(screen.getByRole('heading', { name: '10 of 10 correct' })).toBeTruthy()
    expect(screen.getByText('Typical correct choice 2.0s')).toBeTruthy()
    expect(screen.getByText('10 timed answers')).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/score|rank|xp|wpm/i)
    expect(lastRecognition(onRecognition).streams['read/speed']).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Again' }))
    expect(onAnother).toHaveBeenCalledWith(true)
  })

  it('cannot be toggled once a round has begun', () => {
    renderRun({ direction: 'read' })
    fireEvent.click(tile(readTarget()))
    expect((screen.getByRole('button', { name: 'Speed' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('keeps a wrong answer in the ten without presenting its time as a speed', () => {
    renderRun({ direction: 'read', initialSpeed: true })
    for (let n = 0; n < 10; n += 1) {
      const target = readTarget()
      now += 1_000
      if (n === 3) {
        fireEvent.click(tile(tileNames().find(l => l !== target)!))
        act(() => vi.advanceTimersByTime(400))
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
        act(() => vi.advanceTimersByTime(MORSE_TRANSITION_MS))
      } else {
        fireEvent.click(tile(target))
        finishCorrectDwell()
      }
    }
    expect(screen.getByRole('heading', { name: '9 of 10 correct' })).toBeTruthy()
    expect(screen.getByText('Typical correct choice 1.0s')).toBeTruthy()
    expect(screen.getByText('10 timed answers')).toBeTruthy()
  })
})

describe('LetterPracticeRun Key', () => {
  it('emits one independent Key verdict and none for feedback dwell', () => {
    renderRun({ direction: 'key', eligible: ['E'] })
    fireEvent.click(screen.getByRole('button', { name: 'Key correct' }))
    expect(fire).toHaveBeenCalledExactlyOnceWith('settle')
    finishCorrectDwell()
    expect(fire).toHaveBeenCalledTimes(1)
  })

  it('emits one Key miss and no extra verdict while correction stands', () => {
    renderRun({ direction: 'key', eligible: ['E'] })
    fireEvent.click(screen.getByRole('button', { name: 'Key wrong' }))
    expect(fire).toHaveBeenCalledExactlyOnceWith('miss')
    act(() => vi.advanceTimersByTime(10_000))
    expect(fire).toHaveBeenCalledTimes(1)
  })

  it('gives Key entry focus to its single session heading', () => {
    renderRun({ eligible: ['E'] })
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Key' }))
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('does not count a helped Key answer as an independent outcome', () => {
    const { onProgress } = renderRun({ eligible: ['E'] })
    fireEvent.click(screen.getByRole('button', { name: 'Help' }))
    expect(document.querySelector('.morse-character-support')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Key correct' }))
    expect(screen.getByText('Correct')).toBeTruthy()
    expect(onProgress.mock.lastCall?.[0].characters.key.E?.outcomes).toEqual([])
    expect(fire).not.toHaveBeenCalled()
  })

  it('keeps a wrong Key answer visible until Continue, with no tap-through guard', () => {
    const { onProgress, onRecognition } = renderRun({ eligible: ['E'] })
    fireEvent.click(screen.getByRole('button', { name: 'Key wrong' }))
    // The shared miss (#263): the verdict, what was keyed, the answer, and the stimulus still above it.
    const miss = screen.getByRole('status')
    expect(miss.className).toContain('session-miss')
    expect(miss.textContent).toContain('Not that one')
    expect(miss.textContent).toContain('You keyed')
    expect(miss.querySelector('.session-miss-said-value .morse-mark.is-dah')).toBeTruthy()
    expect(document.querySelector('.letter-practice-stimulus .lesson-glyph')?.textContent).toBe('E')
    expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false)
    act(() => vi.advanceTimersByTime(5_000))
    expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false)
    expect(onProgress.mock.lastCall?.[0].characters.key.E?.outcomes).toEqual([false])
    expect(onRecognition).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('progressbar', { name: '2 of 10' })).toBeTruthy()
  })

  it('keeps Key history out of the choice stores when direction switches', () => {
    const { onProgress, onRecognition } = renderRun()
    fireEvent.click(screen.getByRole('button', { name: 'Read' }))
    expect(screen.getByRole('img', { name: /^(dit|dah)/ }).className).toContain('morse-marks is-stimulus')
    fireEvent.click(tile(readTarget()))
    expect(onProgress).not.toHaveBeenCalled()
    expect(onRecognition).toHaveBeenCalledOnce()
    finishCorrectDwell()
    fireEvent.click(screen.getByRole('button', { name: 'Key' }))
    fireEvent.click(screen.getByRole('button', { name: 'Key correct' }))
    expect(onProgress).toHaveBeenCalledOnce()
    expect(onRecognition).toHaveBeenCalledOnce()
  })
})
