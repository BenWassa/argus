import { describe, expect, it } from 'vitest'
import {
  SHAPE_DIAMETER,
  SHAPE_GAP,
  dayShapeStackGeometry,
  lightStackGeometry,
  vesselPlanGeometry,
} from './geometry'
import { LIGHT_SECTORS, SCORED_ASPECTS, isVisible } from './lights'
import { parseFigure } from '../visual/figures'

const parsed = (value: unknown) => {
  const result = parseFigure(value, 'x')
  if (!result.ok) throw new Error(result.error)
  return result.figure
}

describe('vessel plan geometry', () => {
  it('puts port to the left and starboard to the right of the centreline, bow up', () => {
    const plan = vesselPlanGeometry({
      kind: 'vessel-plan',
      lights: ['masthead', 'port-sidelight', 'starboard-sidelight', 'sternlight'],
    })
    const at = (id: string) => plan.lights.find((l) => l.id === id)!
    expect(at('starboard-sidelight').colour).toBe('green')
    expect(at('port-sidelight').colour).toBe('red')
    expect(at('starboard-sidelight').x).toBeGreaterThan(100)
    expect(at('port-sidelight').x).toBeLessThan(100)
    expect(at('masthead').x).toBe(100)
    expect(at('sternlight').x).toBe(100)
    // Masthead forward of the stern, sidelights forward of the stern.
    expect(at('masthead').y).toBeLessThan(at('sternlight').y)
    expect(at('starboard-sidelight').y).toBeLessThan(at('sternlight').y)
  })

  it('draws only the lights asked for', () => {
    const sailing = vesselPlanGeometry({ kind: 'vessel-plan', lights: ['port-sidelight', 'starboard-sidelight', 'sternlight'] })
    expect(sailing.lights.map((l) => l.id)).toEqual(['port-sidelight', 'starboard-sidelight', 'sternlight'])
    expect(vesselPlanGeometry({ kind: 'vessel-plan' }).lights).toEqual([])
  })

  it('places an observer clockwise from the bow and inside the frame at every scored aspect', () => {
    for (const bearing of SCORED_ASPECTS) {
      const { observer } = vesselPlanGeometry({ kind: 'vessel-plan', observer: bearing })
      expect(observer).not.toBeNull()
      const { x, y } = observer!.at
      expect(x).toBeGreaterThan(10)
      expect(x).toBeLessThan(190)
      expect(y).toBeGreaterThan(10)
      expect(y).toBeLessThan(190)
    }
    const at = (b: number) => vesselPlanGeometry({ kind: 'vessel-plan', observer: b }).observer!.at
    expect(at(0).x).toBe(100)
    expect(at(0).y).toBeLessThan(100) // dead ahead is above the vessel
    expect(at(90).x).toBeGreaterThan(100) // starboard beam is to the right
    expect(at(180).y).toBeGreaterThan(100) // dead astern is below
    expect(at(270).x).toBeLessThan(100) // port beam is to the left
    expect(at(45).x).toBeGreaterThan(100)
    expect(at(45).y).toBeLessThan(100) // starboard bow: upper right
    expect(at(315).x).toBeLessThan(100)
    expect(at(315).y).toBeLessThan(100) // port bow: upper left
  })

  it('draws four sector arcs from the rule data only when asked', () => {
    expect(vesselPlanGeometry({ kind: 'vessel-plan' }).sectors).toEqual([])
    const plan = vesselPlanGeometry({ kind: 'vessel-plan', sectors: true })
    expect(plan.sectors.map((s) => s.id)).toEqual(['masthead', 'starboard-sidelight', 'port-sidelight', 'sternlight'])
    expect(plan.sectors.map((s) => s.colour)).toEqual(['white', 'green', 'red', 'white'])
    // The masthead arc is 225°, so it is a large arc; the others are not.
    expect(plan.sectors[0].path).toMatch(/A \d+ \d+ 0 1 1 /)
    for (const sector of plan.sectors.slice(1)) expect(sector.path).toMatch(/A \d+ \d+ 0 0 1 /)
  })

  it('labels bow, stern, port and starboard only when asked', () => {
    expect(vesselPlanGeometry({ kind: 'vessel-plan' }).labels).toEqual([])
    const labels = vesselPlanGeometry({ kind: 'vessel-plan', labels: true }).labels
    expect(labels.map((l) => l.text)).toEqual(['BOW', 'STERN', 'PORT', 'STBD'])
    expect(labels.find((l) => l.text === 'PORT')!.x).toBeLessThan(100)
    expect(labels.find((l) => l.text === 'STBD')!.x).toBeGreaterThan(100)
    expect(labels.find((l) => l.text === 'BOW')!.y).toBeLessThan(labels.find((l) => l.text === 'STERN')!.y)
  })
})

