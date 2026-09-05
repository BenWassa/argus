import {
  CUE_STATES,
  ITEM_DIRECTIONS,
  ITEM_KINDS,
  LEARN_KINDS,
  LESSON_SUPPORTS,
  STATUSES,
  TRACKS,
  type CurrentLibrary,
  type DirectionEvidence,
  type IdentifiedItem,
  type ItemCueEvidence,
  type ItemEvidenceStore,
  type ItemLessonStore,
  type LearnBlock,
  type LearnCaseStudy,
  type LearnContent,
  type LearnSection,
  type LearnSource,
  type MorseCharacterLearnItem,
  type Topic,
  TOPIC_ORIGINS,
} from './types'
import { migratedItemId } from './items'
import { seedLibrary } from './seed'
import {
  NO_RECONCILIATION,
  SHIPPED_CATALOG_TOPIC_IDS,
  inferredOrigin,
  reconcileCatalog,
  type CatalogReconciliation,
} from './catalog'

const KEY = 'argus.library.v5'
const LEGACY_KEYS = ['argus.library.v4', 'argus.library.v3', 'argus.library.v2'] as const

/** A library holding nothing, and expecting nothing. Reset means reset. */
export function emptyLibrary(): CurrentLibrary {
  return { version: 5, topics: [], catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS].sort() }
}

function freshSeedLibrary(): CurrentLibrary {
  const migrated = parseLibrary(seedLibrary())
  if (!migrated.ok) return emptyLibrary()
  return {
    ...migrated.library,
    catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS].sort(),
  }
}

const SEEDED_MORSE_ID = 'international-morse-letters-printed'

/** Absorb the temporary #23 control topic without duplicating it or losing its
 * stable item evidence/history. Only the exact shipped 26-row identity is
 * upgraded; arbitrary user-authored Morse topics are left alone. */
export function absorbSeededMorseBaseline(library: CurrentLibrary): CurrentLibrary {
  const finalTopic = freshSeedLibraryUnreconciled().topics.find((topic) => topic.id === SEEDED_MORSE_ID)
  if (!finalTopic) return library
  const topics = library.topics.map((topic) => {
    if (topic.id !== SEEDED_MORSE_ID || topic.items.length !== finalTopic.items.length) return topic
    const sameRows = topic.items.every((item, index) =>
      item.id === finalTopic.items[index].id &&
      item.prompt === finalTopic.items[index].prompt &&
      item.answer === finalTopic.items[index].answer,
    )
    if (!sameRows) return topic
    const hadForwardCompletion = topic.completedAt !== null &&
      topic.items.some((item) => item.kind !== 'bidirectional')
    return {
      ...topic,
      title: finalTopic.title,
      scope: finalTopic.scope,
      items: finalTopic.items,
      learn: finalTopic.learn,
      // Absorption is the explicit statement that this record is the shipped
      // topic, so it also settles provenance for catalog reconciliation.
      origin: 'catalog' as const,
      // A #23 completion is retained in history, but cannot remain the active
      // completion state for the stronger bidirectional claim.
      ...(hadForwardCompletion ? { status: 'drilled' as const, completedAt: null } : {}),
    }
  })
  return { ...library, topics }
}

function freshSeedLibraryUnreconciled(): CurrentLibrary {
  const parsed = parseLibrary(seedLibrary())
  return parsed.ok ? parsed.library : { version: 5, topics: [] }
}

/**
 * Everything a stored or imported library goes through before it becomes the
 * live record: the one explicit Morse migration, then delivery of shipped
 * catalog topics this library has never been offered. Both are append- or
 * migration-only; neither may rewrite unrelated learner state.
 */
export function reconcileLoadedLibrary(
  library: CurrentLibrary,
  now: Date = new Date(),
): { library: CurrentLibrary; report: CatalogReconciliation } {
  return reconcileCatalog(absorbSeededMorseBaseline(library), now)
}

export interface LoadedLibrary {
  library: CurrentLibrary
  report: CatalogReconciliation
}

export function loadLibraryWithReport(now: Date = new Date()): LoadedLibrary {
  try {
    const found = [KEY, ...LEGACY_KEYS]
      .map((key) => ({ key, raw: localStorage.getItem(key) }))
      .find((entry) => entry.raw !== null)
    if (!found?.raw) return { library: freshSeedLibrary(), report: NO_RECONCILIATION }

    const parsed = parseLibrary(JSON.parse(found.raw))
    if (!parsed.ok) return { library: freshSeedLibrary(), report: NO_RECONCILIATION }

    // Promote a valid legacy record immediately. This makes the migration
    // durable even before the provider's first effect runs.
    const reconciled = reconcileLoadedLibrary(parsed.library, now)
    if (found.key !== KEY || reconciled.library !== parsed.library) saveLibrary(reconciled.library)
    return reconciled
  } catch {
    return { library: freshSeedLibrary(), report: NO_RECONCILIATION }
  }
}

