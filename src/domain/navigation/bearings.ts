/**
 * Whole-circle bearing arithmetic for the Compass & Bearings programme (#149).
 *
 * One small pure module that every diagram and every answer key is derived
 * from, so a scored answer can never be a number somebody typed into a separate
 * prose key. The conventions are the ones `docs/open/ISSUE_140_COMPASS_BEARINGS_TOPO.md`
 * §4 fixes:
 *
 * - bearings run clockwise from the stated north reference and are normalized
 *   to 000°–359°;
 * - magnetic declination `D` is positive eastward (NRCan);
 * - `C`, the signed grid convergence, is an Argus exercise convention: east of
 *   true north is positive, west negative.
 *
 * Nothing here looks anything up. Declination is hypothetical and supplied.
 */
export type NorthReference = 'T' | 'M' | 'G'

export const NORTH_REFERENCES: readonly NorthReference[] = ['T', 'M', 'G']

export const NORTH_REFERENCE_NAMES: Record<NorthReference, string> = {
  T: 'true north',
  M: 'magnetic north',
  G: 'grid north',
}

/** `normalize(x) = ((x mod 360) + 360) mod 360`. */
export function normalize(degrees: number): number {
  return ((degrees % 360) + 360) % 360
}

/** The opposite direction on the same north reference. */
export function reciprocal(bearing: number): number {
  return normalize(bearing + 180)
}

/**
 * Signed clockwise offsets of each north from true north, in degrees:
 * `αT = 0`, `αM = D`, `αG = C`.
 */
export interface NorthOffsets {
  /** Magnetic declination, east positive. */
  D: number
  /** Grid convergence, east of true positive (Argus exercise convention). */
  C: number
}

function alpha(reference: NorthReference, offsets: NorthOffsets): number {
  return reference === 'T' ? 0 : reference === 'M' ? offsets.D : offsets.C
}

/**
 * `bearing_B = normalize(bearing_A + αA − αB)`: the one conversion rule. Each of
 * the six named conversions (T↔M, T↔G, G↔M) is an instance of it.
 */
export function convert(
  bearing: number,
  from: NorthReference,
  to: NorthReference,
  offsets: NorthOffsets,
): number {
  return normalize(bearing + alpha(from, offsets) - alpha(to, offsets))
}

/**
 * Grid declination: the angle of magnetic north from grid north, east positive.
 * The NTS margin states this directly. It is `D − C`, and it is **not** the
 * true-magnetic declination unless the convergence is zero.
 */
export function gridDeclination(offsets: NorthOffsets): number {
  return offsets.D - offsets.C
}

/** A bearing as printed: three digits, the degree sign and the reference. */
export function formatBearing(bearing: number, reference: NorthReference): string {
  return `${String(normalize(bearing)).padStart(3, '0')}°${reference}`
}

/** A signed offset as printed, naming the side: `10° E (+10°)`. */
export function formatOffset(value: number): string {
  if (value === 0) return '0°'
  return `${Math.abs(value)}° ${value > 0 ? 'E' : 'W'} (${value > 0 ? '+' : '−'}${Math.abs(value)}°)`
}

/** The smallest angle between two bearings, 0–180. */
export function angularSeparation(a: number, b: number): number {
  const difference = Math.abs(normalize(a) - normalize(b))
  return Math.min(difference, 360 - difference)
}
