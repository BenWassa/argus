// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { Plate } from './Plate'

afterEach(cleanup)

describe('Plate', () => {
  it('renders a solid container with its variant class', () => {
    const { rerender } = render(<Plate data-testid="plate">Body</Plate>)
    expect(screen.getByTestId('plate').className).toBe('plate')
    expect(screen.getByTestId('plate').tagName).toBe('DIV')
    rerender(<Plate data-testid="plate" variant="raised" as="section" className="extra">Body</Plate>)
    expect(screen.getByTestId('plate').className).toBe('plate plate-raised extra')
    expect(screen.getByTestId('plate').tagName).toBe('SECTION')
    rerender(<Plate data-testid="plate" variant="repair">Body</Plate>)
    expect(screen.getByTestId('plate').className).toBe('plate plate-repair')
  })

  it('uses only solid tokens: no alpha, no gradient', () => {
    const css = readFileSync('src/shared/ui/Plate.css', 'utf8')
    expect(css).not.toMatch(/rgba?\(|hsla?\(|gradient|\/\s*\d+%|oklch\(/)
    expect(css).toMatch(/\.plate \{[^}]*border: 1px solid var\(--line\)[^}]*background: var\(--plate\)/)
    expect(css).toMatch(/\.plate-raised \{[^}]*background: var\(--plate-raised\)/)
    expect(css).toMatch(/\.plate-repair \{[^}]*border-color: var\(--warning\)/)
  })
})
