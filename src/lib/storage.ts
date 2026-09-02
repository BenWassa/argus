import { STATUSES, TRACKS, type Library, type Topic } from './types'
import { seedLibrary } from './seed'

const KEY = 'argus.library.v3'
const LEGACY_KEY = 'argus.library.v2'

export function loadLibrary(): Library {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY)
    if (!raw) return seedLibrary()
    const parsed = parseLibrary(JSON.parse(raw))
    return parsed.ok ? parsed.library : seedLibrary()
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
  } catch {
    /* nothing to recover from */
  }
}

export type ParseResult =
  | { ok: true; library: Library }
  | { ok: false; error: string }

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

  return { ok: true, library: { version: 3, topics } }
}

export function exportFilename(now: Date = new Date()): string {
  return `argus-library-${now.toISOString().slice(0, 10)}.json`
}
