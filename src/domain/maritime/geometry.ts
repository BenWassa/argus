import type {
  DayShapeStackFigure,
  LightStackFigure,
  VesselPlanFigure,
} from '../visual/figures'
import { LIGHT_SECTORS, PLAN_LIGHTS, type LightColour } from './lights'

/**
 * Pure coordinates for the maritime figures (#147). The renderer draws these and
 * the tests check them against the source data, so a picture and an answer key
 * cannot drift apart. All are in a 200 × 200 frame.
 */
const FRAME = 200
const C = FRAME / 2

const round = (n: number) => Math.round(n * 100) / 100

/** A point at `radius` from the frame centre, at a bearing clockwise from up. */
function polar(bearing: number, radius: number, origin = { x: C, y: C }) {
  const r = (bearing * Math.PI) / 180
  return { x: round(origin.x + radius * Math.sin(r)), y: round(origin.y - radius * Math.cos(r)) }
}

// --- vessel plan -----------------------------------------------------------

const BOW_Y = 52
const STERN_Y = 142
const HULL_HALF = 17
const SHOULDER_Y = 82
const OBSERVER_RADIUS = 84

const ARC_RADIUS: Record<string, number> = {
  masthead: 70,
  'starboard-sidelight': 62,
  'port-sidelight': 62,
  sternlight: 54,
}

const SECTOR_LETTER: Record<string, string> = {
  masthead: 'M',
  'starboard-sidelight': 'G',
  'port-sidelight': 'R',
  sternlight: 'S',
}

function arc(from: number, width: number, radius: number): string {
  const start = polar(from, radius)
  const end = polar(from + width, radius)
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${width > 180 ? 1 : 0} 1 ${end.x} ${end.y}`
}

export interface VesselPlanGeometry {
  hull: string
  centreline: { from: { x: number; y: number }; to: { x: number; y: number } }
  lights: { id: string; colour: LightColour; x: number; y: number }[]
  observer: null | {
    at: { x: number; y: number }
    towards: { x: number; y: number }
    bearing: number
  }
  sectors: { id: string; colour: LightColour; path: string; label: { letter: string; x: number; y: number } }[]
  labels: { text: string; x: number; y: number }[]
}

export function vesselPlanGeometry(figure: VesselPlanFigure): VesselPlanGeometry {
  const hull = [
    `M ${C} ${BOW_Y}`,
    `L ${C + HULL_HALF} ${SHOULDER_Y}`,
    `L ${C + HULL_HALF} ${STERN_Y}`,
    `L ${C - HULL_HALF} ${STERN_Y}`,
    `L ${C - HULL_HALF} ${SHOULDER_Y}`,
    'Z',
  ].join(' ')

  const lights = PLAN_LIGHTS.filter((light) => figure.lights?.includes(light.id)).map((light) => ({
    id: light.id,
    colour: light.colour,
    // Port is left of the centreline and starboard right, bow up, as on a chart.
    x: round(C + light.across * (HULL_HALF - 2)),
    y: round(BOW_Y + light.along * (STERN_Y - BOW_Y)),
  }))

  const observer =
    figure.observer === undefined
      ? null
      : {
          at: polar(figure.observer, OBSERVER_RADIUS),
          towards: polar(figure.observer, OBSERVER_RADIUS - 16),
          bearing: figure.observer,
        }

  const sectors = figure.sectors
    ? LIGHT_SECTORS.map((sector) => {
        const radius = ARC_RADIUS[sector.id]
        return {
          id: sector.id,
          colour: sector.colour,
          path: arc(sector.from, sector.width, radius),
          // Sidelight labels sit inside their arcs: outside, they would land on the
          // masthead arc that is drawn just beyond them.
          label: {
            letter: SECTOR_LETTER[sector.id],
            ...polar(sector.centre, sector.id.endsWith('sidelight') ? radius - 9 : radius + 9),
          },
        }
      })
    : []

  const labels = figure.labels
    ? [
        { text: 'BOW', x: C, y: 40 },
        { text: 'STERN', x: C, y: 158 },
        { text: 'PORT', x: 56, y: 104 },
        { text: 'STBD', x: 144, y: 104 },
      ]
    : []

  return {
    hull,
    centreline: { from: { x: C, y: BOW_Y - 6 }, to: { x: C, y: STERN_Y + 6 } },
    lights,
    observer,
    sectors,
    labels,
  }
}

// --- light stack -----------------------------------------------------------

const STACK_SPACING = 34
const LIGHT_RADIUS = 12

export function lightStackGeometry(figure: LightStackFigure) {
  const span = (figure.lights.length - 1) * STACK_SPACING
  return figure.lights.map((colour, index) => ({
    colour,
    cx: C,
    cy: round(C - span / 2 + index * STACK_SPACING),
    r: LIGHT_RADIUS,
  }))
}

// --- day shapes -------------------------------------------------------------

/**
 * Proportions follow Collision Regulations Annex I §6: a ball has diameter D, a
 * cone has base diameter D and height D, and a diamond is two cones with a
 * common base. The gap between shapes is an editorial drawing choice for
 * legibility at phone size, not a rule value.
 */
export const SHAPE_DIAMETER = 34
export const SHAPE_GAP = 14

export type ShapeDrawing =
  | { kind: 'ball'; cx: number; cy: number; r: number; top: number; height: number }
  | { kind: 'diamond' | 'cone-apex-up' | 'cone-apex-down'; points: string; top: number; height: number }

export function dayShapeStackGeometry(figure: DayShapeStackFigure): ShapeDrawing[] {
  const D = SHAPE_DIAMETER
  const heightOf = (shape: string) => (shape === 'diamond' ? 2 * D : D)
  const total =
    figure.shapes.reduce((sum, shape) => sum + heightOf(shape), 0) + (figure.shapes.length - 1) * SHAPE_GAP
  let top = round(C - total / 2)
  const drawings: ShapeDrawing[] = []
  for (const shape of figure.shapes) {
    const height = heightOf(shape)
    const left = C - D / 2
    const right = C + D / 2
    if (shape === 'ball') {
      drawings.push({ kind: 'ball', cx: C, cy: round(top + D / 2), r: D / 2, top, height })
    } else if (shape === 'diamond') {
      drawings.push({
        kind: 'diamond',
        points: `${C},${top} ${right},${round(top + D)} ${C},${round(top + 2 * D)} ${left},${round(top + D)}`,
        top,
        height,
      })
    } else if (shape === 'cone-apex-up') {
      drawings.push({
        kind: 'cone-apex-up',
        points: `${C},${top} ${right},${round(top + D)} ${left},${round(top + D)}`,
        top,
        height,
      })
    } else {
      drawings.push({
        kind: 'cone-apex-down',
        points: `${left},${top} ${right},${top} ${C},${round(top + D)}`,
        top,
        height,
      })
    }
    top = round(top + height + SHAPE_GAP)
  }
  return drawings
}
