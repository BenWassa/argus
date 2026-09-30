// @vitest-environment jsdom
import { useLayoutEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AudioCard, type AudioAnswer } from './AudioCard'
import type { Item } from '../../domain/library/topic'

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation((() => Promise.resolve()) as never)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation((() => undefined) as never)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

type Heard = Item & { audio: NonNullable<Item['audio']> }

const copyItem: Heard = {
  id: 'c1',
  kind: 'forward',
  prompt: 'Copy what you hear',
  answer: 'A12',
  audio: { assetId: 'c1', src: '/media/audio/c1.mp3', transcript: 'Alfa WUN TOO', drill: 'token-copy' },
  response: { mode: 'copy', normalizer: 'compact' },
}
const choiceItem: Heard = {
  id: 'k1',
  kind: 'forward',
  prompt: 'What does it mean?',
  answer: 'Message received',
  audio: { assetId: 'k1', src: '/media/audio/k1.mp3', transcript: 'Roger', drill: 'proword' },
  choice: { options: ['Message received', 'Repeat your message', 'Wait'] },
}
const fieldsItem: Heard = {
  id: 'f1',
  kind: 'forward',
  prompt: 'Extract the fields',
  answer: 'unused',
  audio: { assetId: 'f1', src: '/media/audio/f1.mp3', transcript: 'Mayday position north of Cape Sable taking on water', drill: 'message-extraction' },
  response: {
    mode: 'fields',
    fields: [
      { label: 'Position', expected: 'North of Cape Sable' },
      { label: 'Nature of distress', expected: 'Taking on water' },
    ],
  },
}

function open(item: Heard) {
  const onAnswer = vi.fn<(answer: AudioAnswer) => void>()
  render(<AudioCard item={item} cardKey="k" onAnswer={onAnswer} />)
  return onAnswer
}