describe('light stack geometry', () => {
  it('keeps the order it is given, top first, evenly spaced and centred', () => {
    const lights = lightStackGeometry({ kind: 'light-stack', lights: ['red', 'white', 'red'] })
    expect(lights.map((l) => l.colour)).toEqual(['red', 'white', 'red'])
    expect(lights[0].cy).toBeLessThan(lights[1].cy)
    expect(lights[1].cy).toBeLessThan(lights[2].cy)
    expect(lights[1].cy - lights[0].cy).toBe(lights[2].cy - lights[1].cy)
    expect(lights.every((l) => l.cx === 100)).toBe(true)
    expect((lights[0].cy + lights[2].cy) / 2).toBe(100)
  })

  it('is not symmetric by accident: green-over-white is not white-over-green', () => {
    expect(lightStackGeometry({ kind: 'light-stack', lights: ['green', 'white'] }).map((l) => l.colour)).toEqual(['green', 'white'])
    expect(lightStackGeometry({ kind: 'light-stack', lights: ['white', 'green'] }).map((l) => l.colour)).toEqual(['white', 'green'])
  })
})

describe('day shape geometry (Annex I proportions)', () => {
  const D = SHAPE_DIAMETER
  const stack = (shapes: string[]) => dayShapeStackGeometry(parsed({ kind: 'day-shape-stack', shapes }) as never)

  it('draws ball–diamond–ball in exactly that order, never diamond–ball–diamond', () => {
    expect(stack(['ball', 'diamond', 'ball']).map((s) => s.kind)).toEqual(['ball', 'diamond', 'ball'])
    expect(stack(['diamond', 'ball', 'diamond']).map((s) => s.kind)).toEqual(['diamond', 'ball', 'diamond'])
  })

  it('has a ball of diameter D, a cone of base D and height D, and a diamond of two cones on a common base', () => {
    const [ball] = stack(['ball'])
    expect(ball.kind === 'ball' && ball.r * 2).toBe(D)
    expect(ball.height).toBe(D)

    const [cone] = stack(['cone-apex-up'])
    expect(cone.height).toBe(D)
    const [diamond] = stack(['diamond'])
    expect(diamond.height).toBe(2 * D)
    // Diamond points: top, right-middle, bottom, left-middle; the middle width is the cone base D.
    const pts = (diamond as { points: string }).points.split(' ').map((p) => p.split(',').map(Number))
    expect(pts[1][0] - pts[3][0]).toBe(D)
    expect(pts[2][1] - pts[0][1]).toBe(2 * D)
    expect(pts[1][1] - pts[0][1]).toBe(D) // upper cone height equals its base
  })

  it('keeps cone orientation explicit: apex up has its point on top, apex down its point below', () => {
    const up = (stack(['cone-apex-up'])[0] as { points: string }).points.split(' ').map((p) => p.split(',').map(Number))
    expect(up[0][1]).toBeLessThan(up[1][1]) // apex above the base
    expect(up[1][1]).toBe(up[2][1])
    const down = (stack(['cone-apex-down'])[0] as { points: string }).points.split(' ').map((p) => p.split(',').map(Number))
    expect(down[2][1]).toBeGreaterThan(down[0][1]) // apex below the base
    expect(down[0][1]).toBe(down[1][1])
  })

  it('draws two cones with their apexes together: apex down above apex up, points facing', () => {
    const [top, bottom] = stack(['cone-apex-down', 'cone-apex-up']) as { kind: string; points: string; top: number; height: number }[]
    const apexOfTop = Number(top.points.split(' ')[2].split(',')[1])
    const apexOfBottom = Number(bottom.points.split(' ')[0].split(',')[1])
    expect(apexOfBottom - apexOfTop).toBe(SHAPE_GAP)
  })

  it('never overlaps, stays centred and fits the frame for the tallest stack', () => {
    const tall = stack(['ball', 'diamond', 'ball'])
    for (let i = 1; i < tall.length; i += 1) {
      expect(tall[i].top).toBe(Math.round((tall[i - 1].top + tall[i - 1].height + SHAPE_GAP) * 100) / 100)
    }
    expect(tall[0].top).toBeGreaterThanOrEqual(0)
    const last = tall[tall.length - 1]
    expect(last.top + last.height).toBeLessThanOrEqual(200)
    expect((tall[0].top + last.top + last.height) / 2).toBeCloseTo(100, 1)
  })
})

