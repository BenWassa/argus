// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FLUENCY_RUNGS } from '../../../domain/morse/fluency/timing'
import { ListeningSpacing } from './ListeningSpacing'

describe('Listen session spacing', () => {
  it('steps the room between characters and stops at either end', () => {
    const onChange = vi.fn()
    const { rerender } = render(<ListeningSpacing rung={12} onChange={onChange} />)
    expect(screen.getByText('Spacing 12 WPM')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'More room between characters' }))
    expect(onChange).toHaveBeenLastCalledWith(11)
    fireEvent.click(screen.getByRole('button', { name: 'Less room between characters' }))
    expect(onChange).toHaveBeenLastCalledWith(13)
    rerender(<ListeningSpacing rung={FLUENCY_RUNGS[0]} onChange={onChange} />)
    expect((screen.getByRole('button', { name: 'More room between characters' }) as HTMLButtonElement).disabled).toBe(true)
    rerender(<ListeningSpacing rung={FLUENCY_RUNGS[FLUENCY_RUNGS.length - 1]} onChange={onChange} />)
    expect((screen.getByRole('button', { name: 'Less room between characters' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
