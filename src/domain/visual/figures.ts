/**
 * The finite figure registry (#146).
 *
 * A figure is plain serializable data naming one of a small, closed set of
 * deterministic renderings. It is never a component name, markup, a path or an
 * expression: an import that names a kind this registry does not hold is
 * rejected rather than interpreted. Each kind owns its own parameter validation
 * and its own pure geometry, so the same spec renders identically in Learn and
 * Test, and answer keys can be derived from — and tested against — the very
 * same numbers the picture is drawn from.
 *
 * Adding a kind is a code change with its own tests. Domain topics (maritime
 * lights, flags, bearings) register theirs here; nothing in this file knows a
 * curriculum.
 */

/** A whole-degree bearing on a dial, clockwise from the top. */
export interface AngleDialPointer {
  bearing: number
  label?: string
}

/**
 * A plain compass-style dial: a ring, four cardinal marks and up to four
 * labelled pointers. Enough to state "this ray, at this bearing" without an
 * arbitrary drawing language.
 */
export interface AngleDialFigure {
  kind: 'angle-dial'
  pointers: AngleDialPointer[]
  /**
   * Which north the dial is drawn against. Names the north mark `TN`/`MN`/`GN`
   * so a bearing never silently changes its reference between figures.
   */
  reference?: DialReference
  /** Faint 90° axes through the centre, for quadrant sanity checks. */
  quadrantGuides?: boolean
  /** A clockwise arc from north to the first pointer. */
  arc?: boolean
}

export type DialReference = 'T' | 'M' | 'G'

/** One ray of a three-north diagram, at a signed clockwise angle from the upright ray. */
export interface NorthRay {
  ref: DialReference
  /** Whole degrees, clockwise positive. Exactly one ray is 0: the upright one. */
  angle: number
  /** Replaces the default `TN`/`MN`/`GN` text. */
  label?: string
}

/**
 * A schematic of how true, magnetic and grid north sit relative to one another.
 * The drawn angles are the figure's own data and may be exaggerated for
 * legibility; the prompt that uses it carries the numbers and says so.
 */
export interface NorthReferenceFigure {
  kind: 'north-reference'
  rays: NorthRay[]
}

export type FigureSpec = AngleDialFigure | NorthReferenceFigure

export const FIGURE_KIND_NAMES = ['angle-dial', 'north-reference'] as const
export type FigureKindName = (typeof FIGURE_KIND_NAMES)[number]

export const MAX_DIAL_POINTERS = 4
export const MAX_POINTER_LABEL_LENGTH = 12

export type FigureParse = { ok: true; figure: FigureSpec } | { ok: false; error: string }

type Raw = Record<string, unknown>

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseAngleDial(raw: Raw, where: string): FigureParse {
  if (!Array.isArray(raw.pointers) || raw.pointers.length === 0) {
    return { ok: false, error: `${where} angle-dial needs at least one pointer.` }
  }
  if (raw.pointers.length > MAX_DIAL_POINTERS) {
    return { ok: false, error: `${where} angle-dial allows at most ${MAX_DIAL_POINTERS} pointers.` }
  }
  const pointers: AngleDialPointer[] = []
  for (let i = 0; i < raw.pointers.length; i += 1) {
    const pointer = raw.pointers[i]
    if (!isRecord(pointer)) return { ok: false, error: `${where} pointer ${i + 1} is not a pointer.` }
    const { bearing, label } = pointer
    if (typeof bearing !== 'number' || !Number.isInteger(bearing) || bearing < 0 || bearing > 359) {
      return { ok: false, error: `${where} pointer ${i + 1} needs a whole-degree bearing from 0 to 359.` }
    }
    if (label !== undefined) {
      if (typeof label !== 'string' || !label.trim() || label.trim().length > MAX_POINTER_LABEL_LENGTH) {
        return {
          ok: false,
          error: `${where} pointer ${i + 1} label must be 1–${MAX_POINTER_LABEL_LENGTH} characters of text.`,
        }
      }
      pointers.push({ bearing, label: label.trim() })
    } else {
      pointers.push({ bearing })
    }
  }
  const figure: AngleDialFigure = { kind: 'angle-dial', pointers }
  if (raw.reference !== undefined) {
    if (!DIAL_REFERENCES.includes(raw.reference as DialReference)) {
      return { ok: false, error: `${where} angle-dial reference must be T, M or G.` }
    }
    figure.reference = raw.reference as DialReference
  }
  for (const flag of ['quadrantGuides', 'arc'] as const) {
    if (raw[flag] === undefined) continue
    if (typeof raw[flag] !== 'boolean') {
      return { ok: false, error: `${where} angle-dial ${flag} must be true or false.` }
    }
    if (raw[flag]) figure[flag] = true
  }
  return { ok: true, figure }
}