export function loadLibrary(): CurrentLibrary {
  return loadLibraryWithReport().library
}

export function saveLibrary(library: CurrentLibrary): void {
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
  | { ok: true; library: CurrentLibrary }
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

function parseMorsePacket(value: Record<string, unknown>, where: string): { ok: true; block: LearnBlock } | { ok: false; error: string } {
  if (!Array.isArray(value.characters) || value.characters.length === 0) {
    return { ok: false, error: `${where} Morse packet must contain at least one character.` }
  }

  const characters: MorseCharacterLearnItem[] = []
  const seen = new Set<string>()
  for (let i = 0; i < value.characters.length; i += 1) {
    const raw = value.characters[i]
    const glyph = isRecord(raw) ? optionalText(raw.glyph) : undefined
    const pattern = isRecord(raw) ? optionalText(raw.pattern) : undefined
    const mnemonicId = isRecord(raw) ? optionalText(raw.mnemonicId) : undefined
    const audioText = isRecord(raw) ? optionalText(raw.audioText) : undefined
    const textLabel = isRecord(raw) ? optionalText(raw.textLabel) : undefined

    if (!glyph || !/^[A-Z]$/.test(glyph)) {
      return { ok: false, error: `${where} Morse character ${i + 1} needs one uppercase A–Z glyph.` }
    }
    if (!pattern || !/^[.-]+$/.test(pattern)) {
      return { ok: false, error: `${where} Morse character ${i + 1} needs canonical dot/dash notation.` }
    }
    if (!mnemonicId || !audioText || !textLabel) {
      return { ok: false, error: `${where} Morse character ${i + 1} needs mnemonicId, audioText and textLabel.` }
    }
    if (audioText !== glyph) {
      return { ok: false, error: `${where} Morse character ${i + 1} audioText must identify the same glyph.` }
    }
    if (seen.has(glyph)) {
      return { ok: false, error: `${where} Morse packet repeats glyph ${glyph}.` }
    }
    seen.add(glyph)
    characters.push({ glyph, pattern, mnemonicId, audioText, textLabel })
  }

  return { ok: true, block: { type: 'morse-character-packet', characters } }
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

  if (value.type === 'morse-character-packet') return parseMorsePacket(value, where)

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

function parseLibraryVersion(value: unknown): { ok: true; version: 2 | 3 | 4 | 5 } | { ok: false; error: string } {
  // Pre-versioned exports were accepted by earlier Argus parsers. Treat them
  // as v4-shaped input so that upgrade remains backward compatible.
  if (value === undefined) return { ok: true, version: 4 }
  if (value === 2 || value === 3 || value === 4 || value === 5) return { ok: true, version: value }
  return { ok: false, error: `Unsupported Argus library version: ${String(value)}.` }
}

function parseItems(
  value: unknown,
  where: string,
  topicId: string,
  sourceVersion: 2 | 3 | 4 | 5,
): { ok: true; items: IdentifiedItem[] } | { ok: false; error: string } {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, error: `${where} has no items to test.` }
  }

  const items: IdentifiedItem[] = []
  const ids = new Set<string>()
  for (let i = 0; i < value.length; i += 1) {
    const raw = value[i]
    const prompt = isRecord(raw) ? optionalText(raw.prompt) : undefined
    const answer = isRecord(raw) ? optionalText(raw.answer) : undefined
    if (!prompt || !answer) {
      return { ok: false, error: `${where} has an item missing a prompt or an answer.` }
    }

    let id: string
    let kind: IdentifiedItem['kind']
    if (sourceVersion === 5) {
      id = optionalText(raw.id) ?? ''
      if (!id) return { ok: false, error: `${where} item ${i + 1} has no stable id.` }
      if (!ITEM_KINDS.includes(raw.kind as never)) {
        return { ok: false, error: `${where} item ${i + 1} has unsupported item semantics.` }
      }
      kind = raw.kind as IdentifiedItem['kind']
    } else {
      // v4 and earlier had no durable item identity or typed direction. Migrate
      // once, deterministically, so re-importing the same record yields the
      // same v5 ids and every legacy item preserves forward behaviour.
      id = migratedItemId(topicId, i)
      kind = 'forward'
    }

    if (ids.has(id)) return { ok: false, error: `${where} repeats item id "${id}".` }
    ids.add(id)
    items.push({ id, kind, prompt, answer })
  }
  return { ok: true, items }
}