describe('a listening card', () => {
  it('shows the recording and task with the transcript concealed', () => {
    open(copyItem)
    expect(screen.getByRole('button', { name: /Play recording/ })).toBeTruthy()
    expect(screen.getByText('Copy what you hear')).toBeTruthy()
    expect(screen.queryByText('Alfa WUN TOO')).toBeNull()
    expect(document.body.innerHTML).not.toContain('Alfa WUN TOO')
    expect(document.body.innerHTML).not.toContain('A12')
  })

  it('grades a typed copy objectively, forgiving only case and spacing, and hands it over after the dwell', () => {
    vi.useFakeTimers()
    const onAnswer = open(copyItem)
    fireEvent.change(screen.getByLabelText('Type what you heard'), { target: { value: 'a 1 2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText('Correct')).toBeTruthy()
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(onAnswer.mock.calls[0][0]).toMatchObject({ correct: true, assisted: false, response: 'a 1 2' })
  })

  it('does not forgive a wrong digit, and holds the correction with the transcript', () => {
    vi.useFakeTimers()
    const onAnswer = open(copyItem)
    fireEvent.change(screen.getByLabelText('Type what you heard'), { target: { value: 'A13' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText('Not that one')).toBeTruthy()
    expect(screen.getByText('Alfa WUN TOO')).toBeTruthy() // the transcript is shown after answering
    expect(screen.getByText('You gave').parentElement?.textContent).toContain('A13')
    expect(screen.getByText('Answer').parentElement?.textContent).toContain('A12')
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(onAnswer).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onAnswer.mock.calls[0][0]).toMatchObject({ correct: false, assisted: false })
  })

  it('will not check an empty answer', () => {
    open(copyItem)
    expect((screen.getByRole('button', { name: 'Check' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('marks an answer transcript-assisted once the transcript is revealed, and says what that costs', () => {
    vi.useFakeTimers()
    const onAnswer = open(copyItem)
    fireEvent.click(screen.getByRole('button', { name: 'Show transcript' }))
    expect(screen.getByText('Alfa WUN TOO')).toBeTruthy()
    expect(screen.getByText(/this answer will be practice, not counted as listening/)).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Type what you heard'), { target: { value: 'A12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText('Correct, as practice')).toBeTruthy()
    expect(screen.getByText(/not counted as listening/)).toBeTruthy()
    // It is correct, but it is held for the learner to read rather than moving on by itself.
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(onAnswer).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onAnswer.mock.calls[0][0]).toMatchObject({ correct: true, assisted: true })
  })

  it('treats a recording that cannot be played as assisted, so a device with no audio is never stuck', async () => {
    vi.useFakeTimers()
    const onAnswer = open(copyItem)
    fireEvent(document.querySelector('audio')!, new Event('error'))
    expect(screen.getByRole('status', { name: '' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Show transcript' }))
    fireEvent.change(screen.getByLabelText('Type what you heard'), { target: { value: 'A12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText(/could not be played, so this is practice/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onAnswer.mock.calls[0][0]).toMatchObject({ correct: true, assisted: true })
  })

  it('does not change how an answer counts when the recording is replayed', () => {
    vi.useFakeTimers()
    const onAnswer = open(copyItem)
    const audio = document.querySelector('audio')!
    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /(Play|Replay) recording/ }))
      fireEvent(audio, new Event('playing'))
      fireEvent(audio, new Event('ended'))
    }
    fireEvent.change(screen.getByLabelText('Type what you heard'), { target: { value: 'A12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(onAnswer.mock.calls[0][0]).toMatchObject({ correct: true, assisted: false })
  })

  it('grades a choice item against its key', () => {
    vi.useFakeTimers()
    const onAnswer = open(choiceItem)
    for (const option of choiceItem.choice!.options) expect(screen.getByRole('button', { name: option })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Message received' }))
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(onAnswer.mock.calls[0][0]).toMatchObject({ correct: true, assisted: false, response: 'Message received' })
  })

  it('grades a choice miss and shows the key', () => {
    open(choiceItem)
    fireEvent.click(screen.getByRole('button', { name: 'Wait' }))
    expect(screen.getByText('Not that one')).toBeTruthy()
    expect(screen.getByText('Answer').parentElement?.textContent).toContain('Message received')
  })

  it('takes fields as separate labelled inputs and is right only if every one is', () => {
    vi.useFakeTimers()
    const onAnswer = open(fieldsItem)
    fireEvent.change(screen.getByLabelText('Position'), { target: { value: 'north of cape sable' } })
    fireEvent.change(screen.getByLabelText('Nature of distress'), { target: { value: 'taking on water.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(onAnswer.mock.calls[0][0]).toMatchObject({ correct: true, assisted: false })
  })

  it('names the wrong field in a fields miss', () => {
    open(fieldsItem)
    fireEvent.change(screen.getByLabelText('Position'), { target: { value: 'North of Cape Sable' } })
    fireEvent.change(screen.getByLabelText('Nature of distress'), { target: { value: 'fire' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText('Not that one')).toBeTruthy()
    const rows = Array.from(document.querySelectorAll('.test-correction-row')).map((row) => row.textContent)
    expect(rows[0]).toContain('Position')
    expect(rows[0]).toContain('North of Cape Sable')
    expect(rows[1]).toContain('Nature of distress')
    expect(rows[1]).toContain('fire → Taking on water')
  })

  it('grades one answer only, however many presses follow', () => {
    vi.useFakeTimers()
    const onAnswer = open(choiceItem)
    fireEvent.click(screen.getByRole('button', { name: 'Message received' }))
    fireEvent.click(screen.getByRole('button', { name: 'Wait' }))
    fireEvent.click(screen.getByRole('button', { name: 'Message received' }))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(onAnswer).toHaveBeenCalledTimes(1)
  })
})

describe('swapping to the next card', () => {
  /**
   * `rerender` flushes passive effects inside `act`, so a test that only looks
   * afterwards cannot see a stale first frame. This probe records what is in the
   * DOM at every commit, before any passive effect has had a chance to reset state.
   */
  function Probe({ item, cardKey, seen }: { item: Heard; cardKey: string; seen: boolean[] }) {
    useLayoutEffect(() => {
      seen.push(document.querySelector('.test-feedback') !== null)
    })
    return <AudioCard item={item} cardKey={cardKey} onAnswer={() => undefined} />
  }

  it('never shows the previous answer’s feedback under the next question, not even for one frame', () => {
    const seen: boolean[] = []
    const { rerender } = render(<Probe item={copyItem} cardKey="one" seen={seen} />)
    fireEvent.change(screen.getByLabelText('Type what you heard'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText('Not that one')).toBeTruthy()

    seen.length = 0
    rerender(<Probe item={choiceItem} cardKey="two" seen={seen} />)
    // The very first commit of the new card is already clean.
    expect(seen[0]).toBe(false)
    expect(screen.queryByText('Not that one')).toBeNull()
    expect(screen.queryByText('Alfa WUN TOO')).toBeNull() // and the old transcript is gone with it
    expect(screen.getByRole('button', { name: 'Show transcript' })).toBeTruthy()
  })

  it('starts the next card with the transcript concealed again', () => {
    const { rerender } = render(<AudioCard item={copyItem} cardKey="one" onAnswer={() => undefined} />)
    fireEvent.click(screen.getByRole('button', { name: 'Show transcript' }))
    expect(screen.getByText('Alfa WUN TOO')).toBeTruthy()
    rerender(<AudioCard item={choiceItem} cardKey="two" onAnswer={() => undefined} />)
    expect(screen.queryByText('Roger')).toBeNull()
    expect(screen.queryByText(/this answer will be practice/)).toBeNull()
  })
})
