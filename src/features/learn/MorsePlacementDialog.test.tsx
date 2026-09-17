// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { catalogDefinition, freshCatalogTopic } from '../../lib/catalog'
import { MorsePlacementDialog } from './MorsePlacementDialog'

const MORSE_ID = 'international-morse-letters-printed'

function freshMorse() {
  const definition = catalogDefinition(MORSE_ID)
  if (!definition) throw new Error('Missing shipped Morse topic.')
  return freshCatalogTopic(definition, new Date('2026-09-17T22:00:00.000Z'))
}

afterEach(() => cleanup())

describe('Morse placement response boundary', () => {
  it('collects an uncued pattern and makes the learner decide when it is complete', () => {
    render(
      <MorsePlacementDialog
        topic={freshMorse()}
        onClose={vi.fn()}
        onNew={vi.fn()}
        onCommit={vi.fn()}
        onContinue={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Know some Morse/i }))

    expect(screen.getByRole('dialog', { name: 'Morse placement check' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Morse key/i })).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Check pattern' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('Key the full pattern, then check it. Up to four signals.')).toBeTruthy()
    expect(screen.queryByText(/Expected pattern length/i)).toBeNull()
  })

  it('never passes the target pattern length into the shared Morse key', () => {
    const code = readFileSync(
      fileURLToPath(new URL('./MorsePlacementDialog.tsx', import.meta.url)),
      'utf8',
    )
    expect(code).toContain('expectedLength={1}')
    expect(code).not.toContain('expectedLength={expectedMorsePlacementPattern(target).length}')
    expect(code).not.toContain('Expected pattern length')
  })
})