function nonNegativeInteger(value: unknown): number | null {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : null
}

function parseDirectionEvidence(value: unknown, where: string): { ok: true; value: DirectionEvidence } | { ok: false; error: string } {
  if (!isRecord(value)) return { ok: false, error: `${where} must be an evidence object.` }
  const attempts = nonNegativeInteger(value.attempts)
  const correct = nonNegativeInteger(value.correct)
  const consecutiveCorrect = nonNegativeInteger(value.consecutiveCorrect)
  if (attempts === null || correct === null || consecutiveCorrect === null) {
    return { ok: false, error: `${where} counts must be non-negative integers.` }
  }
  if (correct > attempts || consecutiveCorrect > correct) {
    return { ok: false, error: `${where} has impossible correct/consecutive counts.` }
  }

  const lastAt = value.lastAt === null ? null : optionalText(value.lastAt)
  if (value.lastAt !== null && !lastAt) return { ok: false, error: `${where} lastAt must be text or null.` }
  const lastLatencyMs = value.lastLatencyMs === null
    ? null
    : typeof value.lastLatencyMs === 'number' && Number.isFinite(value.lastLatencyMs) && value.lastLatencyMs >= 0
      ? value.lastLatencyMs
      : undefined
  if (lastLatencyMs === undefined) {
    return { ok: false, error: `${where} lastLatencyMs must be a non-negative number or null.` }
  }

  return {
    ok: true,
    value: { attempts, correct, consecutiveCorrect, lastAt: lastAt ?? null, lastLatencyMs },
  }
}

function parseItemEvidence(
  value: unknown,
  where: string,
  items: IdentifiedItem[],
  sourceVersion: 2 | 3 | 4 | 5,
): { ok: true; value: ItemEvidenceStore } | { ok: false; error: string } {
  if (sourceVersion < 5) return { ok: true, value: {} }
  if (value === undefined) return { ok: true, value: {} }
  if (!isRecord(value)) return { ok: false, error: `${where} itemEvidence must be an object keyed by item id.` }

  const liveIds = new Set(items.map((item) => item.id))
  const evidence: ItemEvidenceStore = {}
  for (const [itemId, rawEvidence] of Object.entries(value)) {
    if (!liveIds.has(itemId)) {
      return { ok: false, error: `${where} itemEvidence references unknown item id "${itemId}".` }
    }
    if (!isRecord(rawEvidence) || !CUE_STATES.includes(rawEvidence.cue as never)) {
      return { ok: false, error: `${where} itemEvidence for "${itemId}" has an unsupported cue state.` }
    }
    if (!isRecord(rawEvidence.directions)) {
      return { ok: false, error: `${where} itemEvidence for "${itemId}" needs a directions object.` }
    }

    const directions: ItemCueEvidence['directions'] = {}
    for (const [direction, rawDirection] of Object.entries(rawEvidence.directions)) {
      if (!ITEM_DIRECTIONS.includes(direction as never)) {
        return { ok: false, error: `${where} itemEvidence for "${itemId}" uses unknown direction "${direction}".` }
      }
      const parsed = parseDirectionEvidence(rawDirection, `${where} itemEvidence for "${itemId}" / ${direction}`)
      if (!parsed.ok) return parsed
      directions[direction as keyof typeof directions] = parsed.value
    }

    evidence[itemId] = {
      cue: rawEvidence.cue as ItemCueEvidence['cue'],
      directions,
    }
  }
  return { ok: true, value: evidence }
}

/**
 * Formative Learn-lesson progress (#48).
 *
 * Additive within v5 rather than a new schema version, because there is nothing
 * to migrate: a record written before the guided lesson existed has no lesson
 * progress, and `{}` is exactly that. Validated as strictly as cue evidence —
 * unknown item ids and unknown support levels are rejected rather than dropped,
 * so an import either round-trips losslessly or says why it cannot.
 */
