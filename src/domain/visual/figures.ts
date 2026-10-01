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
}

export type FigureSpec = AngleDialFigure

export const FIGURE_KIND_NAMES = ['angle-dial'] as const
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
  return { ok: true, figure: { kind: 'angle-dial', pointers } }
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
  cardinals: { label: string; bearing: number; x: number; y: number }[]
  pointers: { bearing: number; label?: string; tip: { x: number; y: number }; labelAt: { x: number; y: number } }[]
}

/** Every coordinate the dial is drawn from. Pure, so it is unit-testable. */
export function angleDialGeometry(figure: AngleDialFigure): AngleDialGeometry {
  return {
    centre: { x: CENTRE, y: CENTRE },
    ringRadius: RING_RADIUS,
    cardinals: [
      { label: 'N', bearing: 0 },
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
