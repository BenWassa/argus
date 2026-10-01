// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LibraryProvider } from '../../services/library/LibraryProvider'
import { TestSession } from './TestSession'
import type { Topic } from '../../domain/library/topic'

const STORE_KEY = 'argus.library.v5'
const timestamp = '2026-01-01T00:00:00.000Z'

const ITEMS = [
  {
    id: 'l-1',
    kind: 'forward',
    prompt: 'Copy what you hear',
    answer: 'A12',
    audio: { assetId: 'l-1', src: '/media/audio/l-1.mp3', transcript: 'Alfa WUN TOO', drill: 'token-copy' },
    response: { mode: 'copy', normalizer: 'compact' },
  },
  {
    id: 'l-2',
    kind: 'forward',
    prompt: 'What does it mean?',
    answer: 'Message received',
    audio: { assetId: 'l-2', src: '/media/audio/l-2.mp3', transcript: 'Roger', drill: 'proword' },
    choice: { options: ['Message received', 'Repeat your message'] },
  },
]

function seedStore() {
  localStorage.setItem(
    STORE_KEY,
    JSON.stringify({
      version: 5,
      topics: [
        {
          id: 'listening-test',
          title: 'Listening test',
          scope: 'Two heard items.',
          track: 'learning',
          items: ITEMS,
          status: 'learning',
          createdAt: timestamp,
          drilledAt: null,
          learningAt: timestamp,
          completedAt: null,
          lastTestedAt: null,
          spotCheckedAt: null,
          history: [],
          itemEvidence: {},
          origin: 'user',
        },
      ],
    }),
  )
}

const stored = (): Topic =>
  (JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}').topics as Topic[]).find((t) => t.id === 'listening-test')!

function open(onPractice = vi.fn()) {
  render(
    <LibraryProvider>
      <TestSession topicIds={['listening-test']} onExit={() => undefined} onPractice={onPractice} />
    </LibraryProvider>,
  )
  return onPractice
}

const prompt = () => screen.getByRole('heading', { level: 1 }).textContent ?? ''

// The deck is shuffled, so each helper waits for the card on screen to change.
let lastPrompt = ''
async function onNewCard() {
  await waitFor(() => expect(prompt()).not.toBe(lastPrompt), { timeout: 4000 })
  lastPrompt = prompt()
}

/** Answer the card on screen. `assisted` reveals the transcript first. */
async function answer(correct: boolean, assisted = false) {
  await onNewCard()
  const isCopy = prompt() === 'Copy what you hear'
  if (assisted) fireEvent.click(screen.getByRole('button', { name: 'Show transcript' }))
  if (isCopy) {
    await waitFor(() => expect((screen.getByLabelText('Type what you heard') as HTMLInputElement).disabled).toBe(false))
    fireEvent.change(screen.getByLabelText('Type what you heard'), { target: { value: correct ? 'A12' : 'A13' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
  } else {
    const choice = correct ? 'Message received' : 'Repeat your message'
    await waitFor(() => expect((screen.getByRole('button', { name: choice }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: choice }))
  }
  const holdsForReading = !correct || assisted
  if (holdsForReading) {
    await waitFor(() => expect(screen.getByRole('button', { name: 'Continue' }).hasAttribute('disabled')).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  }
}

beforeEach(() => {
  localStorage.clear()
  lastPrompt = ''
  seedStore()
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation((() => Promise.resolve()) as never)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation((() => undefined) as never)
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('Test with listening items', () => {
  it('asks each heard item with a recording and no reveal or self-grade control', () => {
    open()
    expect(screen.getByText('Listen')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Play recording/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /reveal answer/i })).toBeNull()
    expect(document.querySelector('.flip-card')).toBeNull()
    expect(document.body.innerHTML).not.toContain('Alfa WUN TOO')
  })

  it('banks a clean unaided run to listening evidence only, leaving item evidence untouched', async () => {
    open()
    await answer(true)
    await answer(true)
    await waitFor(() => expect(stored().history.length).toBe(1), { timeout: 4000 })
    const topic = stored()
    expect(topic.history[0]).toMatchObject({ correct: 2, total: 2 })
    for (const id of ['l-1', 'l-2']) {
      expect(topic.audioEvidence?.[id]).toMatchObject({ attempts: 1, correct: 1, unassistedCorrect: 1, assistedAttempts: 0 })
    }
    // The listening claim is its own record: no text or choice evidence was written.
    expect(topic.itemEvidence).toEqual({})
  }, 20000)

  it('does not count a transcript-assisted answer toward the attempt, and records it as assisted', async () => {
    open()
    await answer(true)
    await answer(true, true) // correct, but the transcript was read first
    await waitFor(() => expect(stored().history.length).toBe(1), { timeout: 4000 })
    const topic = stored()
    expect(topic.history[0]).toMatchObject({ correct: 1, total: 2 })
    // The deck is shuffled, so check the pair rather than a particular item: one
    // was heard unaided, the other was correct but transcript-assisted.
    const records = ['l-1', 'l-2'].map((id) => topic.audioEvidence![id])
    expect(records.filter((r) => r.unassistedCorrect === 1 && r.assistedAttempts === 0)).toHaveLength(1)
    expect(records.filter((r) => r.correct === 1 && r.unassistedCorrect === 0 && r.assistedAttempts === 1)).toHaveLength(1)
    expect(topic.itemEvidence).toEqual({})
  }, 20000)

  it('counts a miss, records it, and offers practice on what was missed', async () => {
    const onPractice = open()
    await answer(false)
    await answer(true)
    await waitFor(() => expect(stored().history.length).toBe(1), { timeout: 4000 })
    const topic = stored()
    expect(topic.history[0]).toMatchObject({ correct: 1, total: 2 })
    const missed = Object.values(topic.audioEvidence ?? {}).filter((e) => e.correct === 0)
    expect(missed).toHaveLength(1)
    await waitFor(() => expect(screen.getByRole('button', { name: /Practi[sc]e 1 item/ })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: /Practi[sc]e 1 item/ }))
    expect(onPractice).toHaveBeenCalledTimes(1)
  }, 20000)

  it('keeps listening evidence when the learner leaves early, as acquisition state', async () => {
    open()
    await answer(true)
    await onNewCard() // the first answer has been handed over and the next card is up
    fireEvent.click(screen.getByRole('button', { name: 'End test' }))
    fireEvent.click(screen.getByRole('button', { name: 'End test' }))
    await waitFor(() => expect(Object.keys(stored().audioEvidence ?? {}).length).toBe(1))
    expect(stored().history).toEqual([]) // the partial attempt itself is discarded
    expect(stored().itemEvidence).toEqual({})
  }, 20000)
})
