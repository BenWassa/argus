import { parseFigure } from '../../domain/visual/figures'
import {
  LOCAL_MEDIA_PATTERN,
  MAX_CHOICE_OPTIONS,
  MAX_VISUAL_DIMENSION,
  MIN_CHOICE_OPTIONS,
  type ItemChoice,
  type Visual,
  type VisualSource,
} from '../../domain/visual/visual'

/**
 * Import-boundary validation for the visual primitives (#146). Kept beside the
 * library parser rather than inside it so the rules for pictures and choices
 * read in one place; it follows the same contract — validate, never interpret.
 */
type Raw = Record<string, unknown>
type Result<T> = { ok: true; value: T } | { ok: false; error: string }

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function parseSource(value: unknown, where: string): Result<VisualSource> {
  if (!isRecord(value) || typeof value.kind !== 'string') {
    return { ok: false, error: `${where} needs a source with a kind.` }
  }
  if (value.kind === 'figure') {
    const figure = parseFigure(value.figure, where)
    return figure.ok ? { ok: true, value: { kind: 'figure', figure: figure.figure } } : figure
  }
  if (value.kind === 'image') {
    const src = typeof value.src === 'string' ? value.src : ''
    if (!LOCAL_MEDIA_PATTERN.test(src)) {
      return {
        ok: false,
        error: `${where} image must be a local shipped file under /media/ with an image extension; remote addresses are not allowed.`,
      }
    }
    const { width, height } = value
    const valid = (n: unknown): n is number =>
      typeof n === 'number' && Number.isInteger(n) && n > 0 && n <= MAX_VISUAL_DIMENSION
    if (!valid(width) || !valid(height)) {
      return { ok: false, error: `${where} image needs whole-pixel width and height so the page can reserve its space.` }
    }
    return { ok: true, value: { kind: 'image', src, width, height } }
  }
  return { ok: false, error: `${where} source kind "${value.kind}" is not supported.` }
}

export function parseVisual(value: unknown, where: string): Result<Visual> {
  if (!isRecord(value)) return { ok: false, error: `${where} visual is not an object.` }
  const source = parseSource(value.source, `${where} visual`)
  if (!source.ok) return source
  const alt = text(value.alt)
  if (!alt) return { ok: false, error: `${where} visual needs alt text; the picture may not be the only carrier of its meaning.` }
  const caption = text(value.caption)
  const credit = text(value.credit)
  const assetId = text(value.assetId)
  return {
    ok: true,
    value: {
      source: source.value,
      alt,
      ...(caption ? { caption } : {}),
      ...(credit ? { credit } : {}),
      ...(assetId ? { assetId } : {}),
    },
  }
}

/** Options must be distinct text and must contain the item's answer exactly once. */
export function parseChoice(value: unknown, answer: string, where: string): Result<ItemChoice> {
  if (!isRecord(value) || !Array.isArray(value.options)) {
    return { ok: false, error: `${where} choice needs a list of options.` }
  }
  if (value.options.length < MIN_CHOICE_OPTIONS || value.options.length > MAX_CHOICE_OPTIONS) {
    return {
      ok: false,
      error: `${where} choice needs ${MIN_CHOICE_OPTIONS}–${MAX_CHOICE_OPTIONS} options.`,
    }
  }
  const options: string[] = []
  for (const raw of value.options) {
    const option = text(raw)
    if (!option) return { ok: false, error: `${where} choice has an empty or non-text option.` }
    options.push(option)
  }
  if (new Set(options).size !== options.length) {
    return { ok: false, error: `${where} choice repeats an option.` }
  }
  if (options.filter((option) => option === answer).length !== 1) {
    return { ok: false, error: `${where} choice must include the item's answer as exactly one option.` }
  }
  return { ok: true, value: { options } }
}
