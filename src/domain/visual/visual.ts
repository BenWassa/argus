import type { FigureSpec } from './figures'

/**
 * The visual stimulus (#146): one picture with the text that makes it usable
 * without the picture. Content definition only — nothing here is learner state
 * and nothing is scored by itself.
 *
 * A visual is either a constrained deterministic figure or a local image. It
 * never names a remote URL: Argus must work offline, so an image is a path
 * under `/media/` in the shipped bundle.
 */
export type VisualSource =
  | { kind: 'figure'; figure: FigureSpec }
  | { kind: 'image'; src: string; width: number; height: number }

export interface Visual {
  source: VisualSource
  /**
   * Required text alternative. It is what assistive technology reads in place
   * of the picture, so it must carry what the picture carries. On a scored item
   * it is read as part of the question, so write it as the stimulus rather than
   * as the answer.
   */
  alt: string
  /** Visible caption, rendered as HTML text beside the picture. */
  caption?: string
  /** Visible credit line where a source or licence requires one. */
  credit?: string
  /** Durable identifier tying an image to its provenance record. */
  assetId?: string
}

/**
 * A finite single-answer choice attached to a scored item (#146).
 *
 * The item's `answer` remains the answer key and must be exactly one of
 * `options`, so the recall reference, catalog identity, export and every
 * text-only surface keep working from `prompt`/`answer` alone. Options are
 * authored and fixed; only their display order varies.
 */
export interface ItemChoice {
  options: string[]
}

export const MIN_CHOICE_OPTIONS = 2
export const MAX_CHOICE_OPTIONS = 6
export const MAX_VISUAL_DIMENSION = 4096

/** Local shipped media only, under `/media/`, with a conventional image extension. */
export const LOCAL_MEDIA_PATTERN = /^\/media\/(?:[A-Za-z0-9][A-Za-z0-9._-]*\/)*[A-Za-z0-9][A-Za-z0-9._-]*\.(?:avif|webp|png|jpe?g|svg)$/
