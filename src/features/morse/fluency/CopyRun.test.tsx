// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { COPY_LEVEL_INFO } from '../../../domain/morse/fluency/copy'
import { newFluencyProgress } from '../../../domain/morse/fluency/progress'
import { CopyRun } from './CopyRun'

afterEach(cleanup)

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

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Letters done' })).toBeTruthy())
    expect(screen.getByText(/0 of 10 exactly right/)).toBeTruthy()
    expect(onProgress).toHaveBeenCalledTimes(1)
    expect(onProgress.mock.calls[0][0].bests['copy:letters']).toBe(0)
    // A first run is a baseline, not a personal best.
    expect(screen.queryByText('Personal best.')).toBeNull()
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
