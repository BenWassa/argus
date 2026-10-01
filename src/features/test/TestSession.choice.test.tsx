// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LibraryProvider } from '../../services/library/LibraryProvider'
import { TestSession } from './TestSession'
import type { Topic } from '../../domain/library/topic'

const STORE_KEY = 'argus.library.v5'
const timestamp = '2026-01-01T00:00:00.000Z'

const dial = (bearing: number) => ({
  source: { kind: 'figure', figure: { kind: 'angle-dial', pointers: [{ bearing }] } },
  alt: `A dial with a pointer at ${bearing} degrees.`,
})

const ITEMS = [
  { id: 'v-1', kind: 'forward', prompt: 'Which cardinal?', answer: 'East', choice: { options: ['North', 'East'] }, stimulus: dial(90) },
  { id: 'v-2', kind: 'forward', prompt: 'Reciprocal of 045°?', answer: '225°', choice: { options: ['135°', '225°', '315°'] } },
  { id: 'v-3', kind: 'forward', prompt: 'Which cardinal?', answer: 'South', choice: { options: ['South', 'West'] }, stimulus: dial(180) },
]

function seedStore() {
  localStorage.setItem(
    STORE_KEY,
    JSON.stringify({
      version: 5,
      topics: [
        {
          id: 'visual-test',
          title: 'Visual test',
          scope: 'Three choices.',
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

function stored(): Topic {
  const topics = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}').topics as Topic[]
  return topics.find((topic) => topic.id === 'visual-test')!
}

function open() {
  return render(
    <LibraryProvider>
      <TestSession topicIds={['visual-test']} onExit={() => undefined} onPractice={() => undefined} />
    </LibraryProvider>,
  )
}

function answerKeyFor(prompt: string, alt: string | null): string {
  const item = ITEMS.find((candidate) => candidate.prompt === prompt && (alt === null || candidate.stimulus?.alt === alt))!
  return item.answer
}

/** Answer the card on screen, then move past it. */
async function answerCurrent(correct: boolean) {
  const prompt = screen.getByRole('heading', { level: 1 }).textContent ?? ''
  const alt = document.querySelector('[role="img"]')?.getAttribute('aria-label') ?? null
  const key = answerKeyFor(prompt, alt)
  const item = ITEMS.find((candidate) => candidate.prompt === prompt && (alt === null || candidate.stimulus?.alt === alt))!
  const choice = correct ? key : item.choice.options.find((option) => option !== key)!
  // The options are gated through the brief transition between questions.
  await waitFor(() =>
    expect((screen.getByRole('button', { name: choice }) as HTMLButtonElement).disabled).toBe(false),
  )
  fireEvent.click(screen.getByRole('button', { name: choice }))
  if (!correct) await waitFor(() => expect(screen.getByRole('button', { name: 'Continue' }).hasAttribute('disabled')).toBe(false))
  if (!correct) fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
}

beforeEach(() => {
  localStorage.clear()
  seedStore()
})
afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('Test with visual-choice items', () => {
  it('asks each item as an objective choice with no reveal or self-grade control', () => {
    open()
    expect(screen.queryByRole('button', { name: /reveal/i })).toBeNull()
    expect(screen.getByText('Choose one')).toBeTruthy()
    expect(document.querySelector('.flip-card')).toBeNull()
  })

  it('never puts the answer of an unanswered card into an attribute or label other than its own option', () => {
    open()
    const prompt = screen.getByRole('heading', { level: 1 }).textContent!
    // Options are present by design; the answer must not be marked or labelled.
    expect(document.querySelectorAll('.is-answer, [data-answer]')).toHaveLength(0)
    expect(prompt).toBeTruthy()
  })

  it('banks a clean run and records per-item evidence as assisted recognition', async () => {
    open()
    for (let i = 0; i < ITEMS.length; i += 1) {
      await answerCurrent(true)
      if (i < ITEMS.length - 1) await waitFor(() => expect(document.querySelector('.test-verdict')).toBeNull(), { timeout: 4000 })
    }
    await waitFor(() => expect(stored().history.length).toBe(1), { timeout: 4000 })
    const topic = stored()
    expect(topic.history[0]).toMatchObject({ correct: 3, total: 3 })
    for (const item of ITEMS) {
      const direction = topic.itemEvidence?.[item.id]?.directions['prompt-to-answer']
      expect(direction).toMatchObject({ attempts: 1, correct: 1, unassistedCorrect: 0 })
    }
  }, 20000)

  it('counts a miss against the attempt and offers practice on what was missed', async () => {
    open()
    await answerCurrent(false)
    await waitFor(() => expect(document.querySelector('.test-verdict')).toBeNull(), { timeout: 4000 })
    await answerCurrent(true)
    await waitFor(() => expect(document.querySelector('.test-verdict')).toBeNull(), { timeout: 4000 })
    await answerCurrent(true)
    await waitFor(() => expect(stored().history.length).toBe(1), { timeout: 4000 })
    expect(stored().history[0]).toMatchObject({ correct: 2, total: 3 })
    await waitFor(() => expect(screen.getByRole('button', { name: /practi[sc]e/i })).toBeTruthy())
  }, 20000)
})
