/**
 * The navigation-light model for the Maritime I programme (#147).
 *
 * One source-derived geometry model that the diagrams and the answer keys are
 * both computed from. The sector values are those of the Collision Regulations
 * (C.R.C., c. 1416, Schedule 1) Rule 21, as recorded in
 * `docs/open/ISSUE_138_MARITIME_VISUAL_LITERACY.md` §B1:
 *
 * - masthead light: white, 225°, from right ahead to 22.5° abaft the beam on
 *   each side;
 * - starboard sidelight: green, 112.5°;
 * - port sidelight: red, 112.5°;
 * - sternlight: white, 135°, centred aft;
 * - all-round light: 360°, so its visibility never varies with bearing.
 *
 * Bearings here are the **observer's position around the vessel**, in degrees
 * clockwise from the bow: 045° is on the starboard bow, 270° is abeam to port.
 * The vessel is the canonical power-driven vessel under 50 m, underway, with
 * one masthead light. Sector edges are inclusive on both sides, so a bearing
 * exactly on an edge sees both neighbouring lights; the scored aspects avoid
 * every edge.
 */
export type LightColour = 'white' | 'red' | 'green'

export type SectorLight = 'masthead' | 'starboard-sidelight' | 'port-sidelight' | 'sternlight'

export interface LightSector {
  id: SectorLight
  colour: LightColour
  /** Centre of the arc, clockwise from the bow. */
  centre: number
  /** Total width of the arc in degrees. */
  width: number
  /** Whether the arc runs from `from` clockwise to `to` (both clockwise from the bow). */
  from: number
  to: number
  name: string
}

function sector(
  id: SectorLight,
  colour: LightColour,
  from: number,
  width: number,
  name: string,
): LightSector {
  const normalized = ((from % 360) + 360) % 360
  return {
    id,
    colour,
    centre: (normalized + width / 2) % 360,
    width,
    from: normalized,
    to: (normalized + width) % 360,
    name,
  }
}

/** Rule 21, in the order a learner meets them. */
export const LIGHT_SECTORS: readonly LightSector[] = [
  sector('masthead', 'white', 360 - 112.5, 225, 'Masthead light'),
  sector('starboard-sidelight', 'green', 0, 112.5, 'Green sidelight'),
  sector('port-sidelight', 'red', 360 - 112.5, 112.5, 'Red sidelight'),
  sector('sternlight', 'white', 112.5, 135, 'Sternlight'),
]

export const ALL_ROUND_ARC = 360

/** Smallest angle between two bearings, 0–180. */
function separation(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 360) % 360)
  return Math.min(d, 360 - d)
}

/** Whether the light shows at this observer bearing. Edges are inclusive. */
export function isVisible(light: LightSector, observerBearing: number): boolean {
  return separation(observerBearing, light.centre) <= light.width / 2
}

/** The sector lights an observer at `observerBearing` can see, in rule order. */
export function visibleLights(observerBearing: number): SectorLight[] {
  return LIGHT_SECTORS.filter((light) => isVisible(light, observerBearing)).map((light) => light.id)
}

export function lightName(id: SectorLight): string {
  return LIGHT_SECTORS.find((light) => light.id === id)!.name
}

/**
 * A set of visible lights as learner-facing text. Stable wording, so answer
 * options built from different aspects compare by exact match.
 */
export function describeVisibleLights(lights: readonly SectorLight[]): string {
  const has = (id: SectorLight) => lights.includes(id)
  const parts: string[] = []
  if (has('masthead')) parts.push('masthead light')
  if (has('port-sidelight')) parts.push('red sidelight')
  if (has('starboard-sidelight')) parts.push('green sidelight')
  if (has('sternlight')) parts.push('sternlight')
  if (parts.length === 0) return 'No sector light'
  const text =
    parts.length === 1
      ? `${parts[0]} only`
      : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Where an observer at this bearing stands, in words the prompt can carry. */
export function describeAspect(bearing: number): string {
  const named: Record<number, string> = {
    0: 'dead ahead',
    45: 'on the starboard bow',
    90: 'on the starboard beam',
    135: 'on the starboard quarter',
    180: 'dead astern',
    225: 'on the port quarter',
    270: 'on the port beam',
    315: 'on the port bow',
  }
  const text = named[bearing]
  if (text) return text
  const side = bearing < 180 ? 'starboard' : 'port'
  return `${bearing}° clockwise from the bow, on the ${side} side`
}

/**
 * Where a light is drawn on the plan view, in a frame where the vessel's bow is
 * up and its centreline is x = 0. Port is to the left and starboard to the
 * right, as on a chart, so the transform cannot swap red and green.
 */
export interface PlanLight {
  id: SectorLight
  colour: LightColour
  /** −1 (port edge) to +1 (starboard edge) across the hull. */
  across: number
  /** 0 at the bow to 1 at the stern. */
  along: number
}

export const PLAN_LIGHTS: readonly PlanLight[] = [
  { id: 'masthead', colour: 'white', across: 0, along: 0.3 },
  { id: 'port-sidelight', colour: 'red', across: -1, along: 0.4 },
  { id: 'starboard-sidelight', colour: 'green', across: 1, along: 0.4 },
  { id: 'sternlight', colour: 'white', across: 0, along: 1 },
]

/** The eight observer aspects the scored items use, clockwise from ahead. */
export const SCORED_ASPECTS = [0, 45, 90, 135, 180, 225, 270, 315] as const
