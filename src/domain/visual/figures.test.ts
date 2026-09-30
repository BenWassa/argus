import { describe, expect, it } from 'vitest'
import { angleDialGeometry, dialPoint, FIGURE_KIND_NAMES, parseFigure } from './figures'
import type { AngleDialFigure } from './figures'

describe('parseFigure', () => {
  it('accepts a well-formed angle dial and keeps only what the kind defines', () => {
    const parsed = parseFigure(
      { kind: 'angle-dial', pointers: [{ bearing: 45, label: ' A ', extra: 'dropped' }], script: 'x' },
      'Topic',
    )
    expect(parsed).toEqual({
      ok: true,
      figure: { kind: 'angle-dial', pointers: [{ bearing: 45, label: 'A' }] },
    })
  })

  it.each([
    ['an unknown kind', { kind: 'compass-component', pointers: [] }],
    ['no kind', { pointers: [{ bearing: 1 }] }],
    ['a non-object', 'angle-dial'],
    ['no pointers', { kind: 'angle-dial', pointers: [] }],
    ['too many pointers', { kind: 'angle-dial', pointers: Array.from({ length: 5 }, () => ({ bearing: 1 })) }],
    ['a fractional bearing', { kind: 'angle-dial', pointers: [{ bearing: 10.5 }] }],
    ['a bearing of 360', { kind: 'angle-dial', pointers: [{ bearing: 360 }] }],
    ['a negative bearing', { kind: 'angle-dial', pointers: [{ bearing: -1 }] }],
    ['a non-numeric bearing', { kind: 'angle-dial', pointers: [{ bearing: '90' }] }],
    ['an over-long label', { kind: 'angle-dial', pointers: [{ bearing: 1, label: 'x'.repeat(13) }] }],
    ['a blank label', { kind: 'angle-dial', pointers: [{ bearing: 1, label: '  ' }] }],
  ])('rejects %s', (_name, value) => {
    expect(parseFigure(value, 'Topic').ok).toBe(false)
  })

  it('names the supported kinds when it rejects an unknown one', () => {
    const parsed = parseFigure({ kind: 'nope' }, 'Topic')
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) for (const kind of FIGURE_KIND_NAMES) expect(parsed.error).toContain(kind)
  })
})

describe('angle dial geometry', () => {
  it('puts north up and bearings clockwise', () => {
    expect(dialPoint(0, 10)).toEqual({ x: 100, y: 90 })
    expect(dialPoint(90, 10)).toEqual({ x: 110, y: 100 })
    expect(dialPoint(180, 10)).toEqual({ x: 100, y: 110 })
    expect(dialPoint(270, 10)).toEqual({ x: 90, y: 100 })
  })

  it('is deterministic and derived only from the spec', () => {
    const figure: AngleDialFigure = {
      kind: 'angle-dial',
      pointers: [{ bearing: 135, label: 'A' }, { bearing: 315 }],
    }
    expect(angleDialGeometry(figure)).toEqual(angleDialGeometry(structuredClone(figure)))
    const { pointers } = angleDialGeometry(figure)
    expect(pointers.map((p) => p.bearing)).toEqual([135, 315])
    // Reciprocal pointers are exactly opposite through the centre.
    expect(pointers[0].tip.x + pointers[1].tip.x).toBeCloseTo(200, 1)
    expect(pointers[0].tip.y + pointers[1].tip.y).toBeCloseTo(200, 1)
    expect(pointers[1].label).toBeUndefined()
  })

  it('draws four cardinal marks', () => {
    const { cardinals } = angleDialGeometry({ kind: 'angle-dial', pointers: [{ bearing: 0 }] })
    expect(cardinals.map((c) => c.label)).toEqual(['N', 'E', 'S', 'W'])
  })
})

describe('pointer labels', () => {
  it('sit inside the ring and clear of the cardinal marks, even on a cardinal bearing', () => {
    for (const bearing of [0, 90, 180, 270, 45]) {
      const geometry = angleDialGeometry({ kind: 'angle-dial', pointers: [{ bearing, label: 'A' }] })
      const { labelAt } = geometry.pointers[0]
      const distance = Math.hypot(labelAt.x - geometry.centre.x, labelAt.y - geometry.centre.y)
      expect(distance).toBeLessThan(geometry.ringRadius)
      for (const cardinal of geometry.cardinals) {
        expect(Math.hypot(labelAt.x - cardinal.x, labelAt.y - cardinal.y)).toBeGreaterThan(20)
      }
    }
  })
})
