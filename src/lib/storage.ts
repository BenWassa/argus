import {
  LEARN_KINDS,
  STATUSES,
  TRACKS,
  type LearnBlock,
  type LearnCaseStudy,
  type LearnContent,
  type LearnSection,
  type LearnSource,
  type Library,
  type Topic,
} from './types'
import { seedLibrary } from './seed'

const KEY = 'argus.library.v4'
const LEGACY_KEYS = ['argus.library.v3', 'argus.library.v2'] as const

export function loadLibrary(): Library {
  try {
    const found = [KEY, ...LEGACY_KEYS]
      .map((key) => ({ key, raw: localStorage.getItem(key) }))
      .find((entry) => entry.raw !== null)
    if (!found?.raw) return seedLibrary()

    const parsed = parseLibrary(JSON.parse(found.raw))
    if (!parsed.ok) return seedLibrary()

    // Promote a valid legacy record immediately. This makes the migration
    // durable even before the provider's first effect runs.
    if (found.key !== KEY) saveLibrary(parsed.library)
    return parsed.library
  } catch {
    return seedLibrary()
  }
}

export function saveLibrary(library: Library): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(library))
  } catch {
    // Storage can be full or blocked in private mode. The app stays usable
    // for the session; export is the recovery path and it stays reachable.
  }
}

export function clearLibrary(): void {
  try {
    localStorage.removeItem(KEY)
    for (const key of LEGACY_KEYS) localStorage.removeItem(key)
  } catch {
    /* nothing to recover from */
  }
}

export type ParseResult =
  | { ok: true; library: Library }
  | { ok: false; error: string }

type LearnParseResult =
  | { ok: true; learn: LearnContent | undefined }
  | { ok: false; error: string }

type SectionParseResult =
  | { ok: true; sections: LearnSection[] }
  | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function parseTextList(value: unknown, where: string): { ok: true; value: string[] } | { ok: false; error: string } {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, error: `${where} must contain at least one text item.` }
  }
  const items = value.map(optionalText)
  if (items.some((item) => !item)) {
    return { ok: false, error: `${where} contains an empty or non-text item.` }
  }
  return { ok: true, value: items as string[] }
}

function parseBlock(value: unknown, where: string): { ok: true; block: LearnBlock } | { ok: false; error: string } {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return { ok: false, error: `${where} has no structured block type.` }
  }

  if (value.type === 'paragraph') {
    const text = optionalText(value.text)
    if (!text) return { ok: false, error: `${where} paragraph has no text.` }
    return { ok: true, block: { type: 'paragraph', text } }
  }

  if (value.type === 'bullets' || value.type === 'steps') {
    const items = parseTextList(value.items, `${where} ${value.type}`)
    if (!items.ok) return items
    return { ok: true, block: { type: value.type, items: items.value } }
  }

  if (value.type === 'definitions') {
    if (!Array.isArray(value.items) || value.items.length === 0) {
      return { ok: false, error: `${where} definitions must contain at least one term.` }
    }
    const items: { term: string; definition: string }[] = []
    for (let i = 0; i < value.items.length; i += 1) {
      const raw = value.items[i]
      const term = isRecord(raw) ? optionalText(raw.term) : undefined
      const definition = isRecord(raw) ? optionalText(raw.definition) : undefined
      if (!term || !definition) {
        return { ok: false, error: `${where} definition ${i + 1} needs both a term and a definition.` }
      }
      items.push({ term, definition })
    }
    return { ok: true, block: { type: 'definitions', items } }
  }

  if (value.type === 'table') {
    const columns = parseTextList(value.columns, `${where} table columns`)
    if (!columns.ok) return columns
    if (columns.value.length < 2) {
      return { ok: false, error: `${where} table needs at least two columns.` }
    }
    if (!Array.isArray(value.rows) || value.rows.length === 0) {
      return { ok: false, error: `${where} table needs at least one row.` }
    }
    const rows: string[][] = []
    for (let i = 0; i < value.rows.length; i += 1) {
      const row = parseTextList(value.rows[i], `${where} table row ${i + 1}`)
      if (!row.ok) return row
      if (row.value.length !== columns.value.length) {
        return {
          ok: false,
          error: `${where} table row ${i + 1} has ${row.value.length} cells; expected ${columns.value.length}.`,
        }
      }
      rows.push(row.value)
    }
    return { ok: true, block: { type: 'table', columns: columns.value, rows } }
  }

  return {
    ok: false,
    error: `${where} uses unsupported block type "${value.type}". Learn content must use the structured Argus block types, not arbitrary HTML.`,
  }
}

