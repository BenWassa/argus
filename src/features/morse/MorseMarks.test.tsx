// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { MorseMarks, morseMarkKinds } from './MorseMarks'

afterEach(cleanup)

const css = readFileSync('src/features/morse/MorseMarks.css', 'utf8')

/** The declarations of the first rule whose selector is exactly `selector`. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`))
  if (!match) throw new Error(`no rule for ${selector}`)
  return match[1]
}

describe('MorseMarks', () => {
  it('reads dits and dahs from a raw pattern or from notation, and ignores spacing', () => {
    expect(morseMarkKinds('.-.')).toEqual(['dit', 'dah', 'dit'])
    expect(morseMarkKinds('· — ·')).toEqual(['dit', 'dah', 'dit'])
    expect(morseMarkKinds('−–')).toEqual(['dah', 'dah'])
    expect(morseMarkKinds('')).toEqual([])
  })

  it('draws one mark per element and keeps the notation as text for copying', () => {
    const { container } = render(<MorseMarks pattern=".-." size="stimulus" />)
    const marks = container.querySelector('.morse-marks')!
    expect(marks.className).toBe('morse-marks is-stimulus')
    expect(marks.getAttribute('aria-hidden')).toBe('true')
    expect([...marks.children].map((mark) => mark.className)).toEqual(['morse-mark is-dit', 'morse-mark is-dah', 'morse-mark is-dit'])
    expect(marks.textContent).toBe('·—·')
  })

  it('is one named image when given a label, and takes a unit override', () => {
    render(<MorseMarks pattern="." label="dit" unit="0.44em" />)
    const image = screen.getByRole('img', { name: 'dit' })
    expect(image.getAttribute('style')).toContain('--morse-unit: 0.44em')
  })

  it('gives dits and dahs one height on one centre line; only a dah is longer', () => {
    // The container centres its marks on the cross axis, so every mark shares
    // one centre line; a font baseline plays no part (line-height 0, glyph 0).
    expect(rule('.morse-marks')).toMatch(/display: inline-flex;/)
    expect(rule('.morse-marks')).toMatch(/align-items: center;/)
    expect(rule('.morse-marks')).toMatch(/line-height: 0;/)
    expect(rule('.morse-marks')).toMatch(/gap: var\(--morse-unit\);/)
    const mark = rule('.morse-mark')
    expect(mark).toMatch(/block-size: var\(--morse-unit\);/)
    expect(mark).toMatch(/inline-size: var\(--morse-unit\);/)
    expect(mark).toMatch(/border-radius: var\(--r-pill\);/)
    expect(mark).toMatch(/font-size: 0;/)
    // A dah overrides the width alone: three units long, the same height.
    const dah = rule('.morse-mark.is-dah')
    expect(dah).toMatch(/inline-size: calc\(3 \* var\(--morse-unit\)\);/)
    expect(dah).not.toMatch(/block-size|height|margin|vertical-align|transform/)
    expect(css).not.toMatch(/\.is-dit \{/)
  })
})