function parseLessonProgress(
  value: unknown,
  where: string,
  items: IdentifiedItem[],
  sourceVersion: 2 | 3 | 4 | 5,
): { ok: true; value: ItemLessonStore } | { ok: false; error: string } {
  // A pre-v5 record has no durable item identity to key lesson progress by, so
  // it cannot have carried any. Ignore whatever is there rather than rejecting
  // the import over a field that predates the ids it would have to reference.
  if (sourceVersion < 5) return { ok: true, value: {} }
  if (value === undefined) return { ok: true, value: {} }
  if (!isRecord(value)) {
    return { ok: false, error: `${where} lessonProgress must be an object keyed by item id.` }
  }

  const liveIds = new Set(items.map((item) => item.id))
  const progress: ItemLessonStore = {}
  for (const [itemId, support] of Object.entries(value)) {
    if (!liveIds.has(itemId)) {
      return { ok: false, error: `${where} lessonProgress references unknown item id "${itemId}".` }
    }
    if (!LESSON_SUPPORTS.includes(support as never)) {
      return {
        ok: false,
        error: `${where} lessonProgress for "${itemId}" has an unsupported lesson support level.`,
      }
    }
    progress[itemId] = support as ItemLessonStore[string]
  }
  return { ok: true, value: progress }
}

/**
 * Import validation and migration. An import replaces the whole library, so a
 * structurally plausible but semantically wrong file must be rejected here
 * rather than silently becoming the record. Every accepted input becomes v5.
 */
export function parseLibrary(value: unknown): ParseResult {
  if (typeof value !== 'object' || value === null) {
    return { ok: false, error: 'That file is not an Argus export. The top level should be an object.' }
  }
  const raw = value as Record<string, unknown>
  const version = parseLibraryVersion(raw.version)
  if (!version.ok) return version
  if (!Array.isArray(raw.topics)) {
    return { ok: false, error: 'That file has no "topics" list, so there is nothing to import.' }
  }

  const topics: Topic[] = []
  for (let i = 0; i < raw.topics.length; i += 1) {
    const t = raw.topics[i]
    const where = `Topic ${i + 1}`
    if (!isRecord(t)) return { ok: false, error: `${where} is not a topic object.` }

    const title = optionalText(t.title)
    if (!title) return { ok: false, error: `${where} has no title.` }
    const scope = optionalText(t.scope)
    if (!scope) {
      return { ok: false, error: `${where} ("${title}") has no scope, so its boundary is undefined. Every Argus topic needs one.` }
    }

    const topicId = optionalText(t.id) ?? `imported-topic-${i + 1}`
    const items = parseItems(t.items, `${where} ("${title}")`, topicId, version.version)
    if (!items.ok) return items

    const learn = parseLearn(t.learn, `${where} ("${title}")`)
    if (!learn.ok) return learn

    const itemEvidence = parseItemEvidence(
      t.itemEvidence,
      `${where} ("${title}")`,
      items.items,
      version.version,
    )
    if (!itemEvidence.ok) return itemEvidence

    const lessonProgress = parseLessonProgress(
      t.lessonProgress,
      `${where} ("${title}")`,
      items.items,
      version.version,
    )
    if (!lessonProgress.ok) return lessonProgress

    const track = TRACKS.includes(t.track as never) ? (t.track as Topic['track']) : 'learning'
    let status = STATUSES.includes(t.status as never) ? (t.status as Topic['status']) : 'unstarted'
    const completedAt = typeof t.completedAt === 'string' ? t.completedAt : null
    // A completed or decayed topic without a completion date would be counted
    // in one place and missing from another. Demote rather than display a
    // record that does not exist.
    if (!completedAt && (status === 'completed' || status === 'decayed')) status = 'drilled'

    topics.push({
      id: topicId,
      title,
      scope,
      track,
      items: items.items,
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
      itemEvidence: itemEvidence.value,
      lessonProgress: lessonProgress.value,
      origin: TOPIC_ORIGINS.includes(t.origin as never)
        ? (t.origin as Topic['origin'])
        : undefined,
    })
  }

  // Provenance is resolved once, here, so every topic storage hands out has an
  // answer. A record written before provenance existed is inferred from what
  // the catalog ships; anything that does not match exactly stays the user's.
  for (const topic of topics) {
    if (!topic.origin) topic.origin = inferredOrigin(topic)
  }

  const catalogDelivered = parseCatalogDelivered(raw.catalogDelivered)

  return {
    ok: true,
    library: {
      version: 5,
      topics,
      ...(catalogDelivered ? { catalogDelivered } : {}),
    },
  }
}

/**
 * `undefined` and `[]` are different answers: an absent list means the record
 * predates delivery tracking and should be inferred, while an empty list is a
 * library that has genuinely been offered nothing.
 */
function parseCatalogDelivered(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const ids = new Set<string>()
  for (const entry of value) {
    const id = optionalText(entry)
    if (id) ids.add(id)
  }
  return [...ids].sort()
}

export function exportFilename(now: Date = new Date()): string {
  return `argus-library-${now.toISOString().slice(0, 10)}.json`
}
