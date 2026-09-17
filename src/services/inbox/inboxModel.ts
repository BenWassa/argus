/**
 * The content inbox record, and nothing else.
 *
 * This module is deliberately isolated from the learning library. A content
 * request is intent: it has no scope, no scored items, no status ladder, no
 * scheduler state and no evidence. It is never a Topic, and nothing here may
 * grow into one. Turning a request into curriculum is an editorial act that
 * happens in the repository, through review.
 */

/**
 * The tracks a request may hint at. Declared here rather than imported from the
 * library types so the inbox has no dependency on the learning model at all;
 * `inbox/boundary.test.ts` proves the two lists stay in step.
 */
export const TRACK_HINTS = ['learning', 'survival', 'tradecraft'] as const
export type TrackHint = (typeof TRACK_HINTS)[number]

export const REQUEST_STATUSES = ['pending', 'added'] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

/** Long enough for a URL plus a note, short enough to stay a capture. */
export const CAPTURE_TEXT_MAX = 2000

/** More than this in one ingestion result means something was mis-split. */
export const MAX_TOPIC_IDS = 20

export interface ContentRequest {
  /** Firestore document id. Queue identity only; never a curriculum id. */
  id: string
  text: string
  status: RequestStatus
  trackHint: TrackHint | null
  /** ISO time, or null while a server timestamp is still resolving. */
  createdAt: string | null
  topicIds: string[]
  addedAt: string | null
}

export interface CaptureDraft {
  text: string
  trackHint: TrackHint | null
}

export function isTrackHint(value: unknown): value is TrackHint {
  return typeof value === 'string' && (TRACK_HINTS as readonly string[]).includes(value)
}

/**
 * Capture accepts one plain value: an idea, a URL, or a URL plus a note. It is
 * trimmed and its line endings normalized, and that is all. Nothing here tries
 * to interpret, classify or expand what was typed.
 */
export function normalizeCaptureText(raw: string): string {
  return raw.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').trim()
}

export type CaptureValidation =
  | { ok: true; draft: CaptureDraft }
  | { ok: false; error: string }

export function validateCapture(text: string, trackHint: TrackHint | null): CaptureValidation {
  const normalized = normalizeCaptureText(text)
  if (!normalized) {
    return { ok: false, error: 'Type what you want to learn first.' }
  }
  if (normalized.length > CAPTURE_TEXT_MAX) {
    return {
      ok: false,
      error: `That is longer than the ${CAPTURE_TEXT_MAX} characters a capture holds. Keep the idea or link and drop the rest.`,
    }
  }
  if (trackHint !== null && !isTrackHint(trackHint)) {
    return { ok: false, error: 'That is not one of the Argus tracks.' }
  }
  return { ok: true, draft: { text: normalized, trackHint } }
}

/**
 * The exact field set a new pending request may carry. Security Rules enforce
 * the same shape; this keeps the client from ever attempting a write the rules
 * would have to reject.
 */
export function pendingRequestFields(draft: CaptureDraft): {
  text: string
  status: 'pending'
  trackHint: TrackHint | null
} {
  return { text: draft.text, status: 'pending', trackHint: draft.trackHint }
}

export type TopicIdsValidation =
  | { ok: true; topicIds: string[] }
  | { ok: false; error: string }

/**
 * A request becomes `added` only for real, shipped topic ids. Firestore rules
 * can check that the list is non-empty; only something holding the catalog can
 * check that the ids mean anything, so ingestion checks it here too.
 */
export function validateTopicIds(value: unknown, shippedIds: readonly string[]): TopicIdsValidation {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, error: 'Mark a request added only with at least one shipped topic id.' }
  }
  if (value.length > MAX_TOPIC_IDS) {
    return { ok: false, error: `A single request cannot resolve into more than ${MAX_TOPIC_IDS} topics.` }
  }
  const topicIds: string[] = []
  for (const entry of value) {
    if (typeof entry !== 'string' || !entry.trim()) {
      return { ok: false, error: 'Topic ids must be non-empty strings.' }
    }
    const id = entry.trim()
    if (topicIds.includes(id)) return { ok: false, error: `Repeated topic id "${id}".` }
    if (!shippedIds.includes(id)) {
      return { ok: false, error: `"${id}" is not a shipped Argus topic, so the request has not shipped yet.` }
    }
    topicIds.push(id)
  }
  return { ok: true, topicIds }
}

/** A value that may be a Firestore Timestamp, an ISO string, or absent. */
type TimestampLike = { toDate: () => Date } | string | null | undefined

export function toIsoTimestamp(value: unknown): string | null {
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate()
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }
  return null
}

/**
 * Read one stored record defensively. The inbox is remote state that a rule
 * change or a hand edit could leave malformed; a bad record is dropped from the
 * queue rather than allowed to break the Library it is displayed beside.
 */
export function parseContentRequest(id: string, data: unknown): ContentRequest | null {
  if (!id || typeof data !== 'object' || data === null) return null
  const raw = data as Record<string, unknown> & { createdAt?: TimestampLike; addedAt?: TimestampLike }

  const text = typeof raw.text === 'string' ? raw.text.trim() : ''
  if (!text) return null
  if (raw.status !== 'pending' && raw.status !== 'added') return null

  const topicIds = Array.isArray(raw.topicIds)
    ? raw.topicIds.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : []

  return {
    id,
    text,
    status: raw.status,
    trackHint: isTrackHint(raw.trackHint) ? raw.trackHint : null,
    createdAt: toIsoTimestamp(raw.createdAt),
    topicIds,
    addedAt: toIsoTimestamp(raw.addedAt),
  }
}

/**
 * The queue as the Library shows it: pending only, newest first. A request with
 * no resolved server timestamp yet is treated as the newest, because it is the
 * one that was just typed.
 */
export function pendingQueue(requests: ContentRequest[]): ContentRequest[] {
  return requests
    .filter((request) => request.status === 'pending')
    .sort((a, b) => {
      if (a.createdAt === b.createdAt) return a.id.localeCompare(b.id)
      if (!a.createdAt) return -1
      if (!b.createdAt) return 1
      return b.createdAt.localeCompare(a.createdAt)
    })
}

/** Ingestion order: oldest first, so the backlog is worked in the order it grew. */
export function ingestionOrder(requests: ContentRequest[]): ContentRequest[] {
  return [...pendingQueue(requests)].reverse()
}