const DIAL_REFERENCES: readonly DialReference[] = ['T', 'M', 'G']
export const MAX_NORTH_RAY_ANGLE = 35
export const MIN_NORTH_RAY_SEPARATION = 8

function parseNorthReference(raw: Raw, where: string): FigureParse {
  if (!Array.isArray(raw.rays) || raw.rays.length < 2 || raw.rays.length > 3) {
    return { ok: false, error: `${where} north-reference needs two or three rays.` }
  }
  const rays: NorthRay[] = []
  for (let i = 0; i < raw.rays.length; i += 1) {
    const ray = raw.rays[i]
    if (!isRecord(ray)) return { ok: false, error: `${where} ray ${i + 1} is not a ray.` }
    if (!DIAL_REFERENCES.includes(ray.ref as DialReference)) {
      return { ok: false, error: `${where} ray ${i + 1} ref must be T, M or G.` }
    }
    const { angle, label } = ray
    if (
      typeof angle !== 'number' ||
      !Number.isInteger(angle) ||
      Math.abs(angle) > MAX_NORTH_RAY_ANGLE
    ) {
      return {
        ok: false,
        error: `${where} ray ${i + 1} needs a whole-degree angle within ±${MAX_NORTH_RAY_ANGLE}.`,
      }
    }
    if (label !== undefined && (typeof label !== 'string' || !label.trim() || label.trim().length > MAX_POINTER_LABEL_LENGTH)) {
      return { ok: false, error: `${where} ray ${i + 1} label must be 1–${MAX_POINTER_LABEL_LENGTH} characters of text.` }
    }
    rays.push({ ref: ray.ref as DialReference, angle, ...(typeof label === 'string' ? { label: label.trim() } : {}) })
  }
  if (new Set(rays.map((ray) => ray.ref)).size !== rays.length) {
    return { ok: false, error: `${where} north-reference draws each north once.` }
  }
  if (rays.filter((ray) => ray.angle === 0).length !== 1) {
    return { ok: false, error: `${where} north-reference needs exactly one upright ray at angle 0.` }
  }
  for (let i = 0; i < rays.length; i += 1) {
    for (let j = i + 1; j < rays.length; j += 1) {
      if (Math.abs(rays[i].angle - rays[j].angle) < MIN_NORTH_RAY_SEPARATION) {
        return {
          ok: false,
          error: `${where} north-reference rays must be at least ${MIN_NORTH_RAY_SEPARATION}° apart so they stay distinguishable.`,
        }
      }
    }
  }
  return { ok: true, figure: { kind: 'north-reference', rays } }
}

/**
 * Validate one serialized figure. Unknown keys are dropped rather than
 * carried, so a stored spec can only ever hold what its kind defines.
 */
export function parseFigure(value: unknown, where: string): FigureParse {
  if (!isRecord(value) || typeof value.kind !== 'string') {
    return { ok: false, error: `${where} figure needs a kind.` }
  }
  if (value.kind === 'angle-dial') return parseAngleDial(value, where)
  if (value.kind === 'north-reference') return parseNorthReference(value, where)
  return {
    ok: false,
    error: `${where} uses unsupported figure kind "${value.kind}". Figures must be one of: ${FIGURE_KIND_NAMES.join(', ')}.`,
  }
}

/** The fixed viewBox every dial is drawn in. */
export const DIAL_VIEWBOX = 200
const CENTRE = DIAL_VIEWBOX / 2
const RING_RADIUS = 78
const POINTER_LENGTH = 70
const LABEL_RADIUS = 52
/** How far a pointer label sits to its clockwise side, clear of the line. */
const LABEL_OFFSET = 9

const ARC_RADIUS = 26

