// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SendRun } from './SendRun'
import { newFluencyProgress } from '../../../domain/morse/fluency/progress'

afterEach(cleanup)

function renderRun(stage: 'flow' | 'phrases') {
  return render(
    <SendRun stage={stage} seed={7} progress={newFluencyProgress()}
      onProgress={vi.fn()} onStage={vi.fn()} onExit={vi.fn()} />,
  )
}

describe('ending a sent word early (#314)', () => {
  it('offers Finish alone in Word flow, with no word-gap button, disabled until something is keyed', () => {
    renderRun('flow')
    const finish = screen.getByRole('button', { name: 'Finish' }) as HTMLButtonElement
    expect(finish.disabled).toBe(true)
    expect(screen.queryByRole('button', { name: 'Space' })).toBeNull()
  })

  it('keeps Space and Finish together in the multi-word stages', () => {
    renderRun('phrases')
    expect(screen.getByRole('button', { name: 'Space' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Finish' })).toBeTruthy()
  })

  it('reviews a word with a dropped letter as a miss instead of waiting for more letters', async () => {
    renderRun('flow')
    fireEvent.keyDown(window, { key: '.' })
    await act(async () => { await Promise.resolve() })
    const finish = screen.getByRole('button', { name: 'Finish' }) as HTMLButtonElement
    expect(finish.disabled).toBe(false)
    fireEvent.click(finish)
    expect(screen.queryByRole('button', { name: 'Finish' })).toBeNull()
    expect(screen.getByRole('button', { name: /Next|Finish round/ })).toBeTruthy()
    expect(screen.queryByText('Received as sent')).toBeNull()
  })
})
