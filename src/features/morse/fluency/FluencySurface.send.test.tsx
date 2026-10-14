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
  it('opens the named stage without the chooser, and leaves to the hub', () => {
    const onExit = vi.fn()
    render(
      <LibraryProvider>
        <FluencySurface topicId={MORSE_ID} initialSend="words" onExit={onExit} />
      </LibraryProvider>,
    )
    expect(screen.getByText('Spotlight words')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/^Send [A-Z]+ in Morse\.$/)

    // Leaving the run lands on the Play hub, not out of Morse entirely.
    fireEvent.click(screen.getByRole('button', { name: 'Fluency' }))
    expect(onExit).not.toHaveBeenCalled()
    expect(screen.getByText('Spotlight words')).toBeTruthy()
    expect(screen.getByText('Dispatch')).toBeTruthy()
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
