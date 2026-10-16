// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LibraryProvider } from '../../../services/library/LibraryProvider'
import { newFluencyProgress, type MorseFluencyProgress } from '../../../domain/morse/fluency/progress'
import { SEND_STAGES, sendBestKey } from '../../../domain/morse/fluency/send'
import { FluencyHome } from './FluencyHome'
import { FluencySurface } from './FluencySurface'

const MORSE_ID = 'international-morse-letters-printed'

beforeEach(() => localStorage.clear())
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
    expect(screen.getByText('Hear it, write it')).toBeTruthy()
    expect(screen.queryByText('After the alphabet')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('opens Free Play without creating a scored run', () => {
    const onExit = vi.fn()
    render(
      <LibraryProvider>
        <FluencySurface topicId={MORSE_ID} initialFree onExit={onExit} />
      </LibraryProvider>,
    )
    expect(screen.getByRole('heading', { name: 'Free play' })).toBeTruthy()
    expect(screen.getByText(/Nothing here is saved/)).toBeTruthy()
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

describe('the sending recommendation once every stage is cleared', () => {
  it('points at the weakest stage rather than always Short messages', () => {
    const cleared: MorseFluencyProgress = {
      ...newFluencyProgress(),
      bests: Object.fromEntries(
        SEND_STAGES.map((stage) => [sendBestKey(stage), stage === 'flow' ? 91 : 100]),
      ),
    }
    const onSend = vi.fn()
    render(
      <LibraryProvider>
        <FluencyHome
          progress={cleared}
          onProgress={() => undefined}
          onStart={() => undefined}
          onCopy={() => undefined}
          onSend={onSend}
          onFreePlay={() => undefined}
          onExit={() => undefined}
        />
      </LibraryProvider>,
    )
    expect(screen.getByText('Recommended')).toBeTruthy()
    const lead = document.querySelector('.copy-next-tag')!.closest('button')!
    expect(lead.textContent).toContain('Word flow')
    fireEvent.click(lead)
    expect(onSend).toHaveBeenCalledWith('flow')
  })
})
