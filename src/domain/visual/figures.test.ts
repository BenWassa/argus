import { describe, expect, it } from 'vitest'
import { angleDialGeometry, dialPoint, FIGURE_KIND_NAMES, northReferenceGeometry, parseFigure } from './figures'
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

  it('turn away from each other when two labelled pointers are close, and stay inside the ring', () => {
    const geometry = angleDialGeometry({
      kind: 'angle-dial',
      pointers: [{ bearing: 5, label: '005°' }, { bearing: 355, label: '355°' }],
    })
    const [east, west] = geometry.pointers.map((pointer) => pointer.labelAt)
    // 005° labels to the right of north, 355° to the left: wide enough apart
    // that two four-character labels cannot overlap.
    expect(east.x).toBeGreaterThan(geometry.centre.x)
    expect(west.x).toBeLessThan(geometry.centre.x)
    expect(east.x - west.x).toBeGreaterThan(30)
    for (const { x, y } of [east, west]) {
      expect(Math.hypot(x - geometry.centre.x, y - geometry.centre.y)).toBeLessThan(geometry.ringRadius)
    }
  })
})

describe('angle-dial options (#149)', () => {
  it('accepts a reference, quadrant guides and an arc, and labels north by reference', () => {
    const parsed = parseFigure(
      { kind: 'angle-dial', reference: 'M', quadrantGuides: true, arc: true, pointers: [{ bearing: 120 }] },
      'x',
    )
    expect(parsed.ok).toBe(true)
    if (!parsed.ok || parsed.figure.kind !== 'angle-dial') return
    const geometry = angleDialGeometry(parsed.figure)
    expect(geometry.cardinals[0].label).toBe('MN')
    expect(geometry.guides).toHaveLength(2)
    expect(geometry.arcPath).toMatch(/^M 100 \d+(\.\d+)? A 26 26 0 0 1 /)
  })

  it('draws no guides or arc unless asked, and keeps plain N', () => {
    const geometry = angleDialGeometry({ kind: 'angle-dial', pointers: [{ bearing: 30 }] })
    expect(geometry.guides).toEqual([])
    expect(geometry.arcPath).toBeNull()
    expect(geometry.cardinals[0].label).toBe('N')
  })

  it('uses the large-arc flag beyond 180° and draws no arc for a north pointer', () => {
    const big = angleDialGeometry({ kind: 'angle-dial', arc: true, pointers: [{ bearing: 250 }] })
    expect(big.arcPath).toContain(' 0 1 1 ')
    expect(angleDialGeometry({ kind: 'angle-dial', arc: true, pointers: [{ bearing: 0 }] }).arcPath).toBeNull()
  })

  it.each([
    ['an unknown reference', { kind: 'angle-dial', reference: 'X', pointers: [{ bearing: 1 }] }],
    ['a non-boolean flag', { kind: 'angle-dial', arc: 'yes', pointers: [{ bearing: 1 }] }],
  ])('rejects %s', (_name, value) => {
    expect(parseFigure(value, 'x').ok).toBe(false)
  })
})

describe('north-reference figure (#149)', () => {
  const valid = {
    kind: 'north-reference',
    rays: [{ ref: 'T', angle: 0 }, { ref: 'M', angle: 14 }, { ref: 'G', angle: -12, label: 'GN 2°W' }],
  }

  it('accepts a three-north schematic and keeps only what the kind defines', () => {
    const parsed = parseFigure({ ...valid, extra: 1 }, 'x')
    expect(parsed).toEqual({ ok: true, figure: valid })
  })

  it.each([
    ['one ray only', { kind: 'north-reference', rays: [{ ref: 'T', angle: 0 }] }],
    ['no upright ray', { kind: 'north-reference', rays: [{ ref: 'T', angle: 10 }, { ref: 'M', angle: -10 }] }],
    ['two upright rays', { kind: 'north-reference', rays: [{ ref: 'T', angle: 0 }, { ref: 'M', angle: 0 }] }],
    ['a repeated north', { kind: 'north-reference', rays: [{ ref: 'T', angle: 0 }, { ref: 'T', angle: 20 }] }],
    ['rays too close together', { kind: 'north-reference', rays: [{ ref: 'T', angle: 0 }, { ref: 'M', angle: 5 }] }],
    ['an angle beyond the frame', { kind: 'north-reference', rays: [{ ref: 'T', angle: 0 }, { ref: 'M', angle: 60 }] }],
    ['a fractional angle', { kind: 'north-reference', rays: [{ ref: 'T', angle: 0 }, { ref: 'M', angle: 10.5 }] }],
    ['an unknown north', { kind: 'north-reference', rays: [{ ref: 'T', angle: 0 }, { ref: 'Q', angle: 10 }] }],
  ])('rejects %s', (_name, value) => {
    expect(parseFigure(value, 'x').ok).toBe(false)
  })

  it('draws the upright ray straight up and east clockwise of it', () => {
    const parsed = parseFigure(valid, 'x')
    if (!parsed.ok || parsed.figure.kind !== 'north-reference') throw new Error('unparsed')
    const { vertex, rays } = northReferenceGeometry(parsed.figure)
    const [upright, east, west] = rays
    expect(upright.tip.x).toBe(vertex.x)
    expect(upright.tip.y).toBeLessThan(vertex.y)
    expect(east.tip.x).toBeGreaterThan(vertex.x)
    expect(west.tip.x).toBeLessThan(vertex.x)
    expect(upright.label).toBe('TN')
    expect(west.label).toBe('GN 2°W')
  })
})