function parseSections(value: unknown, where: string): SectionParseResult {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, error: `${where} must contain at least one section.` }
  }

  const sections: LearnSection[] = []
  for (let i = 0; i < value.length; i += 1) {
    const raw = value[i]
    const heading = isRecord(raw) ? optionalText(raw.heading) : undefined
    if (!heading) return { ok: false, error: `${where} section ${i + 1} has no heading.` }
    if (!isRecord(raw) || !Array.isArray(raw.blocks) || raw.blocks.length === 0) {
      return { ok: false, error: `${where} section ${i + 1} has no content blocks.` }
    }

    const blocks: LearnBlock[] = []
    for (let j = 0; j < raw.blocks.length; j += 1) {
      const parsed = parseBlock(raw.blocks[j], `${where} section ${i + 1}, block ${j + 1}`)
      if (!parsed.ok) return parsed
      blocks.push(parsed.block)
    }
    sections.push({ heading, blocks })
  }
  return { ok: true, sections }
}

function parseCaseStudies(value: unknown, where: string): { ok: true; value: LearnCaseStudy[] } | { ok: false; error: string } {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, error: `${where} must contain at least one integrated case study.` }
  }

  const cases: LearnCaseStudy[] = []
  for (let i = 0; i < value.length; i += 1) {
    const raw = value[i]
    const title = isRecord(raw) ? optionalText(raw.title) : undefined
    const scenario = isRecord(raw) ? optionalText(raw.scenario) : undefined
    if (!title || !scenario) {
      return { ok: false, error: `${where} case study ${i + 1} needs a title and scenario.` }
    }
    const analysis = parseSections(raw.analysis, `${where} case study ${i + 1} analysis`)
    if (!analysis.ok) return analysis
    const takeaway = optionalText(raw.takeaway)
    cases.push({ title, scenario, analysis: analysis.sections, ...(takeaway ? { takeaway } : {}) })
  }
  return { ok: true, value: cases }
}

function parseSources(value: unknown, where: string): { ok: true; value: LearnSource[] } | { ok: false; error: string } {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, error: `${where} must contain at least one source.` }
  }

  const sources: LearnSource[] = []
  for (let i = 0; i < value.length; i += 1) {
    const raw = value[i]
    const label = isRecord(raw) ? optionalText(raw.label) : undefined
    if (!label) return { ok: false, error: `${where} source ${i + 1} has no label.` }
    const url = optionalText(raw.url)
    if (url) {
      try {
        const parsed = new URL(url)
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('unsupported protocol')
      } catch {
        return { ok: false, error: `${where} source ${i + 1} has an invalid web URL.` }
      }
    }
    const note = optionalText(raw.note)
    sources.push({ label, ...(url ? { url } : {}), ...(note ? { note } : {}) })
  }
  return { ok: true, value: sources }
}

function parseLearn(value: unknown, where: string): LearnParseResult {
  if (value === undefined || value === null) return { ok: true, learn: undefined }
  if (!isRecord(value) || !LEARN_KINDS.includes(value.kind as never)) {
    return { ok: false, error: `${where} Learn support must be either "concise" or "briefing".` }
  }

  const learn: LearnContent = { kind: value.kind as LearnContent['kind'] }
  const overview = optionalText(value.overview)
  if (overview) learn.overview = overview

  if (value.sections !== undefined) {
    const sections = parseSections(value.sections, `${where} Learn`)
    if (!sections.ok) return sections
    learn.sections = sections.sections
  }
  if (value.caseStudies !== undefined) {
    const cases = parseCaseStudies(value.caseStudies, `${where} Learn`)
    if (!cases.ok) return cases
    learn.caseStudies = cases.value
  }
  if (value.limitations !== undefined) {
    const limitations = parseTextList(value.limitations, `${where} Learn limitations`)
    if (!limitations.ok) return limitations
    learn.limitations = limitations.value
  }
  if (value.sources !== undefined) {
    const sources = parseSources(value.sources, `${where} Learn sources`)
    if (!sources.ok) return sources
    learn.sources = sources.value
  }

  if (!learn.overview && !learn.sections && !learn.caseStudies && !learn.limitations && !learn.sources) {
    return { ok: false, error: `${where} Learn support is empty.` }
  }

  return { ok: true, learn }
}

