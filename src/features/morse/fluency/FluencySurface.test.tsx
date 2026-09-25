// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LibraryProvider } from '../../../services/library/LibraryProvider'
import { seedLibrary } from '../../../domain/library/catalogSeed'
import { newFluencyProgress, recordFluencyAnswer } from '../../../domain/morse/fluency/progress'
import type { Topic } from '../../../domain/library/topic'
import { FluencyHome } from './FluencyHome'

const MORSE = (() => {
  const found = seedLibrary().topics.find((topic) => topic.morseReview !== undefined || topic.items.length === 26)
  return found as Topic | undefined
})()

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

function openHome(progress = undefined as Parameters<typeof FluencyHome>[0]['progress'], onProgress = vi.fn()) {
  render(
    <LibraryProvider>
      <FluencyHome
        progress={progress}
        onProgress={onProgress}
        onStart={() => undefined}
        onCopy={() => undefined}
        onFreePlay={() => undefined}
        onExit={() => undefined}
      />
    </LibraryProvider>,
  )
  return onProgress
}

describe('the fluency home screen', () => {
  it('offers every mode', () => {
    openHome()
    for (const title of ['Sprint', 'Ladder', 'Words', 'Groups']) {
      expect(screen.getByText(title)).toBeTruthy()
    }
  })

  /**
   * The single most important thing this surface must not do. A learner given
   * a character-speed control turns it down, and turning it down is how a
   * person trains themselves to count elements.
   */
  it('exposes the spacing and never the character speed', () => {
    openHome()
    expect(screen.getByText(/characters always at 20 WPM/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /slower characters/i })).toBeNull()
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('moves the rung through the one dial it does offer', () => {
    const onProgress = openHome(newFluencyProgress())
    fireEvent.click(screen.getByRole('button', { name: 'Less room between characters' }))
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ rung: 7 }))
  })

  it('clamps the dial at the bottom of the ladder', () => {
    openHome(newFluencyProgress())
    expect(
      screen.getByRole('button', { name: 'More room between characters' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('says nothing statistical until it has grounds to', () => {
    openHome()
    expect(screen.getByText(/Run a Sprint or two/)).toBeTruthy()
    expect(screen.queryByText('Where you are')).toBeNull()
  })

  it('reports recognition when long characters cost no more than short ones', () => {
    let progress = newFluencyProgress()
    for (let at = 0; at < 6; at += 1) {
      progress = recordFluencyAnswer(progress, 'E', true, 500)
      progress = recordFluencyAnswer(progress, 'Q', true, 520)
    }
    openHome(progress)
    expect(screen.getByText(/that is recognition/)).toBeTruthy()
  })

  it('says plainly when the learner is still counting', () => {
    let progress = newFluencyProgress()
    for (let at = 0; at < 6; at += 1) {
      progress = recordFluencyAnswer(progress, 'E', true, 400)
      progress = recordFluencyAnswer(progress, 'Q', true, 1600)
    }
    openHome(progress)
    expect(screen.getByText(/still counting them/)).toBeTruthy()
  })

  it('names the slowest characters rather than only scoring them', () => {
    let progress = newFluencyProgress()
    for (let at = 0; at < 6; at += 1) {
      progress = recordFluencyAnswer(progress, 'E', true, 300)
      progress = recordFluencyAnswer(progress, 'Q', true, 1800)
    }
    openHome(progress)
    expect(screen.getByText(/slowest right now/)).toBeTruthy()
  })

  it('never shows a completion, a status or a retention claim', () => {
    let progress = newFluencyProgress()
    for (let at = 0; at < 6; at += 1) progress = recordFluencyAnswer(progress, 'E', true, 400)
    openHome(progress)
    const text = document.body.textContent ?? ''
    for (const forbidden of ['Completed', 'Needs repair', 'Drilled', 'evidence']) {
      expect(text).not.toContain(forbidden)
    }
  })

  it('states that nothing here counts', () => {
    openHome()
    expect(screen.getByText(/none of it changes your progress or your completion/)).toBeTruthy()
  })
})

describe('the seeded Morse topic', () => {
  it('carries no fluency record until the learner makes one', () => {
    expect(MORSE?.morseFluency).toBeUndefined()
  })
})
