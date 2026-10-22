// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { COPY_LEVEL_INFO } from '../../../domain/morse/fluency/copy'
import { copyPrompts } from '../../../domain/morse/fluency/copy'
import { newFluencyProgress } from '../../../domain/morse/fluency/progress'
import { CopyRun } from './CopyRun'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function field(): HTMLInputElement {
  return screen.getByLabelText('What you heard') as HTMLInputElement
}

function renderLevel(level: Parameters<typeof CopyRun>[0]['level'], onProgress = vi.fn(), onLevel = vi.fn()) {
  render(
    <CopyRun
      level={level}
      rung={6}
      progress={newFluencyProgress()}
      onProgress={onProgress}
      onLevel={onLevel}
      onExit={() => undefined}
    />,
  )
  return { onProgress, onLevel }
}

describe('a copy run', () => {
  it('will not check an answer before the prompt has been played', () => {
    renderLevel('letters')
    fireEvent.change(field(), { target: { value: 'E' } })
    expect((screen.getByRole('button', { name: 'Check' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('allows one replay and no more', async () => {
    renderLevel('letters')
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Play once more|Playing/ })).toBeTruthy())
    const again = await screen.findByRole('button', { name: 'Play once more' })
    fireEvent.click(again)
    await waitFor(() => expect((screen.getByRole('button', { name: /Heard twice|Playing/ }) as HTMLButtonElement).disabled).toBe(true))
  })

  it('shows what was sent against what was written, then scores the run and saves a best', async () => {
    const { onProgress } = renderLevel('letters')
    const length = COPY_LEVEL_INFO.letters.length

    for (let prompt = 0; prompt < length; prompt += 1) {
      fireEvent.click(await screen.findByRole('button', { name: /^Play$|Play once more/ }))
      fireEvent.change(field(), { target: { value: '0' } })
      fireEvent.submit(field().closest('form')!)
      await waitFor(() => expect(screen.getByText(/You wrote/)).toBeTruthy())
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    }

    await waitFor(() => expect(screen.getByRole('heading', { name: '0 of 10 correct' })).toBeTruthy())
    expect(onProgress).toHaveBeenCalledTimes(1)
    expect(onProgress.mock.calls[0][0].bests['copy:letters']).toBe(0)
    // A first run is a baseline, not a personal best.
    expect(screen.queryByText('Personal best.')).toBeNull()
  })

  it('shows the first differing target letter only when a same-length copy keeps positions aligned', async () => {
    const seed = 0
    const target = copyPrompts('words', newFluencyProgress(), seed)[0]
    const expectedLetter = target[target.length - 1]
    const replacement = expectedLetter === 'Z' ? 'Y' : 'Z'
    const given = `${target.slice(0, -1)}${replacement}`

    renderLevel('words')
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    fireEvent.change(field(), { target: { value: given } })
    fireEvent.submit(field().closest('form')!)

    expect(await screen.findByText('You wrote', { exact: false })).toBeTruthy()
    expect(document.querySelector('.morse-character-support-glyph')?.textContent).toBe(expectedLetter)
  })

  it('omits a character cue when an insertion or deletion makes positions ambiguous', async () => {
    const seed = 0
    const target = copyPrompts('words', newFluencyProgress(), seed)[0]

    renderLevel('words')
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    fireEvent.change(field(), { target: { value: target.slice(1) } })
    fireEvent.submit(field().closest('form')!)

    expect(await screen.findByText('You wrote', { exact: false })).toBeTruthy()
    expect(document.querySelector('.morse-character-support')).toBeNull()
  })

  it('omits a character cue when multiple substitutions leave alignment ambiguous', async () => {
    const seed = 0
    const target = copyPrompts('words', newFluencyProgress(), seed)[0]
    const firstTwo = Array.from(target.slice(0, 2), (character) => character === 'Z' ? 'Y' : 'Z').join('')

    renderLevel('words')
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    fireEvent.change(field(), { target: { value: `${firstTwo}${target.slice(2)}` } })
    fireEvent.submit(field().closest('form')!)

    expect(await screen.findByText('You wrote', { exact: false })).toBeTruthy()
    expect(document.querySelector('.morse-character-support')).toBeNull()
  })

  it('introduces the figures before the numbers level asks for them', () => {
    renderLevel('numbers')
    expect(screen.getByRole('heading', { name: 'The ten figures' })).toBeTruthy()
    for (const figure of ['0', '1', '5', '9']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${figure}`) })).toBeTruthy()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Start copying' }))
    expect(field()).toBeTruthy()
  })

  it('introduces punctuation before the last level', () => {
    renderLevel('mixed')
    expect(screen.getByRole('heading', { name: 'Four marks of punctuation' })).toBeTruthy()
  })
})