/**
 * Import validation. An import replaces the whole library, so a
 * structurally plausible but semantically wrong file must be rejected here
 * rather than silently becoming the record.
 */
export function parseLibrary(value: unknown): ParseResult {
  if (typeof value !== 'object' || value === null) {
    return { ok: false, error: 'That file is not an Argus export. The top level should be an object.' }
  }
  const raw = value as Record<string, unknown>
  if (!Array.isArray(raw.topics)) {
    return { ok: false, error: 'That file has no "topics" list, so there is nothing to import.' }
  }

  const topics: Topic[] = []
  for (let i = 0; i < raw.topics.length; i += 1) {
    const t = raw.topics[i] as Record<string, unknown>
    const where = `Topic ${i + 1}`

    if (typeof t?.title !== 'string' || !t.title.trim()) {
      return { ok: false, error: `${where} has no title.` }
    }
    if (typeof t.scope !== 'string' || !t.scope.trim()) {
      return { ok: false, error: `${where} ("${t.title}") has no scope, so its boundary is undefined. Every Argus topic needs one.` }
    }
    if (!Array.isArray(t.items) || t.items.length === 0) {
      return { ok: false, error: `${where} ("${t.title}") has no items to test.` }
    }
    const items = t.items.map((item) => item as Record<string, unknown>)
    if (
      items.some(
        (item) =>
          typeof item?.prompt !== 'string' ||
          typeof item?.answer !== 'string' ||
          !String(item.prompt).trim() ||
          !String(item.answer).trim(),
      )
    ) {
      return { ok: false, error: `${where} ("${t.title}") has an item missing a prompt or an answer.` }
    }

    const learn = parseLearn(t.learn, `${where} ("${t.title}")`)
    if (!learn.ok) return learn

    const track = TRACKS.includes(t.track as never) ? (t.track as Topic['track']) : 'learning'
    let status = STATUSES.includes(t.status as never) ? (t.status as Topic['status']) : 'unstarted'
    const completedAt = typeof t.completedAt === 'string' ? t.completedAt : null
    // A completed or decayed topic without a completion date would be counted
    // in one place and missing from another. Demote rather than display a
    // record that does not exist.
    if (!completedAt && (status === 'completed' || status === 'decayed')) status = 'drilled'

    topics.push({
      id: typeof t.id === 'string' && t.id ? t.id : `imported-${i}-${Date.now()}`,
      title: t.title.trim(),
      scope: t.scope.trim(),
      track,
      items: items.map((item) => ({
        prompt: String(item.prompt).trim(),
        answer: String(item.answer).trim(),
      })),
      ...(learn.learn ? { learn: learn.learn } : {}),
      status,
      createdAt: typeof t.createdAt === 'string' ? t.createdAt : new Date().toISOString(),
      drilledAt: typeof t.drilledAt === 'string' ? t.drilledAt : null,
      learningAt:
        typeof t.learningAt === 'string'
          ? t.learningAt
          : status === 'learning' && typeof t.lastPracticedAt === 'string'
            ? t.lastPracticedAt
            : null,
      completedAt,
      lastTestedAt:
        typeof t.lastTestedAt === 'string'
          ? t.lastTestedAt
          : typeof t.lastPracticedAt === 'string'
            ? t.lastPracticedAt
            : null,
      spotCheckedAt:
        typeof t.spotCheckedAt === 'string'
          ? t.spotCheckedAt
          : status === 'completed' && typeof t.lastPracticedAt === 'string'
            ? t.lastPracticedAt
            : null,
      history: Array.isArray(t.history) ? (t.history as Topic['history']) : [],
    })
  }

  return { ok: true, library: { version: 4, topics } }
}

export function exportFilename(now: Date = new Date()): string {
  return `argus-library-${now.toISOString().slice(0, 10)}.json`
}