/** A clockwise arc from north to `bearing`, as an SVG path. */
function arcPath(bearing: number): string {
  const start = dialPoint(0, ARC_RADIUS)
  const end = dialPoint(bearing, ARC_RADIUS)
  return `M ${start.x} ${start.y} A ${ARC_RADIUS} ${ARC_RADIUS} 0 ${bearing > 180 ? 1 : 0} 1 ${end.x} ${end.y}`
}

/** A pointer label beside the pointer, inside the ring, so it never meets a cardinal mark. */
function labelPoint(bearing: number): { x: number; y: number } {
  const along = dialPoint(bearing, LABEL_RADIUS)
  const radians = (bearing * Math.PI) / 180
  return {
    x: round(along.x + LABEL_OFFSET * Math.cos(radians)),
    y: round(along.y + LABEL_OFFSET * Math.sin(radians)),
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

/** A bearing as a point at `radius` from the dial centre. North is up, clockwise. */
export function dialPoint(bearing: number, radius: number): { x: number; y: number } {
  const radians = (bearing * Math.PI) / 180
  return { x: round(CENTRE + radius * Math.sin(radians)), y: round(CENTRE - radius * Math.cos(radians)) }
}

export interface AngleDialGeometry {
  centre: { x: number; y: number }
  ringRadius: number
  /** Axis end points when quadrant guides are on, else none. */
  guides: { from: { x: number; y: number }; to: { x: number; y: number } }[]
  /** SVG path of the clockwise arc from north to the first pointer, when on. */
  arcPath: string | null
  cardinals: { label: string; bearing: number; x: number; y: number }[]
  pointers: { bearing: number; label?: string; tip: { x: number; y: number }; labelAt: { x: number; y: number } }[]
}

/** Every coordinate the dial is drawn from. Pure, so it is unit-testable. */
export function angleDialGeometry(figure: AngleDialFigure): AngleDialGeometry {
  const first = figure.pointers[0]
  return {
    centre: { x: CENTRE, y: CENTRE },
    ringRadius: RING_RADIUS,
    guides: figure.quadrantGuides
      ? [
          { from: dialPoint(0, RING_RADIUS), to: dialPoint(180, RING_RADIUS) },
          { from: dialPoint(90, RING_RADIUS), to: dialPoint(270, RING_RADIUS) },
        ]
      : [],
    arcPath:
      figure.arc && first.bearing > 0
        ? arcPath(first.bearing)
        : null,
    cardinals: [
      { label: figure.reference ? `${figure.reference}N` : 'N', bearing: 0 },
      { label: 'E', bearing: 90 },
      { label: 'S', bearing: 180 },
      { label: 'W', bearing: 270 },
    ].map((cardinal) => ({ ...cardinal, ...dialPoint(cardinal.bearing, RING_RADIUS + 13) })),
    pointers: figure.pointers.map((pointer) => ({
      bearing: pointer.bearing,
      ...(pointer.label ? { label: pointer.label } : {}),
      tip: dialPoint(pointer.bearing, POINTER_LENGTH),
      labelAt: labelPoint(pointer.bearing),
    })),
  }
}

const VERTEX = { x: DIAL_VIEWBOX / 2, y: 165 }
const NORTH_RAY_LENGTH = 105
const NORTH_LABEL_RADIUS = 122

export interface NorthReferenceGeometry {
  vertex: { x: number; y: number }
  rays: {
    ref: DialReference
    angle: number
    label: string
    tip: { x: number; y: number }
    labelAt: { x: number; y: number }
  }[]
}

/** Every coordinate of the three-north schematic. Pure, so it is unit-testable. */
export function northReferenceGeometry(figure: NorthReferenceFigure): NorthReferenceGeometry {
  const at = (angle: number, radius: number) => {
    const radians = (angle * Math.PI) / 180
    return { x: round(VERTEX.x + radius * Math.sin(radians)), y: round(VERTEX.y - radius * Math.cos(radians)) }
  }
  return {
    vertex: VERTEX,
    rays: figure.rays.map((ray) => ({
      ref: ray.ref,
      angle: ray.angle,
      label: ray.label ?? `${ray.ref}N`,
      tip: at(ray.angle, NORTH_RAY_LENGTH),
      labelAt: at(ray.angle, NORTH_LABEL_RADIUS),
    })),
  }
}
