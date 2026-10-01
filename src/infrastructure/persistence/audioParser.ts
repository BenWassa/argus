import {
  AUDIO_DRILL_KINDS,
  COPY_NORMALIZERS,
  LOCAL_AUDIO_PATTERN,
  MAX_RESPONSE_FIELDS,
  MIN_RESPONSE_FIELDS,
  type AudioStimulus,
  type ItemResponse,
} from '../../domain/audio/audio'
import type { AudioEvidence, AudioEvidenceStore } from '../../domain/audio/evidence'

/**
 * Import-boundary validation for the audio primitives (#151). Same contract as
 * the rest of the parser: validate, never interpret, and never clamp a counter
 * into something a real learner did not do.
 */
type Raw = Record<string, unknown>
type Result<T> = { ok: true; value: T } | { ok: false; error: string }

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function parseAudio(value: unknown, where: string): Result<AudioStimulus> {
  if (!isRecord(value)) return { ok: false, error: `${where} audio is not an object.` }
  const assetId = text(value.assetId)
  if (!assetId) return { ok: false, error: `${where} audio needs an assetId for its provenance record.` }
  const src = typeof value.src === 'string' ? value.src : ''
  if (!LOCAL_AUDIO_PATTERN.test(src)) {
    return {
      ok: false,
      error: `${where} audio must be a local shipped file under /media/audio/ with an audio extension; remote addresses are not allowed.`,
    }
  }
  const transcript = text(value.transcript)
  if (!transcript) {
    return { ok: false, error: `${where} audio needs its canonical transcript; speech may not be the only carrier of its content.` }
  }
  if (!AUDIO_DRILL_KINDS.includes(value.drill as never)) {
    return { ok: false, error: `${where} audio drill must be one of: ${AUDIO_DRILL_KINDS.join(', ')}.` }
  }
  return { ok: true, value: { assetId, src, transcript, drill: value.drill as AudioStimulus['drill'] } }
}

export function parseResponse(value: unknown, where: string): Result<ItemResponse> {
  if (!isRecord(value) || typeof value.mode !== 'string') {
    return { ok: false, error: `${where} response needs a mode.` }
  }
  if (value.mode === 'copy') {
    if (!COPY_NORMALIZERS.includes(value.normalizer as never)) {
      return { ok: false, error: `${where} copy response normalizer must be one of: ${COPY_NORMALIZERS.join(', ')}.` }
    }
    return { ok: true, value: { mode: 'copy', normalizer: value.normalizer as 'compact' | 'words' } }
  }
  if (value.mode === 'fields') {
    if (
      !Array.isArray(value.fields) ||
      value.fields.length < MIN_RESPONSE_FIELDS ||
      value.fields.length > MAX_RESPONSE_FIELDS
    ) {
      return { ok: false, error: `${where} fields response needs ${MIN_RESPONSE_FIELDS}–${MAX_RESPONSE_FIELDS} fields.` }
    }
    const fields: { label: string; expected: string }[] = []
    for (const raw of value.fields) {
      const label = isRecord(raw) ? text(raw.label) : undefined
      const expected = isRecord(raw) ? text(raw.expected) : undefined
      if (!label || !expected) return { ok: false, error: `${where} every field needs a label and an expected value.` }
      fields.push({ label, expected })
    }
    if (new Set(fields.map((field) => field.label)).size !== fields.length) {
      return { ok: false, error: `${where} fields response repeats a label.` }
    }
    return { ok: true, value: { mode: 'fields', fields } }
  }
  return { ok: false, error: `${where} response mode "${value.mode}" is not supported.` }
}

function count(value: unknown): number | null {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : null
}

/**
 * Listening evidence. Present-but-invalid is a hard failure: a clamped counter is
 * fabricated learner progress. Every id must be a live item that is actually
 * heard, and the counters must be ones a real run could have written.
 */
export function parseAudioEvidence(
  value: unknown,
  where: string,
  heardItemIds: Set<string>,
): Result<AudioEvidenceStore | undefined> {
  if (value === undefined || value === null) return { ok: true, value: undefined }
  if (!isRecord(value)) return { ok: false, error: `${where} audioEvidence must be an object keyed by item id.` }
  const store: AudioEvidenceStore = {}
  for (const [itemId, raw] of Object.entries(value)) {
    if (!heardItemIds.has(itemId)) {
      return { ok: false, error: `${where} audioEvidence references "${itemId}", which is not an item with audio.` }
    }
    if (!isRecord(raw)) return { ok: false, error: `${where} audioEvidence for "${itemId}" is not an object.` }
    const attempts = count(raw.attempts)
    const correct = count(raw.correct)
    const unassistedCorrect = count(raw.unassistedCorrect)
    const assistedAttempts = count(raw.assistedAttempts)
    if (attempts === null || correct === null || unassistedCorrect === null || assistedAttempts === null) {
      return { ok: false, error: `${where} audioEvidence counts for "${itemId}" must be non-negative integers.` }
    }
    // What a real run can have written: nothing exceeds the attempts it came from,
    // an unaided correct answer is a correct answer, and assisted attempts are attempts.
    if (correct > attempts || assistedAttempts > attempts || unassistedCorrect > correct) {
      return { ok: false, error: `${where} audioEvidence for "${itemId}" has counts no real run could produce.` }
    }
    // Every correct answer is either unaided or assisted; an unaided one was not assisted.
    if (unassistedCorrect > attempts - assistedAttempts) {
      return { ok: false, error: `${where} audioEvidence for "${itemId}" counts more unaided answers than unassisted attempts.` }
    }
    const lastAt = typeof raw.lastAt === 'string' && !Number.isNaN(Date.parse(raw.lastAt)) ? raw.lastAt : null
    const latency = raw.lastLatencyMs === null || raw.lastLatencyMs === undefined ? null : count(raw.lastLatencyMs)
    if (raw.lastLatencyMs !== null && raw.lastLatencyMs !== undefined && latency === null) {
      return { ok: false, error: `${where} audioEvidence latency for "${itemId}" must be a non-negative integer.` }
    }
    const evidence: AudioEvidence = {
      attempts,
      correct,
      unassistedCorrect,
      assistedAttempts,
      lastAt,
      lastLatencyMs: latency,
    }
    store[itemId] = evidence
  }
  return { ok: true, value: Object.keys(store).length > 0 ? store : undefined }
}