describe('the new figure kinds validate', () => {
  it.each([
    ['an unknown plan light', { kind: 'vessel-plan', lights: ['foghorn'] }],
    ['a repeated plan light', { kind: 'vessel-plan', lights: ['masthead', 'masthead'] }],
    ['an empty plan light list', { kind: 'vessel-plan', lights: [] }],
    ['an out-of-range observer', { kind: 'vessel-plan', observer: 360 }],
    ['a fractional observer', { kind: 'vessel-plan', observer: 10.5 }],
    ['a non-boolean sectors flag', { kind: 'vessel-plan', sectors: 'yes' }],
    ['an unknown stack colour', { kind: 'light-stack', lights: ['blue'] }],
    ['an empty light stack', { kind: 'light-stack', lights: [] }],
    ['too long a light stack', { kind: 'light-stack', lights: ['red', 'red', 'red', 'red', 'red'] }],
    ['an unknown shape', { kind: 'day-shape-stack', shapes: ['cylinder'] }],
    ['an empty shape stack', { kind: 'day-shape-stack', shapes: [] }],
  ])('rejects %s', (_name, value) => {
    expect(parseFigure(value, 'x').ok).toBe(false)
  })

  it('accepts the maritime kinds and drops unknown keys', () => {
    expect(parseFigure({ kind: 'light-stack', lights: ['green', 'white'], extra: 1 }, 'x')).toEqual({
      ok: true,
      figure: { kind: 'light-stack', lights: ['green', 'white'] },
    })
    expect(parseFigure({ kind: 'vessel-plan', observer: 45, sectors: true, labels: false, lights: ['masthead'] }, 'x')).toEqual({
      ok: true,
      figure: { kind: 'vessel-plan', observer: 45, sectors: true, lights: ['masthead'] },
    })
  })
})

describe('sector labels', () => {
  it('keep every label clear of every sector arc, so none is drawn over another light', () => {
    const plan = vesselPlanGeometry({ kind: 'vessel-plan', sectors: true })
    const radii: Record<string, number> = { masthead: 70, 'starboard-sidelight': 62, 'port-sidelight': 62, sternlight: 54 }
    for (const sector of plan.sectors) {
      const distance = Math.hypot(sector.label.x - 100, sector.label.y - 100)
      const bearing = LIGHT_SECTORS.find((l) => l.id === sector.id)!.centre
      // Only arcs that actually exist at the label's bearing can be drawn over it.
      for (const arc of LIGHT_SECTORS.filter((l) => isVisible(l, bearing))) {
        // The label glyph is ~9px; keep its centre at least 6px from that arc's centre line.
        expect(Math.abs(distance - radii[arc.id])).toBeGreaterThanOrEqual(6)
      }
    }
  })
})
