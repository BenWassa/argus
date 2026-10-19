// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LibraryProvider } from '../../../services/library/LibraryProvider'
import { parseLibrary } from '../../../infrastructure/persistence/libraryParser'
import { seedLibrary } from '../../../domain/library/catalogSeed'
import { lessonPackets } from '../../../domain/morse/curriculum/lesson'
import { FluencySurface } from './FluencySurface'

const MORSE_ID = 'international-morse-letters-printed'

/** Stores the Morse topic with the first `lessons` lessons settled, or acquisition ready. */
function storeMorse(lessons: number | 'ready') {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const glyphs = new Set<string>(lessonPackets().slice(0, lessons === 'ready' ? 0 : lessons).flatMap((packet) => packet.characters))
  localStorage.setItem('argus.library.v5', JSON.stringify({
    ...parsed.library,
    topics: parsed.library.topics.map((topic) => topic.id !== MORSE_ID ? topic : lessons === 'ready'
      ? { ...topic, acquisitionReadyAt: '2026-01-01T00:00:00.000Z' }
      : { ...topic, lessonProgress: Object.fromEntries(topic.items.filter((item) => glyphs.has(item.prompt)).map((item) => [item.id!, 'settled'])) }),
  }))
}

beforeEach(() => { localStorage.clear(); storeMorse('ready') })
afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('a direct sending entry (#201)', () => {
  it('opens the named stage without the chooser, and exits to the Topic route', () => {
    const onExit = vi.fn()
    render(
      <LibraryProvider>
        <FluencySurface topicId={MORSE_ID} initialSend="words" onExit={onExit} />
      </LibraryProvider>,
    )
    expect(screen.getByText('Spotlight words')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/^Send [A-Z]+ in Morse\.$/)

    // A direct Topic launch returns to its Topic origin.
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Spotlight words')).toBeTruthy()
  })
})

describe('direct Topic-page Morse Play entries (#201)', () => {
  it('opens receiving at its recommended Copy level, skipping the hub', () => {
    const onExit = vi.fn()
    render(
      <LibraryProvider>
        <FluencySurface topicId={MORSE_ID} initialCopy="common" onExit={onExit} />
      </LibraryProvider>,
    )
    expect(screen.getByText('Copy', { selector: '.lesson-task' })).toBeTruthy()
    expect(screen.queryByText('After the alphabet')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('says in one line why a level cannot start yet, and sends only taught letters once it can (#257)', () => {
    localStorage.clear()
    storeMorse(0)
    const onExit = vi.fn()
    const { unmount } = render(
      <LibraryProvider>
        <FluencySurface topicId={MORSE_ID} initialSend="words" onExit={onExit} />
      </LibraryProvider>,
    )
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Learn a few more letters first')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onExit).toHaveBeenCalledTimes(1)
    unmount()

    storeMorse(5)
    render(
      <LibraryProvider>
        <FluencySurface topicId={MORSE_ID} initialSend="words" onExit={onExit} />
      </LibraryProvider>,
    )
    const taught = new Set<string>(lessonPackets().slice(0, 5).flatMap((packet) => packet.characters))
    const word = screen.getByRole('heading', { level: 1 }).textContent!.match(/^Send ([A-Z]+) in Morse\.$/)![1]
    expect([...word].every((letter) => taught.has(letter))).toBe(true)
  })

  it('opens Free Play without creating a scored run', () => {
    const onExit = vi.fn()
    render(
      <LibraryProvider>
        <FluencySurface topicId={MORSE_ID} initialFree onExit={onExit} />
      </LibraryProvider>,
    )
    expect(screen.getByText('Free play')).toBeTruthy()
    expect(screen.queryByText(/Nothing here is saved/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('opens a direct recognition run and exits to its Topic route', () => {
    const onExit = vi.fn()
    render(
      <LibraryProvider>
        <FluencySurface topicId={MORSE_ID} initialMode="sprint" onExit={onExit} />
      </LibraryProvider>,
    )
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
