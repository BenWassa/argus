import type { LightColour } from './lights'

/**
 * The vessel states the Maritime I programme asks about (#147): eight light
 * signatures and, for five of the same states, the day shape. Each is a
 * distinguishing legal reference configuration from the Collision Regulations,
 * not an exhaustive list of what the rule requires; optional and size-dependent
 * additions are Learn-only (`docs/open/ISSUE_138_MARITIME_VISUAL_LITERACY.md`
 * §B2, §C).
 *
 * A displayed signal is interpreted; the absence of one proves nothing, because
 * the regulations exempt small vessels and some situations.
 */
export type DayShape = 'ball' | 'diamond' | 'cone-apex-up' | 'cone-apex-down'

export type StatusId =
  | 'power-driven'
  | 'sailing'
  | 'trawling'
  | 'fishing'
  | 'not-under-command'
  | 'restricted-manoeuvre'
  | 'anchor'
  | 'aground'

export type LightArrangement =
  /** The vessel's own sector lights, marked on the plan view. */
  | { kind: 'plan'; lights: ('masthead' | 'port-sidelight' | 'starboard-sidelight' | 'sternlight')[] }
  /** All-round lights in a vertical line, top first. */
  | { kind: 'stack'; lights: LightColour[] }

export interface VesselStatus {
  id: StatusId
  /** The answer text for a light item. Stable, and distinct per state. */
  state: string
  rule: string
  arrangement: LightArrangement
  /** Day shapes, top first, for the states the day-shape topic scores. */
  shapes?: DayShape[]
}

export const VESSEL_STATUSES: readonly VesselStatus[] = [
  {
    id: 'power-driven',
    state: 'Power-driven vessel underway (under 50 m)',
    rule: 'Rule 23',
    arrangement: { kind: 'plan', lights: ['masthead', 'port-sidelight', 'starboard-sidelight', 'sternlight'] },
  },
  {
    id: 'sailing',
    state: 'Sailing vessel underway',
    rule: 'Rule 25(a)',
    arrangement: { kind: 'plan', lights: ['port-sidelight', 'starboard-sidelight', 'sternlight'] },
  },
  {
    id: 'trawling',
    state: 'Vessel trawling',
    rule: 'Rule 26(b)',
    arrangement: { kind: 'stack', lights: ['green', 'white'] },
    shapes: ['cone-apex-down', 'cone-apex-up'],
  },
  {
    id: 'fishing',
    state: 'Vessel fishing, other than trawling',
    rule: 'Rule 26(c)',
    arrangement: { kind: 'stack', lights: ['red', 'white'] },
    shapes: ['cone-apex-down', 'cone-apex-up'],
  },
  {
    id: 'not-under-command',
    state: 'Vessel not under command',
    rule: 'Rule 27(a)',
    arrangement: { kind: 'stack', lights: ['red', 'red'] },
    shapes: ['ball', 'ball'],
  },
  {
    id: 'restricted-manoeuvre',
    state: 'Vessel restricted in her ability to manoeuvre',
    rule: 'Rule 27(b)',
    arrangement: { kind: 'stack', lights: ['red', 'white', 'red'] },
    shapes: ['ball', 'diamond', 'ball'],
  },
  {
    id: 'anchor',
    state: 'Vessel at anchor (under 50 m)',
    rule: 'Rule 30(a)',
    arrangement: { kind: 'stack', lights: ['white'] },
    shapes: ['ball'],
  },
  {
    id: 'aground',
    state: 'Vessel aground (under 50 m)',
    rule: 'Rule 30(d)',
    // The anchor light plus two all-round red lights in a vertical line. The rule
    // places the reds "where they can best be seen"; this stack is a teaching depiction.
    arrangement: { kind: 'stack', lights: ['white', 'red', 'red'] },
    shapes: ['ball', 'ball', 'ball'],
  },
]

export function statusById(id: StatusId): VesselStatus {
  return VESSEL_STATUSES.find((status) => status.id === id)!
}

/** The five states that have a scored day shape, in the research note's order. */
export const DAY_SHAPE_STATUS_ORDER: StatusId[] = [
  'anchor',
  'not-under-command',
  'restricted-manoeuvre',
  'aground',
  'fishing',
]

/**
 * The fishing day shape is shared by trawling and other fishing (Rule 26(b),
 * (c)), so the scored answer names both rather than implying it distinguishes
 * them.
 */
export const FISHING_SHAPE_STATE = 'Vessel engaged in fishing (trawling or other fishing)'

export const SHAPE_NAMES: Record<DayShape, string> = {
  ball: 'ball',
  diamond: 'diamond',
  'cone-apex-up': 'cone with its apex up',
  'cone-apex-down': 'cone with its apex down',
}

export function describeLightStack(lights: readonly LightColour[]): string {
  const count = ['zero', 'One', 'Two', 'Three', 'Four'][lights.length]
  const lines = lights.length === 1 ? 'light' : 'lights'
  const order = lights.length === 1 ? lights[0] : lights.join(' above ')
  return `${count} all-round ${lines}${lights.length > 1 ? ' in a vertical line' : ''}: ${order}.`
}

export function describeShapeStack(shapes: readonly DayShape[]): string {
  const count = ['zero', 'One', 'Two', 'Three', 'Four'][shapes.length]
  if (shapes.length === 1) return `One black shape: ${SHAPE_NAMES[shapes[0]]}.`
  const order = shapes.map((shape) => SHAPE_NAMES[shape]).join(', then ')
  const together =
    shapes.length === 2 && shapes[0] === 'cone-apex-down' && shapes[1] === 'cone-apex-up'
      ? ', with their apexes together'
      : ''
  return `${count} black shapes in a vertical line, top to bottom: ${order}${together}.`
}

const PLAN_LIGHT_TEXT: Record<'masthead' | 'port-sidelight' | 'starboard-sidelight' | 'sternlight', string> = {
  masthead: 'a white light on the centreline, forward',
  'port-sidelight': 'a red light on the port (left) side',
  'starboard-sidelight': 'a green light on the starboard (right) side',
  sternlight: 'a white light at the stern',
}

/** The lights marked on a plan view, described without naming the vessel state. */
export function describePlanLights(
  lights: readonly ('masthead' | 'port-sidelight' | 'starboard-sidelight' | 'sternlight')[],
): string {
  const parts = lights.map((light) => PLAN_LIGHT_TEXT[light])
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
  return `A top-down plan of a vessel, bow at the top, with lights marked: ${list}.`
}
