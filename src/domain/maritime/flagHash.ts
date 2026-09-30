import { SIGNAL_FLAGS, type FlagDesign } from './flags'

/**
 * A canonical string for a flag design: fixed key order, so the same design
 * always serializes identically. Its SHA-256 is pinned in the manifest, which
 * turns any accidental change to a flag into a failing test.
 */
export function canonicalDesign(design: FlagDesign): string {
  return JSON.stringify({
    shape: design.shape,
    background: design.background,
    primitives: design.primitives.map((primitive) => {
      if (primitive.type === 'rect') {
        return ['rect', primitive.x, primitive.y, primitive.width, primitive.height, primitive.fill]
      }
      if (primitive.type === 'polygon') return ['polygon', primitive.points, primitive.fill]
      return ['line', primitive.from, primitive.to, primitive.width, primitive.stroke]
    }),
  })
}

export function allCanonicalDesigns(): Record<string, string> {
  return Object.fromEntries(SIGNAL_FLAGS.map((flag) => [flag.letter, canonicalDesign(flag.design)]))
}
