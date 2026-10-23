// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LibraryProvider } from '../../services/library/LibraryProvider'
import { seedLibrary } from '../../domain/library/catalogSeed'
import { freshSeedLibrary } from '../../infrastructure/persistence/libraryMigrations'
import type { CurrentLibrary } from '../../domain/library/library'
import type { Topic } from '../../domain/library/topic'
import { TestSession } from './TestSession'

/**
 * The production provider commits to IndexedDB before it publishes, so a Test's
 * final bank is a promise. These run the real provider over a repository whose
 * writes can be held and refused, and prove the result screen waits for it.
 */
const fixture = vi.hoisted(() => ({
  records: new Map<string, { owner: string; revision: number; library: CurrentLibrary }>(),
  /** Number of upcoming `update` calls (after arming) that are refused. */
  refuse: 0,
  gate: null as Promise<void> | null,
  armed: false,
}))
vi.mock('../../infrastructure/persistence/indexedLibraryRepository', () => ({
  openIndexedLibraryRepository: async () => ({
    read: async (owner: string) => fixture.records.get(owner) ?? null,
    initialize: async (owner: string, input: { seed: CurrentLibrary }) => {
      if (!fixture.records.has(owner)) fixture.records.set(owner, { owner, revision: 1, library: input.seed })
      return fixture.records.get(owner)!
    },
    update: async (owner: string, change: (library: CurrentLibrary) => CurrentLibrary) => {
      if (fixture.armed) {
        if (fixture.gate) await fixture.gate
        if (fixture.refuse > 0) { fixture.refuse -= 1; throw new Error('Quota exceeded') }
      }
      const before = fixture.records.get(owner)!
      const next = change(before.library)
      if (JSON.stringify(next) === JSON.stringify(before.library)) return before
      const record = { owner, revision: before.revision + 1, library: next }
      fixture.records.set(owner, record)
      return record
    },
    close: () => {},
  }),
}))

// A shortened stall threshold; the production value is STALLED_AFTER_MS.
vi.mock('../../services/library/useDurableWrites', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/library/useDurableWrites')>()
  return { ...actual, useDurableWrites: () => actual.useDurableWrites(500) }
})

vi.setConfig({ testTimeout: 20_000 })

const ownerKey = '__argus_unclaimed_local__'

function oneItemTopic(): Topic {
  const nato = seedLibrary().topics.find((topic) => topic.id === 'nato-phonetic') as Topic
  return {
    ...nato, id: 'user-one', title: 'One item', origin: 'user', status: 'learning',
    items: [nato.items[0]], sequence: undefined, history: [], itemEvidence: {},
    learningAt: new Date().toISOString(),
  } as Topic
}

function press(key: string) {
  act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })) })
}

function stored(): Topic {
  return fixture.records.get(ownerKey)!.library.topics.find((topic) => topic.id === 'user-one')!
}

beforeEach(() => {
  (globalThis as { __argusIndexedProviderTests?: boolean }).__argusIndexedProviderTests = true
  localStorage.clear()
  fixture.refuse = 0
  fixture.gate = null
  fixture.armed = false
  const library = freshSeedLibrary()
  fixture.records = new Map([[ownerKey, {
    owner: ownerKey, revision: 1, library: { ...library, topics: [...library.topics, oneItemTopic()] },
  }]])
})
afterEach(() => {
  cleanup();
  (globalThis as { __argusIndexedProviderTests?: boolean }).__argusIndexedProviderTests = false
})

async function openAndGradeLastCard() {
  render(<LibraryProvider><TestSession topicIds={['user-one']} onExit={() => undefined} /></LibraryProvider>)
  await waitFor(() => expect(document.querySelector('.flip-card')).not.toBeNull())
  fixture.armed = true
  press(' ')
  press('2')
}

describe('a Test result is announced only after the library has committed it', () => {
  it('shows a saving state, not the result, while the final write is in flight, then the result', async () => {
    let release!: () => void
    fixture.gate = new Promise<void>((resolve) => { release = resolve })
    await openAndGradeLastCard()
    await screen.findByText('Saving your result', {}, { timeout: 4000 })
    expect(document.querySelector('.test-done')).toBeNull()
    expect(stored().history).toHaveLength(0)
    release()
    await waitFor(() => expect(document.querySelector('.test-done')).not.toBeNull(), { timeout: 8000 })
    expect(stored().history).toHaveLength(1)
    expect(screen.queryByText('Saving your result')).toBeNull()
  })

  it('does not bank a refused result: it keeps it, says so, and saves it on retry', async () => {
    fixture.refuse = 1
    await openAndGradeLastCard()
    await screen.findByText('Result not saved', {}, { timeout: 8000 })
    expect(document.querySelector('.test-done')).toBeNull()
    expect(stored().history).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Try saving again' }))
    await waitFor(() => expect(document.querySelector('.test-done')).not.toBeNull(), { timeout: 8000 })
    expect(stored().history).toHaveLength(1)
    expect(screen.queryByText('Result not saved')).toBeNull()
  })

  it('keeps asking while the device keeps refusing, and never shows the result', async () => {
    fixture.refuse = 2
    await openAndGradeLastCard()
    await screen.findByText('Result not saved', {}, { timeout: 8000 })
    fireEvent.click(screen.getByRole('button', { name: 'Try saving again' }))
    await waitFor(() => expect(fixture.refuse).toBe(0))
    await screen.findByText('Result not saved')
    expect(document.querySelector('.test-done')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Try saving again' }))
    await waitFor(() => expect(document.querySelector('.test-done')).not.toBeNull(), { timeout: 8000 })
    expect(stored().history).toHaveLength(1)
  })

  describe('a save that never answers', () => {
    async function gradeThenStall(onExit = () => undefined) {
      render(<LibraryProvider><TestSession topicIds={['user-one']} onExit={onExit} /></LibraryProvider>)
      await waitFor(() => expect(document.querySelector('.flip-card')).not.toBeNull())
      fixture.armed = true
      press(' ')
      press('2')
      await screen.findByText('Saving your result', {}, { timeout: 4000 })
    }

    it('offers a way out instead of saving indefinitely, and never shows the result or a failure', async () => {
      fixture.gate = new Promise<void>(() => {})
      const onExit = vi.fn()
      await gradeThenStall(onExit)
      await screen.findByText('Still saving your result', {}, { timeout: 4000 })
      expect(screen.queryByText('Result not saved')).toBeNull()
      expect(document.querySelector('.test-done')).toBeNull()
      expect(stored().history).toHaveLength(0)
      fireEvent.click(screen.getByRole('button', { name: 'Back to today' }))
      expect(onExit).toHaveBeenCalledTimes(1)
    })

    it('shows the result once, banked once, if the held write commits after the way out appeared', async () => {
      let release!: () => void
      fixture.gate = new Promise<void>((resolve) => { release = resolve })
      await gradeThenStall()
      await screen.findByText('Still saving your result', {}, { timeout: 4000 })
      release()
      await waitFor(() => expect(document.querySelector('.test-done')).not.toBeNull(), { timeout: 8000 })
      expect(screen.queryByText('Still saving your result')).toBeNull()
      expect(stored().history).toHaveLength(1)
    })
  })
})
