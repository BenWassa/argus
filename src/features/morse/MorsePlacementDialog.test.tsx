// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { catalogDefinition, freshCatalogTopic } from '../../domain/library/catalog'
import { MorsePlacementDialog } from './MorsePlacementDialog'

const MORSE_ID = 'international-morse-letters-printed'

function freshMorse() {
  const definition = catalogDefinition(MORSE_ID)
  if (!definition) throw new Error('Missing shipped Morse topic.')
  return freshCatalogTopic(definition, new Date('2026-09-17T22:00:00.000Z'))
}

afterEach(() => cleanup())

describe('Morse placement response boundary', () => {
  it('accepts an uncued pattern directly and grades it at the known pattern boundary', () => {
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
    expect(screen.queryByRole('button', { name: 'Check pattern' })).toBeNull()
    expect(screen.queryByText(/Key the full pattern, then check/i)).toBeNull()
    expect(screen.queryByText(/Expected pattern length/i)).toBeNull()
  })

  it('uses the shared key’s automatic completion instead of a placement-only confirmation', () => {
    const code = readFileSync('src/features/morse/MorsePlacementDialog.tsx', 'utf8')
    expect(code).toContain('expectedLength={expectedMorsePlacementPattern(target).length}')
    expect(code).toContain("import { MorseWordKeyInput } from './input/MorseWordKeyInput'")
    expect(code).not.toContain('Check pattern')
    expect(code).not.toContain('Expected pattern length')
  })
})
